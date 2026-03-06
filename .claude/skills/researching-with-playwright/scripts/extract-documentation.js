#!/usr/bin/env node

/**
 * Documentation Extractor
 *
 * Extracts structured documentation from web pages including
 * headings, code examples, and navigation structure.
 *
 * Usage: node extract-documentation.js <url> [output-file]
 */

const { chromium } = require('playwright');
const fs = require('fs/promises');
const path = require('path');

async function extractDocumentation(url, outputFile = 'documentation.json') {
  console.log(`Extracting documentation from: ${url}\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('✓ Page loaded');

    // Extract page metadata
    const metadata = {
      url: page.url(),
      title: await page.title(),
      extractedAt: new Date().toISOString(),
    };

    console.log('✓ Title:', metadata.title);

    // Extract main content
    const content = await page.evaluate(() => {
      // Find main content area (common selectors)
      const mainSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '.documentation',
        '#content',
      ];

      let mainElement = null;
      for (const selector of mainSelectors) {
        mainElement = document.querySelector(selector);
        if (mainElement) break;
      }

      if (!mainElement) {
        mainElement = document.body;
      }

      // Extract headings with their content
      const sections = [];
      const headings = mainElement.querySelectorAll('h1, h2, h3, h4, h5, h6');

      headings.forEach(heading => {
        const level = parseInt(heading.tagName[1]);
        const text = heading.textContent?.trim();
        const id = heading.id;

        // Get content until next heading
        let content = '';
        let nextElement = heading.nextElementSibling;

        while (
          nextElement &&
          !nextElement.matches('h1, h2, h3, h4, h5, h6')
        ) {
          if (nextElement.textContent) {
            content += nextElement.textContent.trim() + '\n';
          }
          nextElement = nextElement.nextElementSibling;
        }

        sections.push({
          level,
          heading: text,
          id,
          content: content.trim(),
        });
      });

      return sections;
    });

    console.log(`✓ Extracted ${content.length} sections`);

    // Extract code examples
    const codeExamples = await page.locator('pre code, pre, code').evaluateAll(
      elements =>
        elements
          .map((el, index) => {
            const text = el.textContent?.trim();
            const language =
              el.className.match(/language-(\w+)/)?.[1] ||
              el.parentElement?.className.match(/language-(\w+)/)?.[1] ||
              'unknown';

            return {
              index,
              language,
              code: text,
              lineCount: text?.split('\n').length || 0,
            };
          })
          .filter(ex => ex.code && ex.code.length > 0)
    );

    console.log(`✓ Extracted ${codeExamples.length} code examples`);

    // Extract navigation/table of contents
    const navigation = await page.evaluate(() => {
      const navSelectors = ['nav', '.toc', '.sidebar', '[role="navigation"]'];

      for (const selector of navSelectors) {
        const navElement = document.querySelector(selector);
        if (!navElement) continue;

        const links = Array.from(navElement.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim(),
          href: a.href,
        }));

        if (links.length > 0) {
          return links;
        }
      }

      return [];
    });

    console.log(`✓ Extracted ${navigation.length} navigation links`);

    // Extract images with captions
    const images = await page.locator('img').evaluateAll(elements =>
      elements
        .map(img => {
          const caption =
            img.parentElement?.querySelector('figcaption')?.textContent?.trim() ||
            img.alt ||
            '';

          return {
            src: img.src,
            alt: img.alt,
            caption,
          };
        })
        .filter(img => img.src)
    );

    console.log(`✓ Extracted ${images.length} images`);

    // Compile documentation structure
    const documentation = {
      metadata,
      navigation,
      sections: content,
      codeExamples,
      images,
      stats: {
        totalSections: content.length,
        totalCodeExamples: codeExamples.length,
        totalImages: images.length,
        totalNavigationLinks: navigation.length,
      },
    };

    // Save to file
    await fs.writeFile(outputFile, JSON.stringify(documentation, null, 2));
    console.log(`\n✓ Documentation saved to: ${outputFile}`);

    // Generate markdown summary
    const markdownFile = outputFile.replace('.json', '.md');
    const markdown = generateMarkdown(documentation);
    await fs.writeFile(markdownFile, markdown);
    console.log(`✓ Markdown summary saved to: ${markdownFile}`);

    // Take screenshot
    const screenshotFile = outputFile.replace('.json', '.png');
    await page.screenshot({ path: screenshotFile, fullPage: true });
    console.log(`✓ Screenshot saved to: ${screenshotFile}`);

    await browser.close();
    return documentation;
  } catch (error) {
    console.error('Error extracting documentation:', error.message);
    await browser.close();
    throw error;
  }
}

function generateMarkdown(documentation) {
  let md = `# ${documentation.metadata.title}\n\n`;
  md += `**Source**: ${documentation.metadata.url}\n`;
  md += `**Extracted**: ${new Date(documentation.metadata.extractedAt).toLocaleString()}\n\n`;

  md += `## Statistics\n\n`;
  md += `- Sections: ${documentation.stats.totalSections}\n`;
  md += `- Code Examples: ${documentation.stats.totalCodeExamples}\n`;
  md += `- Images: ${documentation.stats.totalImages}\n`;
  md += `- Navigation Links: ${documentation.stats.totalNavigationLinks}\n\n`;

  if (documentation.navigation.length > 0) {
    md += `## Navigation\n\n`;
    documentation.navigation.forEach(link => {
      md += `- [${link.text}](${link.href})\n`;
    });
    md += `\n`;
  }

  if (documentation.sections.length > 0) {
    md += `## Content\n\n`;
    documentation.sections.forEach(section => {
      const headingPrefix = '#'.repeat(section.level);
      md += `${headingPrefix} ${section.heading}\n\n`;
      if (section.content) {
        md += `${section.content.substring(0, 200)}...\n\n`;
      }
    });
  }

  if (documentation.codeExamples.length > 0) {
    md += `## Code Examples\n\n`;
    documentation.codeExamples.slice(0, 5).forEach((example, index) => {
      md += `### Example ${index + 1} (${example.language})\n\n`;
      md += `\`\`\`${example.language}\n${example.code.substring(0, 300)}\n\`\`\`\n\n`;
    });
  }

  return md;
}

// Main execution
if (require.main === module) {
  const url = process.argv[2];
  const outputFile = process.argv[3] || 'documentation.json';

  if (!url) {
    console.error('Usage: node extract-documentation.js <url> [output-file]');
    console.error(
      'Example: node extract-documentation.js https://playwright.dev/docs/intro docs.json'
    );
    process.exit(1);
  }

  try {
    new URL(url);
  } catch (error) {
    console.error('Invalid URL:', url);
    process.exit(1);
  }

  extractDocumentation(url, outputFile)
    .then(() => {
      console.log('\n✓ Documentation extraction completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n✗ Extraction failed:', error.message);
      process.exit(1);
    });
}

module.exports = { extractDocumentation };

