#!/usr/bin/env bash
# session-winddown.sh — SessionEnd hook. Lightweight auto-safety-net at session end:
#  1. If THIS repo has un-handed-off work, snapshot it onto the device lane (commit +
#     push the DEVICE BRANCH; never main) so nothing is lost if you switch machines.
#  2. Report any pending cross-repo component propagation (from the detector) +
#     dry-run the flush so the next session sees what still needs syncing.
# It does NOT auto-push the 11 external target remotes on every exit (that's the idle
# monitor's job at IDLE_HANDOFF_HOURS, and explicit /sync-flush) — this stays fast/safe.
# Disable with SESSION_WINDDOWN=off.
set -uo pipefail
[ "${SESSION_WINDDOWN:-on}" = "off" ] && exit 0
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"; [ -z "$ROOT" ] && exit 0
cd "$ROOT" || exit 0
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. snapshot this repo's un-handed-off work onto the device lane (reuse the idle
#    monitor with a 0h threshold so it fires now; it only pushes the device branch).
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "[session-winddown] un-handed-off work in $(basename "$ROOT") — snapshotting to device lane…"
  IDLE_HANDOFF_HOURS=0 bash "$DIR/idle-handoff-monitor.sh" 2>&1 | sed 's/^/  /' || true
fi

# 2. surface pending cross-repo component propagation
P="$ROOT/.git/component-sync-pending"
if [ -s "$P" ]; then
  echo "[session-winddown] component files changed this session (need propagation to SYNC-REPOS):"
  sed 's/^/  - /' "$P"
  echo "[session-winddown] run /sync-component + /sync-flush (or wait for the idle monitor)."
fi
# 3. dry-run the flush so stranded target changes are visible
[ -x "$DIR/sync-flush.sh" ] && bash "$DIR/sync-flush.sh" --dry-run 2>&1 | grep -E "DIRTY|done" | sed 's/^/  /' || true
exit 0
