#!/usr/bin/env bash
# self-improvement-log-reminder.sh — PostToolUse(Task) nudge for the self-improvement convention.
#
# Fires right after a subagent (the Task tool) finishes, reminding the orchestrator to record that
# subagent's outcome in `.self-improving-ai/` — benefit + bug/gap + how it was verified + the commit —
# while it is fresh. Reads the PostToolUse JSON on stdin to name the subagent.
#
# Advisory only: prints a short reminder to stdout, never blocks, never errors.
#   Disable with SELF_IMPROVING_AI_REMINDER=off.
set -uo pipefail
[ "${SELF_IMPROVING_AI_REMINDER:-on}" = "off" ] && exit 0

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
[ -d "$ROOT/.self-improving-ai" ] || exit 0   # only nudge where the log exists

# Best-effort: read the hook payload and extract the subagent's short description (jq is available in-repo).
payload="$(cat 2>/dev/null || true)"
desc=""
if [ -n "$payload" ]; then
  if command -v jq >/dev/null 2>&1; then
    desc="$(printf '%s' "$payload" | jq -r '(.tool_input.description // .tool_input.subagent_type // "")' 2>/dev/null)"
    [ "$desc" = "null" ] && desc=""
  fi
  # Fallback (no jq): pull the first "description":"…" value with sed.
  if [ -z "$desc" ]; then
    desc="$(printf '%s' "$payload" | sed -n 's/.*"description"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  fi
fi

echo "[self-improving-ai] subagent finished${desc:+ ($desc)} — log its outcome to .self-improving-ai/log/ (benefit + bug/gap + verified + commit); /log-improvement. Keep it minimal but real."
exit 0
