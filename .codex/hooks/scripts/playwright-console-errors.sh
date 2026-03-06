#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   playwright-console-errors.sh urls.txt [out_dir]
# urls.txt format: one URL per line (comments with # allowed)

if [[ $# -lt 1 ]]; then
  echo "usage: $0 urls.txt [out_dir]" >&2
  exit 1
fi

urls_file="$1"
out_dir="${2:-.codex/hooks/output/console-errors}"
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

const tmp = path.join(outDir, 'playwright-console.mjs');
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
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(String(err)));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  results.push({ url, errors });
  await page.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir, 'console-errors.json'), JSON.stringify(results, null, 2));
console.log('wrote console-errors.json');
`;

fs.writeFileSync(tmp, script);
execSync(`npx playwright install chromium`, { stdio: 'inherit' });
execSync(`node ${tmp}`, { stdio: 'inherit' });
fs.unlinkSync(tmp);
NODE
