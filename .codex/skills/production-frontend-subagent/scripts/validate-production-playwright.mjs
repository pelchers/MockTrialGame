#!/usr/bin/env node
/**
 * Production Frontend — Playwright Screenshot Validation
 *
 * Captures screenshots of production frontend pages at desktop and mobile viewports.
 * Supports multi-page sites by capturing index.html plus any additional HTML files.
 *
 * Usage:
 *   node validate-production-playwright.mjs --pass-dir <path>
 *   node validate-production-playwright.mjs --pass-dir <path> --pages index.html,about.html,dashboard.html
 *
 * Options:
 *   --pass-dir    Production output directory (must contain index.html)
 *   --pages       Comma-separated list of HTML files to capture (default: all .html files)
 *   --primary     Only capture the primary page (index.html) for quick validation
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
const pagesArg = arg("--pages", null);
const primaryOnly = process.argv.includes("--primary");

if (!passDir) {
  console.error("Usage: node validate-production-playwright.mjs --pass-dir <path>");
  process.exit(1);
}

const resolved = path.resolve(passDir);
if (!(await exists(resolved))) {
  console.error(`Directory not found: ${resolved}`);
  process.exit(1);
}

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
// Smart-wait helpers
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
// Discover HTML pages
// ---------------------------------------------------------------------------

async function discoverPages(dir) {
  if (pagesArg) {
    return pagesArg.split(",").map(p => p.trim());
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const htmlFiles = entries
    .filter(e => e.isFile() && e.name.endsWith(".html"))
    .map(e => e.name)
    .sort((a, b) => {
      // index.html first, then alphabetical
      if (a === "index.html") return -1;
      if (b === "index.html") return 1;
      return a.localeCompare(b);
    });

  if (primaryOnly) {
    return htmlFiles.filter(f => f === "index.html");
  }

  return htmlFiles;
}

// ---------------------------------------------------------------------------
// Capture function for a single page at a single viewport
// ---------------------------------------------------------------------------

async function capturePageViewport(browser, htmlPath, outDir, viewportName, viewportOpts) {
  const context = await browser.newContext({ viewport: viewportOpts });
  const page = await context.newPage();

  await fs.mkdir(outDir, { recursive: true });

  const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;

  await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 30000 });

  // Wait for fonts
  await page.evaluate(() => document.fonts?.ready).catch(() => {});

  // Dismiss loading overlays
  await dismissLoadingOverlays(page);

  // Wait for libraries to initialize
  await waitForDomStability(page, { quietMs: 800, maxMs: 6000 });

  // Extra wait for canvas/WebGL rendering
  await page.waitForTimeout(1500);

  // Full-page screenshot
  await page.screenshot({ path: path.join(outDir, "showcase.png"), fullPage: true });

  // Viewport-only screenshot
  await page.screenshot({ path: path.join(outDir, "showcase-viewport.png"), fullPage: false });

  await context.close();

  return {
    screenshots: [
      path.join(viewportName, "showcase.png"),
      path.join(viewportName, "showcase-viewport.png")
    ]
  };
}

// ---------------------------------------------------------------------------
// Process a single HTML page
// ---------------------------------------------------------------------------

async function processPage(browser, dir, htmlFile) {
  const htmlPath = path.join(dir, htmlFile);
  if (!(await exists(htmlPath))) return null;

  const pageName = path.basename(htmlFile, ".html");
  console.log(`\n  Page: ${htmlFile}`);

  try {
    const pageValidationDir = path.join(dir, "validation", pageName);

    const desktop = await capturePageViewport(
      browser, htmlPath, path.join(pageValidationDir, "desktop"), "desktop", VIEWPORTS.desktop
    );
    console.log(`    Desktop: 2 screenshots`);

    const mobile = await capturePageViewport(
      browser, htmlPath, path.join(pageValidationDir, "mobile"), "mobile", VIEWPORTS.mobile
    );
    console.log(`    Mobile: 2 screenshots`);

    return {
      page: htmlFile,
      desktop: { viewport: VIEWPORTS.desktop, screenshots: desktop.screenshots },
      mobile: { viewport: VIEWPORTS.mobile, screenshots: mobile.screenshots },
      totalScreenshots: 4
    };
  } catch (error) {
    console.error(`    Error: ${error.message}`);
    return { page: htmlFile, error: error.message };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(`Production Frontend Validation: ${resolved}`);

const browser = await chromium.launch({ headless: true });
const pages = await discoverPages(resolved);

if (pages.length === 0) {
  console.error("No HTML files found in directory");
  await browser.close();
  process.exit(1);
}

console.log(`Found ${pages.length} HTML page(s): ${pages.join(", ")}`);

// Also capture primary page screenshots in the standard validation/ location
// for backward compatibility with the general agent screenshot paths
const indexPath = path.join(resolved, "index.html");
if (await exists(indexPath)) {
  console.log("\nCapturing primary page (standard validation paths)...");
  const valDesktop = path.join(resolved, "validation", "desktop");
  const valMobile = path.join(resolved, "validation", "mobile");

  await capturePageViewport(browser, indexPath, valDesktop, "desktop", VIEWPORTS.desktop);
  await capturePageViewport(browser, indexPath, valMobile, "mobile", VIEWPORTS.mobile);
  console.log("  Standard validation screenshots captured");
}

// Capture all pages
const results = [];
let errors = 0;

for (const htmlFile of pages) {
  const result = await processPage(browser, resolved, htmlFile);
  if (result) {
    if (result.error) errors++;
    else results.push(result);
  }
}

await browser.close();

// Write aggregate report
const report = {
  directory: resolved,
  pageCount: pages.length,
  pagesValidated: results.length,
  errors,
  totalScreenshots: results.reduce((s, r) => s + (r.totalScreenshots || 0), 0),
  pages: results,
  timestamp: new Date().toISOString()
};

const validationDir = path.join(resolved, "validation");
await fs.mkdir(validationDir, { recursive: true });
await fs.writeFile(
  path.join(validationDir, "report.playwright.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log(`\nValidation complete: ${results.length} pages, ${report.totalScreenshots} screenshots (${errors} errors)`);
if (errors > 0) process.exit(3);
