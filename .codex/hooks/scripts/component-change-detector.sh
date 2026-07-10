#!/usr/bin/env bash
# component-change-detector.sh — PostToolUse (Edit|Write) hook. When a REUSABLE
# component file is edited, record it to .git/component-sync-pending (deduped) so the
# flush / wind-down knows it needs propagating to the SYNC-REPOS targets. Silent + fast
# (no blocking, no network). This is the "auto-detect cross-repo work" half of the
# component-sync module.
set -uo pipefail
# read the edited file path from the hook payload on stdin (jq if present, else grep)
payload="$(cat)"
fp="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -z "$fp" ] && fp="$(printf '%s' "$payload" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)".*/\1/')"
[ -z "$fp" ] && exit 0
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"; [ -z "$ROOT" ] && exit 0
# normalize to a repo-relative path
rel="${fp#$ROOT/}"; rel="${rel//\\//}"
# is it a reusable-component surface? (not project app code)
case "$rel" in
  .claude/skills/*|.codex/skills/*|.claude/agents/*|.codex/agents/*|\
  .claude/hooks/*|.codex/hooks/*|.claude/commands/*|.codex/commands/*|\
  .codex/system_docs/*|.other-devices/components/*|\
  .claude/CLAUDE.md|.codex/CODEX.md|.codex/AGENTS.md|CLAUDE.md|\
  device.local.example.md|SYNC-REPOS.md|sync-repos-*.md|multi-device-and-agent-contract.md|\
  .docs/runbooks/development/device-*.md|.docs/runbooks/development/multi-device-*.md)
    P="$ROOT/.git/component-sync-pending"
    grep -qxF "$rel" "$P" 2>/dev/null || echo "$rel" >> "$P"
    ;;
  *) : ;;
esac
exit 0
