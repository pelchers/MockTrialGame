#!/bin/bash
# Session start setup script
# Runs at the beginning of each Codex session
# Displays project info and performs environment checks

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"

# Try to get name from package.json if available
if [ -f "$PROJECT_ROOT/package.json" ]; then
  PKG_NAME="$(jq -r '.name // empty' "$PROJECT_ROOT/package.json" 2>/dev/null)"
  if [ -n "$PKG_NAME" ]; then
    PROJECT_NAME="$PKG_NAME"
  fi
fi

echo ""
echo "Codex session started for $PROJECT_NAME"
echo "Working directory: $(pwd)"
echo ""

# Check git status
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git branch --show-current)
  echo "Current branch: $BRANCH"

  # Check for uncommitted changes
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    MODIFIED=$(git status --porcelain | wc -l)
    echo "You have $MODIFIED uncommitted change(s)"
  fi
  echo ""
fi

# Check for common tools
echo "Development tools:"
[ -x "$(command -v node)" ] && echo "  Node.js $(node --version)"
[ -x "$(command -v npm)" ] && echo "  npm $(npm --version)"
[ -x "$(command -v npx)" ] && echo "  npx available"
[ -x "$(command -v prettier)" ] && echo "  Prettier available"
[ -x "$(command -v git)" ] && echo "  Git $(git --version | cut -d' ' -f3)"

# Project-specific checks
echo ""
if [ -f "package.json" ]; then
  echo "Project: $(jq -r '.name' package.json 2>/dev/null || echo 'Unknown')"
fi

echo ""
echo "Quick commands:"
echo "  /help - View custom commands"
echo ""
echo "Project memory loaded from .codex/CODEX.md or AGENTS.md"
echo "See .codex/ for active hooks and skills"
echo ""
