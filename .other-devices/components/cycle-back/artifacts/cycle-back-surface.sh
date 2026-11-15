#!/usr/bin/env bash
# cycle-back-surface.sh — SessionStart banner for the cycle-back convention.
#
# Prints a short list of OPEN + BLOCKED parked topics from .chat-history/cycle-back.md so that a fresh
# session — INCLUDING a context that just got compacted — re-sees the threads we deliberately deferred.
# This is the mechanism that makes cycle-back survive compaction: open threads re-enter context on their
# own instead of relying on the summary to have kept them.
#
# Quiet by design: prints NOTHING when there is no log or no open/blocked items. Never errors out.
#   Disable with CYCLE_BACK_SURFACE=off.
set -uo pipefail
[ "${CYCLE_BACK_SURFACE:-on}" = "off" ] && exit 0

# Resolve repo root; fall back to cwd.
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
LOG="$ROOT/.chat-history/cycle-back.md"
[ -f "$LOG" ] || exit 0

# Collect OPEN + BLOCKED entry headings: "### [OPEN] <title> — parked <date>"
mapfile -t items < <(grep -E '^### \[(OPEN|BLOCKED)\]' "$LOG" 2>/dev/null)
[ "${#items[@]}" -eq 0 ] && exit 0

echo "[cycle-back] ${#items[@]} parked topic(s) awaiting follow-up — resume with /cycle-back list (full context in .chat-history/cycle-back.md):"
n=0
for line in "${items[@]}"; do
  n=$((n+1)); [ "$n" -gt 8 ] && { echo "           … (+$(( ${#items[@]} - 8 )) more)"; break; }
  # strip the leading "### " markdown prefix; keep "[STATUS] title — parked date"
  echo "           - $(printf '%s' "$line" | sed 's/^#\{1,\} //')"
done
exit 0
