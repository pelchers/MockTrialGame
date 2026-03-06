#!/usr/bin/env node

/**
 * Basic Playwright Web Scraper
 *
 * Demonstrates fundamental web scraping patterns with Playwright.
 *
 * Usage: node basic-scraper.js <url>
 */

const { chromium } = require('playwright');

async function scrapeWebsite(url) {
  console.log(`Scraping: ${url}\n`);

  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();

  try {
    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    console.log('✓ Page loaded');

    // Extract basic information
    const pageInfo = {
      title: await page.title(),
      url: page.url(),
      timestamp: new Date().toISOString(),
    };

    console.log('✓ Page title:', pageInfo.title);

    // Extract headings
    const headings = await page.locator('h1, h2, h3').evaluateAll(elements =>
      elements.map(el => ({
        level: el.tagName,
        text: el.textContent?.trim(),
      }))
    );

    console.log(`✓ Found ${headings.length} headings`);

    // Extract links
    const links = await page.locator('a[href]').evaluateAll(elements =>
      elements
        .map(el => ({
          text: el.textContent?.trim(),
          href: el.href,
        }))
        .filter(link => link.href && link.text) // Remove empty
        .slice(0, 20) // Limit to first 20
    );

    console.log(`✓ Found ${links.length} links (showing first 20)`);

    // Extract images
    const images = await page.locator('img[src]').evaluateAll(elements =>
      elements
        .map(el => ({
          alt: el.alt,
          src: el.src,
        }))
        .filter(img => img.src)
        .slice(0, 10) // Limit to first 10
    );

    console.log(`✓ Found ${images.length} images (showing first 10)`);

    // Take screenshot
    await page.screenshot({
      path: 'screenshot.png',
      fullPage: false, // Just viewport
    });

    console.log('✓ Screenshot saved: screenshot.png');

    // Compile results
    const results = {
      page: pageInfo,
      headings,
      links,
      images,
    };

    // Output results
    console.log('\n=== Results ===\n');
    console.log(JSON.stringify(results, null, 2));

    // Save to file
    const fs = require('fs');
    fs.writeFileSync('scrape-results.json', JSON.stringify(results, null, 2));
    console.log('\n✓ Results saved: scrape-results.json');

    await browser.close();
    return results;
  } catch (error) {
    console.error('Error during scraping:', error.message);

    // Take error screenshot
    try {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('Error screenshot saved: error-screenshot.png');
    } catch (screenshotError) {
      // Ignore screenshot errors
    }

    await browser.close();
    throw error;
  }
}

// Main execution
if (require.main === module) {
  const url = process.argv[2];

  if (!url) {
    console.error('Usage: node basic-scraper.js <url>');
    console.error('Example: node basic-scraper.js https://example.com');
    process.exit(1);
  }

  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    console.error('Invalid URL:', url);
    process.exit(1);
  }

  scrapeWebsite(url)
    .then(() => {
      console.log('\n✓ Scraping completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n✗ Scraping failed:', error.message);
      process.exit(1);
    });
}

module.exports = { scrapeWebsite };

