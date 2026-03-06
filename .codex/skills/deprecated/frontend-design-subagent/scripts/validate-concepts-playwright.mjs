#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

const conceptRoot = path.resolve(arg("--concept-root", ".docs/planning/concepts"));
const configPath = path.resolve(
  arg(
    "--config",
    ".claude/skills/planning-frontend-design-orchestrator/references/style-config.json"
  )
);
const styleFilter = arg("--style", null);
const passFilter = arg("--pass", null);

if (!(await exists(conceptRoot))) {
  console.error(`Concept root not found: ${conceptRoot}`);
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("Playwright not installed. Run: pnpm add -D playwright");
  process.exit(2);
}

let requiredViews = [
  "dashboard",
  "projects",
  "project-workspace",
  "kanban",
  "whiteboard",
  "schema-planner",
  "directory-tree",
  "ideas",
  "ai-chat",
  "settings"
];

if (await exists(configPath)) {
  try {
    const config = JSON.parse(await fs.readFile(configPath, "utf8"));
    if (Array.isArray(config.requiredViews) && config.requiredViews.length > 0) {
      requiredViews = config.requiredViews;
    }
  } catch (error) {
    console.warn(`Failed to read requiredViews from config: ${error.message}`);
  }
}

const VIEWPORTS = {
  desktop: { width: 1536, height: 960 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true }
};

// ---------------------------------------------------------------------------
// Smart-wait helpers
// ---------------------------------------------------------------------------

/** Force-dismiss any loading overlays / splash screens via JS injection */
async function dismissLoadingOverlays(page) {
  await page.evaluate(() => {
    const selectors = [
      "#loading-overlay", "#loader", "#splash", "#preloader",
      ".loading-overlay", ".loader-overlay", ".splash-screen",
      ".loading-screen", ".preloader", ".page-loader",
      "[data-loading-overlay]", "[data-loader]"
    ];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => {
        el.style.display = "none";
        el.style.opacity = "0";
        el.style.visibility = "hidden";
        el.style.pointerEvents = "none";
      });
    }
    // Also remove any body class that locks scrolling during load
    document.body.classList.remove(
      "loading", "is-loading", "no-scroll", "overflow-hidden"
    );
    document.documentElement.classList.remove(
      "loading", "is-loading", "no-scroll", "overflow-hidden"
    );
  });
}

/**
 * Wait until the DOM stops mutating for `quietMs`, with an overall cap of
 * `maxMs`. This adapts to each page — fast pages resolve quickly, heavy
 * animation pages get the time they need.
 */
async function waitForDomStability(page, { quietMs = 500, maxMs = 4000 } = {}) {
  await page.evaluate(({ quietMs, maxMs }) => {
    return new Promise(resolve => {
      let timer = null;
      const deadline = Date.now() + maxMs;
      const observer = new MutationObserver(() => {
        clearTimeout(timer);
        if (Date.now() >= deadline) { observer.disconnect(); resolve(); return; }
        timer = setTimeout(() => { observer.disconnect(); resolve(); }, quietMs);
      });
      observer.observe(document.body, {
        childList: true, subtree: true, attributes: true, characterData: true
      });
      // Kick off initial timer in case DOM is already stable
      timer = setTimeout(() => { observer.disconnect(); resolve(); }, quietMs);
    });
  }, { quietMs, maxMs });
}

// ---------------------------------------------------------------------------
// Viewport-segment screenshots: break tall pages into viewport-height slices
// ---------------------------------------------------------------------------

async function captureScrollSegments(page, outDir, viewName, viewportHeight) {
  const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const segments = Math.ceil(fullHeight / viewportHeight);
  const segmentPaths = [];

  // Only create segments if the page is taller than 1.5x the viewport
  if (segments <= 1) return segmentPaths;

  for (let i = 0; i < segments; i++) {
    const y = i * viewportHeight;
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(150); // brief settle after scroll
    const segPath = path.join(outDir, `${viewName}_segment-${i + 1}.png`);
    await page.screenshot({ path: segPath, fullPage: false });
    segmentPaths.push(segPath);
  }
  // Scroll back to top for next view
  await page.evaluate(() => window.scrollTo(0, 0));
  return segmentPaths;
}

// ---------------------------------------------------------------------------
// Core capture function
// ---------------------------------------------------------------------------

