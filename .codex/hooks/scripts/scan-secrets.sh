#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scan-secrets.sh [path]
# If no path provided, scans git diff (staged + unstaged).

pattern='(api[_-]?key|secret|token|password|passwd|private[_-]?key|aws_access_key_id|aws_secret_access_key|xox[abpr]-|ghp_|sk_live_|sk_test_|AIza|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY)'

scan_text() {
  if command -v rg >/dev/null 2>&1; then
    rg -n -i -e "$pattern" "$1"
  else
    grep -RInE "$pattern" "$1"
  fi
}

if [[ $# -gt 0 ]]; then
  target="$1"
  if [[ -f "$target" || -d "$target" ]]; then
    if scan_text "$target"; then
      echo "potential secret(s) found in $target" >&2
      exit 2
    fi
    exit 0
  fi
  echo "path not found: $target" >&2
  exit 1
fi

tmp="$(mktemp)"
git diff > "$tmp" || true
git diff --cached >> "$tmp" || true
if grep -nEi "$pattern" "$tmp"; then
  rm -f "$tmp"
  echo "potential secret(s) found in git diff" >&2
  exit 2
fi
rm -f "$tmp"
