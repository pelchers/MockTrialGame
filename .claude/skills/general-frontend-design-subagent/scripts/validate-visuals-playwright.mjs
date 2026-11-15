/**
 * General Frontend Design — Playwright Visual Validation Script
 *
 * Captures surface-appropriate screenshots for a concept pass, then checks the
 * Mode switcher, role picker and mock sign-in (references/mode-switcher.md).
 * Usage: node validate-visuals-playwright.mjs --pass-dir <dir> [--surface <surface>] [--strict]
 *
 * Surfaces and their viewports:
 *   website:           primary 1536x960, secondary 390x844
 *   vscode-extension:  primary 900x700,  secondary 600x700
 *   mobile-app:        primary 390x844,  secondary 360x640
 *   browser-extension: primary 400x600,  secondary 320x800
 *
 * Mode checks (written to report.playwright.json under "modeChecks"):
 *   - every root .html view has a visible [data-mode-switcher] that covers no control
 *     (checked at both viewports, at the top for fixed bars and scrolled to the bottom)
 *   - every mode and role in validation/handoff.json "modes" opens from ?mode=<id>&role=<id>
 *     and sets <html data-mode data-role>; one screenshot each in validation/modes/
 *   - the first signed-in mode's sign-in form (form[data-mock-signin]) signs in, and
 *     [data-mock-signout] signs out
 * Skipped when handoff.json sets "modeSwitcher": "none" or lists fewer than two modes and
 * no view has a switcher. --strict exits 1 when any mode check fails.
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';

const SURFACE_VIEWPORTS = {
  'website': {
    primary:   { width: 1536, height: 960, label: 'desktop' },
    secondary: { width: 390,  height: 844, label: 'mobile', deviceScaleFactor: 2 },
  },
  'vscode-extension': {
    primary:   { width: 900, height: 700, label: 'editor-panel' },
    secondary: { width: 600, height: 700, label: 'narrow-panel' },
  },
  'mobile-app': {
    primary:   { width: 390, height: 844, label: 'iphone-14', deviceScaleFactor: 2 },
    secondary: { width: 360, height: 640, label: 'small-phone', deviceScaleFactor: 2 },
  },
  'browser-extension': {
    primary:   { width: 400, height: 600, label: 'popup' },
    secondary: { width: 320, height: 800, label: 'sidebar' },
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { strict: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pass-dir' && args[i + 1]) parsed.passDir = args[++i];
    if (args[i] === '--surface' && args[i + 1]) parsed.surface = args[++i];
    if (args[i] === '--strict') parsed.strict = true;
  }
  if (!parsed.passDir) {
    console.error('Usage: node validate-visuals-playwright.mjs --pass-dir <dir> [--surface <surface>] [--strict]');
    process.exit(1);
  }
  parsed.surface = parsed.surface || 'website';
  if (!SURFACE_VIEWPORTS[parsed.surface]) {
    console.error(`Unknown surface: ${parsed.surface}. Valid: ${Object.keys(SURFACE_VIEWPORTS).join(', ')}`);
    process.exit(1);
  }
  return parsed;
}

async function captureViewport(page, passDir, viewportKey, config) {
  const dir = join(passDir, 'validation', viewportKey);
  mkdirSync(dir, { recursive: true });

  const viewportOpts = { width: config.width, height: config.height };
  await page.setViewportSize(viewportOpts);
  await page.waitForTimeout(1000); // allow animations to settle

  // Viewport-only screenshot
  await page.screenshot({
    path: join(dir, 'showcase-viewport.png'),
    clip: { x: 0, y: 0, width: config.width, height: config.height },
  });

  // Full-page screenshot
  await page.screenshot({
    path: join(dir, 'showcase.png'),
    fullPage: true,
  });

  return { viewportKey, label: config.label, width: config.width, height: config.height };
}

// ===== Mode switcher, role picker and mock sign-in checks =====

function readHandoff(absPassDir) {
  const p = join(absPassDir, 'validation', 'handoff.json');
  if (!existsSync(p)) return {};
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return {}; }
}

// Build a file URL for "view.html#hash" with optional query parameters before the hash.
function viewUrl(absPassDir, view, params) {
  const [file, hash] = String(view).split('#');
  let url = pathToFileURL(join(absPassDir, file)).href;
  const qs = new URLSearchParams(params || {}).toString();
  if (qs) url += `?${qs}`;
  if (hash) url += `#${hash}`;
  return url;
}

async function settle(page) {
  await page.waitForTimeout(350); // guards may redirect after load
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForTimeout(150);
}

// Runs in the page: does the switcher's visible button sit on any control?
// fixedOnly: count only controls inside fixed or sticky bars (they never scroll away).
function switcherOverlap(fixedOnly) {
  const sw = document.querySelector('[data-mode-switcher]');
  if (!sw) return { hasSwitcher: false };
  const toggle = sw.querySelector('[data-mode-switcher-toggle]') || sw;
  const r = toggle.getBoundingClientRect();
  const ts = getComputedStyle(toggle);
  const visible = r.width > 0 && r.height > 0 && ts.visibility !== 'hidden' && ts.display !== 'none';
  const inFixedBar = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const pos = getComputedStyle(n).position;
      if (pos === 'fixed' || pos === 'sticky') return true;
    }
    return false;
  };
  const hits = [];
  if (visible) {
    const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=link], [tabindex]:not([tabindex="-1"])';
    for (const el of document.querySelectorAll(sel)) {
      if (sw.contains(el) || el.contains(sw)) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      const w = Math.min(r.right, b.right) - Math.max(r.left, b.left);
      const h = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
      if (w <= 4 || h <= 4) continue;
      if (fixedOnly && !inFixedBar(el)) continue;
      const text = (el.innerText || el.getAttribute('aria-label') || el.value || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
      hits.push({ control: `${el.tagName.toLowerCase()} "${text}"`, overlapPx: [Math.round(w), Math.round(h)] });
    }
  }
  return { hasSwitcher: true, visible, hits };
}

// Runs in the page: scroll the window and every scrolling area to the bottom.
function scrollAllToBottom() {
  window.scrollTo(0, document.documentElement.scrollHeight);
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 4) {
      el.scrollTop = el.scrollHeight;
    }
  }
}

async function checkSwitcherOnPage(page, where, results) {
  const top = await page.evaluate(switcherOverlap, true);
  if (!top.hasSwitcher) {
    results.missing.push(where);
    return;
  }
  if (!top.visible) results.hidden.push(where);
  for (const hit of top.hits) results.overlaps.push({ where, at: 'top (fixed bars)', ...hit });
  await page.evaluate(scrollAllToBottom);
  await page.waitForTimeout(300);
  const bottom = await page.evaluate(switcherOverlap, false);
  for (const hit of bottom.hits || []) results.overlaps.push({ where, at: 'scrolled to bottom', ...hit });
}

// Fill a form's required fields with harmless test values.
function fillRequired(formSelector) {
  const form = document.querySelector(formSelector);
  if (!form) return false;
  for (const el of form.querySelectorAll('input, select, textarea')) {
    if (!el.required || el.disabled) continue;
    if (el.tagName === 'SELECT') {
      const opt = [...el.options].find((o) => o.value);
      if (opt) el.value = opt.value;
    } else if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = true;
    } else if (!el.value) {
      const byType = { email: 'test@example.com', password: 'Passw0rd!', tel: '5555550100', number: '1', url: 'https://example.com', date: '2026-01-01' };
      el.value = byType[el.type] || (el.minLength > 0 ? 'x'.repeat(el.minLength) : 'Test');
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  return true;
}

async function runModeChecks(browser, absPassDir, surface) {
  const handoff = readHandoff(absPassDir);
  const modes = Array.isArray(handoff.modes) ? handoff.modes : [];
  const results = {
    required: false, skipped: '', viewsChecked: 0, modesChecked: 0,
    missing: [], hidden: [], overlaps: [], modeResults: [], signInFlow: null,
    consoleErrors: [], failures: [],
  };
  if (handoff.modeSwitcher === 'none') {
    results.skipped = 'handoff.json says "modeSwitcher": "none" (single mode)';
    return results;
  }

  const views = readdirSync(absPassDir).filter((f) => f.toLowerCase().endsWith('.html')).sort();
  const viewports = SURFACE_VIEWPORTS[surface];
  const errors = new Set();
  const watch = (page) => {
    page.on('pageerror', (e) => errors.add(`pageerror: ${e.message}`.slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error') errors.add(`console: ${m.text()}`.slice(0, 200)); });
  };

  // 1. Every root view, both viewports, fresh state each time.
  let anySwitcher = false;
  for (const [key, config] of Object.entries(viewports)) {
    const context = await browser.newContext({ viewport: { width: config.width, height: config.height }, deviceScaleFactor: 1 });
    try {
      for (const view of views) {
        const page = await context.newPage();
        watch(page);
        try {
          await page.goto(viewUrl(absPassDir, view), { waitUntil: 'load', timeout: 20000 });
          await settle(page);
          const landed = decodeURIComponent(page.url().split('/').pop());
          const where = `${view} (${key} ${config.width}x${config.height}${landed.startsWith(view) ? '' : `, opened as ${landed}`})`;
          const before = results.missing.length;
          await checkSwitcherOnPage(page, where, results);
          if (results.missing.length === before) anySwitcher = true;
          results.viewsChecked += 1;
        } catch (err) {
          results.failures.push(`${view} (${key}): could not open: ${err.message}`);
        } finally {
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
  }

  results.required = modes.length >= 2 || anySwitcher;
  if (!results.required) {
    results.skipped = 'no modes in handoff.json and no [data-mode-switcher] on any view';
    results.missing = [];
    return results;
  }

  // 2. Every mode and role from its URL parameters (primary viewport).
  const primary = viewports.primary;
  const shotsDir = join(absPassDir, 'validation', 'modes');
  mkdirSync(shotsDir, { recursive: true });
  const context = await browser.newContext({ viewport: { width: primary.width, height: primary.height }, deviceScaleFactor: 1 });
  try {
    for (const mode of modes) {
      const roles = Array.isArray(mode.roles) && mode.roles.length ? mode.roles : [null];
      for (const role of roles) {
        const roleId = role ? (role.id || role) : '';
        const params = roleId ? { mode: mode.id, role: roleId } : { mode: mode.id };
        const name = roleId ? `${mode.id}--${roleId}` : mode.id;
        const view = (role && role.home) || mode.entry || 'index.html';
        const page = await context.newPage();
        watch(page);
        try {
          await page.goto(viewUrl(absPassDir, view, params), { waitUntil: 'load', timeout: 20000 });
          await settle(page);
          const state = await page.evaluate(() => ({ ...document.documentElement.dataset }));
          const ok = state.mode === mode.id && (!roleId || state.role === roleId);
          results.modeResults.push({ mode: mode.id, role: roleId, view, ok, got: { mode: state.mode, role: state.role, signedIn: state.signedIn } });
          if (!ok) results.failures.push(`mode ${name}: expected data-mode="${mode.id}"${roleId ? ` data-role="${roleId}"` : ''}, got data-mode="${state.mode}" data-role="${state.role}"`);
          await page.screenshot({ path: join(shotsDir, `${name}.png`), clip: { x: 0, y: 0, width: primary.width, height: primary.height } });
          await checkSwitcherOnPage(page, `${view} as ${name} (primary)`, results);
          results.modesChecked += 1;
        } catch (err) {
          results.failures.push(`mode ${name}: could not open ${view}: ${err.message}`);
        } finally {
          await page.close();
        }
      }
    }

    // 3. Normal sign-in through the first signed-in mode's form, then normal sign-out.
    const target = modes.find((m) => m.signedIn && m.signInView);
    if (target) {
      const page = await context.newPage();
      watch(page);
      const flow = { mode: target.id, signInView: target.signInView, steps: [] };
      try {
        const start = modes.find((m) => !m.signedIn);
        await page.goto(viewUrl(absPassDir, target.signInView, start ? { mode: start.id } : {}), { waitUntil: 'load', timeout: 20000 });
        await settle(page);
        const formSel = `form[data-mock-signin="${target.id}"]`;
        if (!(await page.evaluate(fillRequired, formSel))) {
          results.failures.push(`sign-in: no ${formSel} on ${target.signInView}`);
        } else {
          await Promise.all([
            page.waitForNavigation({ timeout: 10000 }).catch(() => null),
            page.evaluate((s) => { const f = document.querySelector(s); if (f.requestSubmit) f.requestSubmit(); else f.submit(); }, formSel),
          ]);
          await settle(page);
          let state = await page.evaluate(() => ({ ...document.documentElement.dataset }));
          flow.steps.push({ step: 'signed in through the form', landed: decodeURIComponent(page.url().split('/').pop()), state });
          if (state.mode !== target.id || state.signedIn !== 'true') {
            results.failures.push(`sign-in: after the form, expected data-mode="${target.id}" data-signed-in="true", got "${state.mode}" "${state.signedIn}"`);
          } else {
            const clicked = await page.evaluate(() => { const el = document.querySelector('[data-mock-signout]'); if (!el) return false; el.click(); return true; });
            if (!clicked) {
              results.failures.push(`sign-out: no [data-mock-signout] on ${decodeURIComponent(page.url().split('/').pop())}`);
            } else {
              await page.waitForLoadState('load').catch(() => {});
              await settle(page);
              state = await page.evaluate(() => ({ ...document.documentElement.dataset }));
              flow.steps.push({ step: 'signed out', landed: decodeURIComponent(page.url().split('/').pop()), state });
              if (state.signedIn !== 'false') results.failures.push(`sign-out: expected data-signed-in="false", got "${state.signedIn}"`);
            }
          }
        }
      } catch (err) {
        results.failures.push(`sign-in flow: ${err.message}`);
      } finally {
        results.signInFlow = flow;
        await page.close();
      }
    } else if (modes.length) {
      results.failures.push('sign-in: no signed-in mode in handoff.json has a "signInView"');
    }
  } finally {
    await context.close();
  }

  for (const m of results.missing) results.failures.push(`no [data-mode-switcher] on ${m}`);
  for (const h of results.hidden) results.failures.push(`switcher not visible on ${h}`);
  const seenOverlap = new Set();
  for (const o of results.overlaps) {
    const k = `${o.where}|${o.control}`;
    if (seenOverlap.has(k)) continue; // same control at top and bottom: report once
    seenOverlap.add(k);
    results.failures.push(`switcher covers ${o.control} on ${o.where}, ${o.at}`);
  }
  if (modes.length < 2) results.failures.push('handoff.json has no "modes" list (needed to open every mode and role)');
  results.consoleErrors = [...errors].slice(0, 20);
  return results;
}

async function main() {
  const { passDir, surface, strict } = parseArgs();
  const absPassDir = resolve(passDir);
  const indexPath = join(absPassDir, 'index.html');

  if (!existsSync(indexPath)) {
    console.error(`index.html not found in ${absPassDir}`);
    process.exit(1);
  }

  const viewports = SURFACE_VIEWPORTS[surface];
  const report = {
    surface,
    passDir: absPassDir,
    timestamp: new Date().toISOString(),
    captures: [],
    errors: [],
    modeChecks: null,
  };

  const browser = await chromium.launch({ headless: true });

  try {
    for (const [key, config] of Object.entries(viewports)) {
      const context = await browser.newContext({
        viewport: { width: config.width, height: config.height },
        deviceScaleFactor: config.deviceScaleFactor || 1,
      });
      const page = await context.newPage();

      try {
        const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;
        await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });
        const result = await captureViewport(page, absPassDir, key, config);
        report.captures.push(result);
        console.log(`  Captured ${key} (${config.label}): ${config.width}x${config.height}`);
      } catch (err) {
        report.errors.push({ viewportKey: key, error: err.message });
        console.error(`  Error capturing ${key}: ${err.message}`);
      } finally {
        await context.close();
      }
    }

    try {
      report.modeChecks = await runModeChecks(browser, absPassDir, surface);
    } catch (err) {
      report.modeChecks = { failures: [`mode checks crashed: ${err.message}`] };
    }
  } finally {
    await browser.close();
  }

  // Write report
  const reportDir = join(absPassDir, 'validation');
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(join(reportDir, 'report.playwright.json'), JSON.stringify(report, null, 2));

  const mc = report.modeChecks || { failures: [] };
  console.log(`\nValidation complete: ${report.captures.length} captures, ${report.errors.length} errors`);
  if (mc.skipped) {
    console.log(`Mode checks skipped: ${mc.skipped}`);
  } else {
    console.log(`Mode checks: ${mc.viewsChecked || 0} view checks, ${mc.modesChecked || 0} modes and roles, ${mc.failures.length} failures`);
    for (const f of mc.failures.slice(0, 25)) console.log(`  FAIL ${f}`);
    if (mc.failures.length > 25) console.log(`  ... ${mc.failures.length - 25} more in report.playwright.json`);
    if ((mc.consoleErrors || []).length) console.log(`  ${mc.consoleErrors.length} console errors recorded in report.playwright.json`);
  }
  console.log(`Report: ${join(reportDir, 'report.playwright.json')}`);
  if (strict && mc.failures.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
