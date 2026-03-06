#!/usr/bin/env bash
set -euo pipefail

out_dir="${1:-.claude/hooks/output}"
mkdir -p "$out_dir"

timestamp="$(date +%Y%m%d-%H%M%S)"
report="$out_dir/git-context-$timestamp.txt"

{
  echo "repo: $(pwd)"
  echo "date: $(date)"
  echo ""
  echo "## git status"
  git status -sb || true
  echo ""
  echo "## recent commits"
  git --no-pager log --oneline -n 10 || true
  echo ""
  echo "## diff summary"
  git --no-pager diff --stat || true
} > "$report"

echo "wrote $report"
