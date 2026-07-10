#!/usr/bin/env bash
# idle-handoff-monitor.sh — background idle auto-handoff (device-sync-protocol).
#
# Run PERIODICALLY (Windows Task Scheduler / cron — NOT a Claude event hook; Claude
# hooks can't fire on a timer). After IDLE_HANDOFF_HOURS (default 4) of NO source-file
# edits, if there is un-handed-off work it: commits it → prepends a HANDOFF.md entry →
# pushes the DEVICE WORKING BRANCH (NOT main). This means if you step away and switch
# machines, your work is committed + pushed + handed off automatically — the other PC's
# agent just runs /pickup. It NEVER syncs main (main = stable/prod; auto-pushing
# possibly-mid-work code to prod is unsafe — that stays a deliberate /winddown).
#
# Config (env): IDLE_HANDOFF=on|off (default on) · IDLE_HANDOFF_HOURS (default 4) ·
#               IDLE_HANDOFF_AGENT=1 (optional: use the subscription CLI to write a
#               richer summary; falls back to the commit list). Setup:
#               .claude/hooks/scripts/register-idle-handoff.ps1 (once per machine).
set -uo pipefail

# --- resolve repo from THIS script's location (robust to the scheduler's cwd) ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." 2>/dev/null && git rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$ROOT" ] && { echo "[idle-handoff] not a git repo — skip"; exit 0; }
cd "$ROOT" || exit 0

[ "${IDLE_HANDOFF:-on}" = "off" ] && { echo "[idle-handoff] disabled (IDLE_HANDOFF=off)"; exit 0; }
HOURS="${IDLE_HANDOFF_HOURS:-4}"
IDLE_SECS=$(( HOURS * 3600 ))
STATE="$ROOT/.git/idle-handoff-state"

# --- resolve device + working lane from device.local.md --------------------------
device="$(grep -E '^[[:space:]]*-[[:space:]]\[x\]' device.local.md 2>/dev/null \
  | awk '{print $3}' | tr -d '\r' | grep -xE 'home-desktop|asus-laptop' | head -1)"
[ -z "$device" ] && { echo "[idle-handoff] no device checked in device.local.md — skip"; exit 0; }
if [ "$device" = "home-desktop" ]; then lane="Home-Work"; else lane="Asus-Work"; fi

# --- idle check: newest mtime among tracked, non-ignored files -------------------
newest=0
while IFS= read -r f; do
  [ -f "$f" ] || continue
  m="$(stat -c %Y "$f" 2>/dev/null || echo 0)"
  [ "$m" -gt "$newest" ] 2>/dev/null && newest="$m"
done < <(git ls-files)
now="$(date +%s)"; idle=$(( now - newest ))
if [ "$idle" -lt "$IDLE_SECS" ]; then
  echo "[idle-handoff] active (idle ${idle}s < ${IDLE_SECS}s) — no action"; exit 0
fi

# --- un-handed-off work? (dirty tree OR new commits since last auto-handoff) ------
dirty="$(git status --porcelain 2>/dev/null)"
head_sha="$(git rev-parse HEAD 2>/dev/null || echo none)"
last="$(cat "$STATE" 2>/dev/null || echo none)"
if [ -z "$dirty" ] && [ "$head_sha" = "$last" ]; then
  echo "[idle-handoff] nothing new since last handoff — no action"; exit 0
fi
echo "[idle-handoff] idle ${HOURS}h with un-handed-off work → auto-handoff on $lane"

# --- ensure we're on the device lane (create from origin/lane or main if fresh) --
cur="$(git symbolic-ref --short -q HEAD 2>/dev/null || true)"
if [ "$cur" != "$lane" ]; then
  if git rev-parse --verify --quiet "$lane" >/dev/null 2>&1; then
    git checkout "$lane" 2>/dev/null || { echo "[idle-handoff] cannot checkout $lane — abort"; exit 1; }
  elif git rev-parse --verify --quiet "origin/$lane" >/dev/null 2>&1; then
    git checkout -b "$lane" "origin/$lane" 2>/dev/null || { echo "[idle-handoff] cannot create $lane — abort"; exit 1; }
  else
    git checkout -b "$lane" 2>/dev/null || { echo "[idle-handoff] cannot create $lane — abort"; exit 1; }
  fi
fi

# --- commit uncommitted work -----------------------------------------------------
if [ -n "$dirty" ]; then
  git add -A
  git commit -q -m "chore(auto-handoff): idle ${HOURS}h snapshot on $lane [skip ci]" 2>/dev/null || true
fi
sha="$(git rev-parse --short HEAD)"