async function captureViewport(browser, indexPath, passPath, viewportName, viewportOpts) {
  const context = await browser.newContext({ viewport: viewportOpts });
  const page = await context.newPage();

  const outDir = path.join(passPath, "validation", viewportName);
  await fs.mkdir(outDir, { recursive: true });

  const fileUrl = `file:///${indexPath.replace(/\\/g, "/")}`;

  // Use networkidle to wait until network settles (catches late CDN fetches)
  await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 30000 });

  // Wait for Google Fonts to fully render
  await page.evaluate(() => document.fonts?.ready).catch(() => {});

  // Force-dismiss loading overlays / splash screens
  await dismissLoadingOverlays(page);

  // Wait for JS libraries (GSAP, AOS, particles, etc.) to initialize and DOM to stabilize
  await waitForDomStability(page, { quietMs: 500, maxMs: 4000 });

  const viewportHeight = viewportOpts.height || 960;
  const screenshots = [];
  let totalSegments = 0;

  for (const view of requiredViews) {
    // ----- Navigate to view -----
    let clicked = false;
    const selector = `[data-view='${view}']`;
    const el = page.locator(selector).first();
    if ((await el.count()) > 0) {
      const isVisible = await el.isVisible().catch(() => false);
      if (isVisible) {
        try {
          await el.click({ timeout: 3000 });
          clicked = true;
        } catch { /* fall through to JS fallback */ }
      }
    }

    // Mobile hamburger fallback
    if (!clicked) {
      const hamburger = page.locator(
        '.hamburger, .menu-toggle, .mobile-toggle, .nav-toggle, [data-mobile-menu], .burger'
      ).first();
      if ((await hamburger.count()) > 0 && await hamburger.isVisible().catch(() => false)) {
        try {
          await hamburger.click({ timeout: 2000 });
          await page.waitForTimeout(300);
          if ((await el.count()) > 0 && await el.isVisible().catch(() => false)) {
            try {
              await el.click({ timeout: 2000 });
              clicked = true;
            } catch { /* fall through */ }
          }
        } catch { /* fall through */ }
      }
    }

    // JS fallback
    if (!clicked) {
      await page.evaluate((viewId) => {
        const btn = document.querySelector(`[data-view='${viewId}']`);
        if (btn) { btn.click(); return; }
        document.querySelectorAll('[data-page]').forEach(p => {
          p.style.display = p.dataset.page === viewId ? '' : 'none';
          p.classList.toggle('active', p.dataset.page === viewId);
        });
        document.querySelectorAll('[data-view]').forEach(b => {
          b.classList.toggle('active', b.dataset.view === viewId);
        });
        if (window.location.hash !== `#${viewId}`) {
          window.location.hash = viewId;
        }
      }, view);
    }

    // Force-dismiss overlays again (some pages add overlays per view transition)
    await dismissLoadingOverlays(page);

    // Wait for DOM to stabilize after view switch
    await waitForDomStability(page, { quietMs: 500, maxMs: 3000 });

    // Scroll to top before capturing
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);

    // ----- Full-page screenshot -----
    const shotPath = path.join(outDir, `${view}.png`);
    await page.screenshot({ path: shotPath, fullPage: true });
    screenshots.push(`validation/${viewportName}/${view}.png`);

    // ----- Scroll-segment screenshots for tall pages -----
    const segPaths = await captureScrollSegments(page, outDir, view, viewportHeight);
    for (const sp of segPaths) {
      const rel = path.relative(passPath, sp).replace(/\\/g, "/");
      screenshots.push(rel);
      totalSegments++;
    }
  }

  await context.close();
  return { screenshots, totalSegments };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const browser = await chromium.launch({ headless: true });

const styleDirs = (await fs.readdir(conceptRoot, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("run-"))
  .filter((d) => !styleFilter || d.name === styleFilter);

const aggregate = [];
let errors = 0;

for (const style of styleDirs) {
  const stylePath = path.join(conceptRoot, style.name);
  const passDirs = (await fs.readdir(stylePath, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && d.name.startsWith("pass-"))
    .filter((d) => !passFilter || d.name === `pass-${passFilter}`);

  for (const pass of passDirs) {
    const passPath = path.join(stylePath, pass.name);
    const indexPath = path.join(passPath, "index.html");
    if (!(await exists(indexPath))) continue;

    console.log(`\n📸 ${style.name}/${pass.name}`);

    try {
      const desktop = await captureViewport(
        browser, indexPath, passPath, "desktop", VIEWPORTS.desktop
      );
      console.log(`  ✓ Desktop: ${desktop.screenshots.length} screenshots (${desktop.totalSegments} scroll segments)`);

      const mobile = await captureViewport(
        browser, indexPath, passPath, "mobile", VIEWPORTS.mobile
      );
      console.log(`  ✓ Mobile: ${mobile.screenshots.length} screenshots (${mobile.totalSegments} scroll segments)`);

      const report = {
        style: style.name,
        pass: pass.name,
        requiredViews,
        desktop: {
          viewport: VIEWPORTS.desktop,
          screenshots: desktop.screenshots,
          scrollSegments: desktop.totalSegments
        },
        mobile: {
          viewport: VIEWPORTS.mobile,
          screenshots: mobile.screenshots,
          scrollSegments: mobile.totalSegments
        },
        totalScreenshots: desktop.screenshots.length + mobile.screenshots.length,
        timestamp: new Date().toISOString()
      };

      const validationDir = path.join(passPath, "validation");
      await fs.writeFile(
        path.join(validationDir, "report.playwright.json"),
        JSON.stringify(report, null, 2),
        "utf8"
      );
      aggregate.push(report);
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
      errors += 1;
    }
  }
}

await fs.writeFile(
  path.join(conceptRoot, "validation-report.json"),
  JSON.stringify(aggregate, null, 2),
  "utf8"
);
await browser.close();

const totalShots = aggregate.reduce((s, r) => s + r.totalScreenshots, 0);
console.log(`\nValidated ${aggregate.length} pass folders — ${totalShots} total screenshots (${errors} errors).`);
if (errors > 0) process.exit(3);
