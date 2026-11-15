#!/usr/bin/env bash
# self-improvement-surface.sh — SessionStart banner for the self-improvement convention.
#
# Surfaces that the self-improvement log (`.self-improving-ai/`) is active, and shows the standing-rules
# count + the most recent log topic, so a fresh session (including one that just compacted) keeps
# documenting agent performance (benefits/bugs/commits) as work happens.
#
# Quiet by design: prints NOTHING when the folder/ledger is absent. Never errors out.
#   Disable with SELF_IMPROVING_AI_SURFACE=off.
set -uo pipefail
[ "${SELF_IMPROVING_AI_SURFACE:-on}" = "off" ] && exit 0

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
DIR="$ROOT/.self-improving-ai"
LEDGER="$DIR/ledger.md"
[ -d "$DIR" ] || exit 0

# Count the standing rules (numbered list under "## Standing rules") and find the newest log file.
rules=0
if [ -f "$LEDGER" ]; then
  rules=$(awk '/^## Standing rules/{f=1;next} /^## /{f=0} f && /^[0-9]+\./{n++} END{print n+0}' "$LEDGER")
fi
latest=""
if [ -d "$DIR/log" ]; then
  latest=$(ls -1t "$DIR/log"/*.md 2>/dev/null | head -1 | xargs -r basename 2>/dev/null)
fi

echo "[self-improving-ai] log active (.self-improving-ai/): ${rules} standing rule(s)${latest:+, latest log: $latest}."
echo "           After a subagent finishes or a notable action lands, record benefit + bug + verified + commit (/log-improvement). Promote durable learnings to ledger.md."
exit 0
