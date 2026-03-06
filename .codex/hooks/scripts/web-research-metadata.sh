#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   web-research-metadata.sh urls.txt [out_dir]
# urls.txt format: one URL per line (comments with # allowed)

if [[ $# -lt 1 ]]; then
  echo "usage: $0 urls.txt [out_dir]" >&2
  exit 1
fi

urls_file="$1"
out_dir="${2:-.codex/hooks/output/web-metadata}"
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

const tmp = path.join(outDir, 'playwright-metadata.mjs');
const script = `
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const urls = ${JSON.stringify(urls)};
const outDir = ${JSON.stringify(outDir)};

const browser = await chromium.launch();
const results = [];
for (const url of urls) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  const data = await page.evaluate(() => ({
    title: document.title || null,
    h1: document.querySelector('h1')?.textContent?.trim() || null,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') || null,
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || null,
    ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || null,
  }));
  results.push({ url, ...data });
  await page.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(results, null, 2));
console.log('wrote metadata.json');
`;

fs.writeFileSync(tmp, script);
execSync(`npx playwright install chromium`, { stdio: 'inherit' });
execSync(`node ${tmp}`, { stdio: 'inherit' });
fs.unlinkSync(tmp);
NODE
