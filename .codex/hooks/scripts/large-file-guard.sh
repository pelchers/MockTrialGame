#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   large-file-guard.sh <file_path> [max_kb]

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <file_path> [max_kb]" >&2
  exit 1
fi

file_path="$1"
max_kb="${2:-512}"

if [[ ! -f "$file_path" ]]; then
  echo "file not found: $file_path" >&2
  exit 1
fi

size_bytes=$(wc -c < "$file_path")
size_kb=$((size_bytes / 1024))

if [[ "$size_kb" -gt "$max_kb" ]]; then
  echo "file too large: ${size_kb}KB (limit ${max_kb}KB) $file_path" >&2
  exit 2
fi
