#!/usr/bin/env node
/**
 * Visual Creative Concept — Playwright Screenshot Validation
 *
 * Captures screenshots of single-page visual showcases at desktop and mobile viewports.
 * Unlike the frontend design validator which navigates between 10 views, this script
 * captures a single showcase page per pass (the visualization, animation, or graphic).
 *
 * Usage:
 *   node validate-visuals-playwright.mjs --pass-dir <path>
 *   node validate-visuals-playwright.mjs --concept-root <path> [--domain <domain>] [--style <style>] [--pass <n>]
 *
 * Modes:
 *   --pass-dir     Validate a single pass directory (must contain index.html)
 *   --concept-root Scan all pass directories under the root (default: .docs/design/concepts)
 */
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

const passDir = arg("--pass-dir", null);
const conceptRoot = path.resolve(arg("--concept-root", ".docs/design/concepts"));
const domainFilter = arg("--domain", null);
const styleFilter = arg("--style", null);
const passFilter = arg("--pass", null);

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("Playwright not installed. Run: pnpm add -D playwright");
  process.exit(2);
}

const VIEWPORTS = {
  desktop: { width: 1536, height: 960 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true }
};

// ---------------------------------------------------------------------------
// Smart-wait helpers (reused from frontend validator)
// ---------------------------------------------------------------------------

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
    document.body.classList.remove("loading", "is-loading", "no-scroll", "overflow-hidden");
    document.documentElement.classList.remove("loading", "is-loading", "no-scroll", "overflow-hidden");
  });
}

async function waitForDomStability(page, { quietMs = 500, maxMs = 6000 } = {}) {
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
      timer = setTimeout(() => { observer.disconnect(); resolve(); }, quietMs);
    });
  }, { quietMs, maxMs });
}

// ---------------------------------------------------------------------------
// Capture function for a single viewport
// ---------------------------------------------------------------------------

async function captureViewport(browser, indexPath, passPath, viewportName, viewportOpts) {
  const context = await browser.newContext({ viewport: viewportOpts });
  const page = await context.newPage();

  const outDir = path.join(passPath, "validation", viewportName);
  await fs.mkdir(outDir, { recursive: true });

  const fileUrl = `file:///${indexPath.replace(/\\/g, "/")}`;

  await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 30000 });

  // Wait for fonts
  await page.evaluate(() => document.fonts?.ready).catch(() => {});

  // Dismiss loading overlays
  await dismissLoadingOverlays(page);

  // Wait for libraries (D3, Chart.js, Three.js, p5.js, etc.) to initialize
  // Give extra time since visual libraries often need longer to render
  await waitForDomStability(page, { quietMs: 800, maxMs: 6000 });

  // Extra wait for canvas/WebGL rendering
  await page.waitForTimeout(1500);

  // Full-page screenshot
  const shotPath = path.join(outDir, "showcase.png");
  await page.screenshot({ path: shotPath, fullPage: true });

  // Also capture a viewport-only screenshot (no scroll) for animations
  const viewportShotPath = path.join(outDir, "showcase-viewport.png");
  await page.screenshot({ path: viewportShotPath, fullPage: false });

  await context.close();
  return {
    screenshots: [
      `validation/${viewportName}/showcase.png`,
      `validation/${viewportName}/showcase-viewport.png`
    ]
  };
}

// ---------------------------------------------------------------------------
// Process a single pass directory
// ---------------------------------------------------------------------------

async function processPass(browser, passPath) {
  const indexPath = path.join(passPath, "index.html");
  if (!(await exists(indexPath))) return null;

  const passName = path.basename(passPath);
  const styleName = path.basename(path.dirname(passPath));
  const domainName = path.basename(path.dirname(path.dirname(passPath)));

  console.log(`\n📸 ${domainName}/${styleName}/${passName}`);

  try {
    const desktop = await captureViewport(
      browser, indexPath, passPath, "desktop", VIEWPORTS.desktop
    );
    console.log(`  ✓ Desktop: ${desktop.screenshots.length} screenshots`);

    const mobile = await captureViewport(
      browser, indexPath, passPath, "mobile", VIEWPORTS.mobile
    );
    console.log(`  ✓ Mobile: ${mobile.screenshots.length} screenshots`);

    const report = {
      domain: domainName,
      style: styleName,
      pass: passName,
      desktop: {
        viewport: VIEWPORTS.desktop,
        screenshots: desktop.screenshots
      },
      mobile: {
        viewport: VIEWPORTS.mobile,
        screenshots: mobile.screenshots
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

    return report;
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return { error: error.message };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const browser = await chromium.launch({ headless: true });
const aggregate = [];
let errors = 0;

if (passDir) {
  // Single-pass mode
  const resolved = path.resolve(passDir);
  if (!(await exists(resolved))) {
    console.error(`Pass directory not found: ${resolved}`);
    await browser.close();
    process.exit(1);
  }
  const result = await processPass(browser, resolved);
  if (result) {
    if (result.error) errors++;
    else aggregate.push(result);
  }
} else {
  // Scan mode: iterate over domains → styles → passes
  if (!(await exists(conceptRoot))) {
    console.error(`Concept root not found: ${conceptRoot}`);
    await browser.close();
    process.exit(1);
  }

  const domains = (await fs.readdir(conceptRoot, { withFileTypes: true }))
    .filter(d => d.isDirectory() && !d.name.startsWith("_"))
    .filter(d => !domainFilter || d.name === domainFilter);

  for (const domain of domains) {
    const domainPath = path.join(conceptRoot, domain.name);
    const styles = (await fs.readdir(domainPath, { withFileTypes: true }))
      .filter(d => d.isDirectory())
      .filter(d => !styleFilter || d.name === styleFilter);

    for (const style of styles) {
      const stylePath = path.join(domainPath, style.name);
      const passes = (await fs.readdir(stylePath, { withFileTypes: true }))
        .filter(d => d.isDirectory() && d.name.startsWith("pass-"))
        .filter(d => !passFilter || d.name === `pass-${passFilter}`);

      for (const pass of passes) {
        const passPath = path.join(stylePath, pass.name);
        const result = await processPass(browser, passPath);
        if (result) {
          if (result.error) errors++;
          else aggregate.push(result);
        }
      }
    }
  }

  // Write aggregate report
  await fs.writeFile(
    path.join(conceptRoot, "validation-report.json"),
    JSON.stringify(aggregate, null, 2),
    "utf8"
  );
}

await browser.close();

const totalShots = aggregate.reduce((s, r) => s + (r.totalScreenshots || 0), 0);
console.log(`\nValidated ${aggregate.length} pass folders — ${totalShots} total screenshots (${errors} errors).`);
if (errors > 0) process.exit(3);
