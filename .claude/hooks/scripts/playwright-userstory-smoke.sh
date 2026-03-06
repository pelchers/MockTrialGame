#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   playwright-userstory-smoke.sh stories.csv [out_dir]
# CSV format:
#   label,url,wait_ms
# Example:
#   landing,https://example.com,1500
#   pricing,https://example.com/pricing,1500

if [[ $# -lt 1 ]]; then
  echo "usage: $0 stories.csv [out_dir]" >&2
  exit 1
fi

stories_file="$1"
out_dir="${2:-.claude/hooks/output/userstory-smoke}"
mkdir -p "$out_dir"

if ! command -v node >/dev/null 2>&1; then
  echo "node not found. install Node.js to run this script." >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found. install Node.js to run this script." >&2
  exit 1
fi

node - <<'NODE' "$stories_file" "$out_dir"
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const storiesFile = process.argv[1];
const outDir = process.argv[2];

const lines = fs.readFileSync(storiesFile, 'utf8')
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('#'));

const stories = lines.map(line => {
  const [label, url, waitMs] = line.split(',').map(s => s.trim());
  if (!label || !url) return null;
  return { label, url, waitMs: Number(waitMs || 1500) };
}).filter(Boolean);

if (!stories.length) {
  console.error('no stories found');
  process.exit(1);
}

const tmp = path.join(outDir, 'playwright-userstory.mjs');
const script = `
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const stories = ${JSON.stringify(stories)};
const outDir = ${JSON.stringify(outDir)};

const browser = await chromium.launch();
for (const story of stories) {
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  await page.goto(story.url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(story.waitMs);
  const file = path.join(outDir, \`\${story.label}.png\`);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
}
await browser.close();
`;

fs.writeFileSync(tmp, script);
execSync(`npx playwright install chromium`, { stdio: 'inherit' });
execSync(`node ${tmp}`, { stdio: 'inherit' });
fs.unlinkSync(tmp);
console.log('done');
NODE
