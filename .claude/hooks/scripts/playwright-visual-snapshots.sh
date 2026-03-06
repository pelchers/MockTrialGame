#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   playwright-visual-snapshots.sh urls.txt [out_dir]
# urls.txt format: one URL per line (comments with # allowed)

if [[ $# -lt 1 ]]; then
  echo "usage: $0 urls.txt [out_dir]" >&2
  exit 1
fi

urls_file="$1"
out_dir="${2:-.claude/hooks/output/visual-snapshots}"
mkdir -p "$out_dir"

if ! command -v node >/dev/null 2>&1; then
  echo "node not found. install Node.js to run this script." >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found. install Node.js to run this script." >&2
  exit 1
fi

node - <<'NODE' "$urls_file" "$out_dir"
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const urlsFile = process.argv[1];
const outDir = process.argv[2];

const urls = fs.readFileSync(urlsFile, 'utf8')
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('#'));

if (!urls.length) {
  console.error('no urls found');
  process.exit(1);
}

const tmp = path.join(outDir, 'playwright-snapshots.mjs');
const script = `
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const urls = ${JSON.stringify(urls)};
const outDir = ${JSON.stringify(outDir)};
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
];

const slug = (url) => url.replace(/https?:\\/\\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const browser = await chromium.launch();
for (const url of urls) {
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    const file = path.join(outDir, \`\${slug(url)}-\${vp.name}.png\`);
    await page.screenshot({ path: file, fullPage: true });
    await page.close();
  }
}
await browser.close();
`;

fs.writeFileSync(tmp, script);
execSync(`npx playwright install chromium`, { stdio: 'inherit' });
execSync(`node ${tmp}`, { stdio: 'inherit' });
fs.unlinkSync(tmp);
console.log('done');
NODE