# --- compose the entry body (optional agent summary, else commit list) -----------
range="$last..HEAD"; [ "$last" = "none" ] && range="HEAD~5..HEAD"
commits="$(git log --oneline "$range" 2>/dev/null | head -8 | sed 's/^/  - /')"
files="$(git diff --name-only "$range" 2>/dev/null | head -12 | sed 's/^/  - /')"
summary=""
if [ "${IDLE_HANDOFF_AGENT:-0}" = "1" ] && command -v claude >/dev/null 2>&1; then
  summary="$(git diff "$range" 2>/dev/null | head -400 \
    | claude -p "In 3-5 bullets, summarize these git changes for a device handoff note. Output only the bullets." 2>/dev/null || true)"
fi
[ -z "$summary" ] && summary="${commits:-  - (see git log)}"

# --- prepend a HANDOFF.md entry (newest-on-top, after the header's first '---') ---
ts="$(date +%Y-%m-%dT%H:%M:%S%z | sed -E 's/([0-9]{2})([0-9]{2})$/\1:\2/')"
host="$(hostname 2>/dev/null || echo "${COMPUTERNAME:-?}")"
ENTRY_FILE="$(mktemp)"
{
  echo "## $ts · $device ($host) · AUTO-HANDOFF (idle ${HOURS}h) · branch $lane @ $sha"
  echo "**Synced from:** (auto — idle monitor; user stepped away, no manual /winddown)"
  echo "**What changed (since last handoff):**"
  echo "$summary"
  echo "**Files touched:**"
  echo "${files:-  - (none)}"
  echo "**Where I stopped / state:** automatic snapshot of in-progress work on \`$lane\` (pushed). **NOT wound down to main** — run \`/winddown\` to sync main/prod when the work is actually done."
  echo "**Next actions:** resume here, or on the other machine run \`/pickup\` to pull \`$lane\`."
  echo "**Blocked on:** (auto-handoff — the work may be mid-task; review before continuing)."
  echo "**Gotchas:** this is an AUTOMATIC idle snapshot, not a deliberate wind-down; \`main\`/prod was NOT updated."
  echo ""
} > "$ENTRY_FILE"
if [ -f "$ROOT/HANDOFF.md" ] && grep -qE '^---$' "$ROOT/HANDOFF.md"; then
  head_part="$(awk '{print} /^---$/{exit}' "$ROOT/HANDOFF.md")"
  body_part="$(awk 'f{print} /^---$/{f=1}' "$ROOT/HANDOFF.md")"
  { printf '%s\n\n' "$head_part"; cat "$ENTRY_FILE"; printf '%s\n' "$body_part"; } > "$ROOT/HANDOFF.md"
else
  cat "$ENTRY_FILE" >> "$ROOT/HANDOFF.md"
fi
rm -f "$ENTRY_FILE"
git add HANDOFF.md && git commit -q -m "docs(auto-handoff): HANDOFF entry (idle ${HOURS}h) [skip ci]" 2>/dev/null || true

# --- push the DEVICE BRANCH only (never main) ------------------------------------
if git remote get-url origin >/dev/null 2>&1; then
  if git push origin "$lane" 2>/dev/null; then
    echo "[idle-handoff] pushed $lane to origin"
  else
    echo "[idle-handoff] push of $lane FAILED (offline or non-fast-forward) — committed locally; will retry next tick. NOT force-pushing."
  fi
fi

# --- chat-history freshness note (never fabricate) -------------------------------
CH="$ROOT/.chat-history/user-messages.md"
if [ -f "$CH" ]; then
  chm="$(stat -c %Y "$CH" 2>/dev/null || echo 0)"
  [ "$chm" -lt "$newest" ] 2>/dev/null && \
    echo "[idle-handoff] NOTE: .chat-history may be stale (older than last code edit) — review next session."
fi

# --- also flush stranded cross-repo component changes (bounded — component paths only) ---
if [ -x "$SCRIPT_DIR/sync-flush.sh" ] && [ "${IDLE_HANDOFF_FLUSH:-on}" != "off" ]; then
  echo "[idle-handoff] flushing cross-repo component changes to SYNC-REPOS targets…"
  bash "$SCRIPT_DIR/sync-flush.sh" 2>&1 | grep -E "flushed=|DIRTY|✓|PUSH FAILED" | sed 's/^/  /' || true
fi

# --- record state so we don't re-fire until there's new work ---------------------
git rev-parse HEAD > "$STATE" 2>/dev/null || true
echo "[idle-handoff] done — $lane handed off (HANDOFF updated + pushed) + cross-repo flushed. main NOT synced (deliberate /winddown only)."
exit 0
