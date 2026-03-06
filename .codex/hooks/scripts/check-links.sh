#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   check-links.sh urls.txt [out_file]
# urls.txt format: one URL per line (comments with # allowed)

if [[ $# -lt 1 ]]; then
  echo "usage: $0 urls.txt [out_file]" >&2
  exit 1
fi

urls_file="$1"
out_file="${2:-.codex/hooks/output/link-checks.json}"
mkdir -p "$(dirname "$out_file")"

if ! command -v node >/dev/null 2>&1; then
  echo "node not found. install Node.js to run this script." >&2
  exit 1
fi

node - <<'NODE' "$urls_file" "$out_file"
const fs = require('fs');

const urlsFile = process.argv[1];
const outFile = process.argv[2];

const urls = fs.readFileSync(urlsFile, 'utf8')
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('#'));

if (!urls.length) {
  console.error('no urls found');
  process.exit(1);
}

async function check(url) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    return { url, status: res.status, ok: res.ok };
  } catch (err) {
    return { url, status: null, ok: false, error: String(err) };
  }
}

Promise.all(urls.map(check)).then(results => {
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`wrote ${outFile}`);
});
NODE
