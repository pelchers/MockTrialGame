#!/usr/bin/env bash
# feature-user-docs-detect.sh — the auto-fire half of the `feature-user-docs` component.
#
# TWO MODES, registered twice in settings.json:
#
#   (default)        PostToolUse (Edit|Write) — reads the tool payload on stdin. If the edited file is
#                    a feature's `primary_task_list.md` AND that edit grew the set of COMPLETE phases,
#                    regenerate that feature's `path-inventory.md` (a REAL write) and print MANDATORY
#                    instructions to refresh the prose `OVERVIEW.md`.
#
#   --session-scan   SessionStart — no payload. Reports features that have completed phases but no
#                    reading map, and maps whose inventory is newer than their overview. Catches
#                    completions this session never saw (another device, a `sed` through Bash, a merge).
#
# WHAT IS AND IS NOT AUTOMATIC — read this before claiming otherwise:
#   * `path-inventory.md` IS genuinely regenerated. It is deterministic (walk + regex + stat), so a
#     shell hook can produce it with no model involved.
#   * `OVERVIEW.md` IS NOT regenerated. Its value is one or two sentences per path saying what the file
#     is and why it matters — that requires reading the files, which requires a model. The hook DETECTS
#     the drift and INSTRUCTS; the agent does the work.
#   Claude Code hooks fire on events, never on arbitrary repo state, so "on ADR phase completion" is
#   necessarily "on the event that carried the completion" — which is exactly what this implements.
#
# Fires ONCE per transition: the set of complete phases per feature is fingerprinted into
# .git/feature-user-docs/<feature>.state (untracked, same pattern as .git/component-sync-pending).
#
# Quiet by design: prints NOTHING when nothing changed. Never blocks, never fails a tool call (exit 0
# always). Disable with FEATURE_USER_DOCS=off; suppress only the inventory WRITE with
# FEATURE_USER_DOCS_AUTOGEN=off.
set -uo pipefail

[ "${FEATURE_USER_DOCS:-on}" = "off" ] && exit 0

MODE="${1:-posttooluse}"

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$ROOT" ] && ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." 2>/dev/null && pwd)"
[ -z "$ROOT" ] && exit 0
[ -d "$ROOT/.adr/orchestration" ] || exit 0

SCRIPT="$ROOT/.codex/skills/feature-user-docs/scripts/feature-user-docs.py"
[ -f "$SCRIPT" ] || exit 0

PY="$(command -v python 2>/dev/null || command -v python3 2>/dev/null || true)"
[ -z "$PY" ] && exit 0

STATE_DIR="$ROOT/.git/feature-user-docs"
mkdir -p "$STATE_DIR" 2>/dev/null || true

# ---------------------------------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------------------------------

# Complete-phase fingerprint for one feature: newline-separated paths of phases marked complete.
fingerprint() {
  "$PY" "$SCRIPT" --repo-root "$ROOT" scan "$1" --json 2>/dev/null \
    | "$PY" -c "
import json,sys
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
for p in d.get('phases',[]):
    if p.get('complete'): print(p['path'])
" 2>/dev/null
}

state_file() { printf '%s/%s.state' "$STATE_DIR" "$(printf '%s' "$1" | tr '/@' '__')"; }

# ---------------------------------------------------------------------------------------------------
# mode: --session-scan  (SessionStart)
# ---------------------------------------------------------------------------------------------------

if [ "$MODE" = "--session-scan" ]; then
  out="$("$PY" "$SCRIPT" --repo-root "$ROOT" status --json 2>/dev/null)" || exit 0
  [ -z "$out" ] && exit 0

  report="$(printf '%s' "$out" | "$PY" -c "
import json,sys
try: rows=json.load(sys.stdin)
except Exception: sys.exit(0)
missing=[r for r in rows if r['complete']>0 and not r['overview']]
stale=[r for r in rows if r['overview_stale']]
if missing:
    print('MISSING|'+','.join(f\"{r['feature']} ({r['complete']}/{r['phases']} phases complete)\" for r in missing[:6]))
if stale:
    print('STALE|'+','.join(r['feature'] for r in stale[:6]))
" 2>/dev/null)"

  [ -z "$report" ] && exit 0

  echo "[feature-user-docs] reading-map status:"
  while IFS='|' read -r kind payload; do
    [ -z "${kind:-}" ] && continue
    case "$kind" in
      MISSING) echo "           no user-docs/OVERVIEW.md yet for: $payload" ;;
      STALE)   echo "           path-inventory.md newer than OVERVIEW.md (prose may be stale): $payload" ;;
    esac
  done <<< "$report"
  echo "           Refresh with /feature-user-docs <feature>  (agent: feature-user-docs-agent)."

  # Prime the per-feature fingerprints so the first real phase-completion edit of the session is
  # detected as a transition rather than as "everything is new".
  for d in "$ROOT"/.adr/orchestration/*/; do
    f="$(basename "$d")"
    case "$f" in *@*) ;; *) continue ;; esac
    sf="$(state_file "$f")"
    [ -f "$sf" ] || fingerprint "$f" > "$sf" 2>/dev/null || true
  done
  exit 0
fi

# ---------------------------------------------------------------------------------------------------
# mode: default  (PostToolUse — Edit|Write)
# ---------------------------------------------------------------------------------------------------

payload="$(cat 2>/dev/null || true)"
[ -z "$payload" ] && exit 0

fp="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
if [ -z "$fp" ]; then
  fp="$(printf '%s' "$payload" \
    | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 \
    | sed -E 's/.*:[[:space:]]*"([^"]*)".*/\1/')"
fi
[ -z "$fp" ] && exit 0

# Normalize to a repo-relative, forward-slashed path.
#
# Prefix-stripping alone is NOT safe here: the same repo root has at least three spellings on this
# platform — `C:\Work\App\CC-Local` (the hook payload), `C:/Work/App/CC-Local` (git rev-parse) and
# `/c/Work/App/CC-Local` (MSYS pwd). So: flip separators, then cut from the `.adr/` segment onward,
# which is spelling-independent. Fall back to prefix-stripping for a payload already relative.
rel="${fp//\\//}"
case "$rel" in
  */.adr/*) rel=".adr/${rel#*/.adr/}" ;;
  .adr/*)   ;;
  *)        rel="${rel#"${ROOT//\\//}"/}" ;;
esac

# Only a feature's primary_task_list.md can signal phase completion.
case "$rel" in
  .adr/orchestration/*/primary_task_list.md|.adr/orchestration/*/*/primary_task_list.md|\
  .adr/orchestration/*/*/*/primary_task_list.md|.adr/orchestration/*/*/*/*/primary_task_list.md) ;;
  *) exit 0 ;;
esac

FEATURE="$(printf '%s' "$rel" | sed -E 's#^\.adr/orchestration/([^/]+)/.*#\1#')"
[ -z "$FEATURE" ] && exit 0
case "$FEATURE" in *@*) ;; *) exit 0 ;; esac   # feature folders are <id>@<owner>

SF="$(state_file "$FEATURE")"
NEW="$(fingerprint "$FEATURE")"
OLD="$(cat "$SF" 2>/dev/null || true)"

# No change in the complete-phase set → nothing to do (this is the common case: ordinary edits).
[ "$NEW" = "$OLD" ] && exit 0

ADDED="$(comm -13 <(printf '%s\n' "$OLD" | sort -u) <(printf '%s\n' "$NEW" | sort -u) 2>/dev/null | sed '/^$/d')"
printf '%s' "$NEW" > "$SF" 2>/dev/null || true

# Only announce on GROWTH — a phase being reopened is not a trigger to regenerate.
[ -z "$ADDED" ] && exit 0

NCOMPLETE="$(printf '%s\n' "$NEW" | sed '/^$/d' | wc -l | tr -d ' ')"

echo "MANDATORY — feature-user-docs: an ADR phase for '$FEATURE' was just marked COMPLETE."
while IFS= read -r p; do
  [ -n "$p" ] && echo "  phase now complete: $p"
done <<< "$ADDED"

# --- the genuinely-automatic half: regenerate the deterministic path ledger ------------------------
INV=".docs/planning/$FEATURE/user-docs/path-inventory.md"
if [ "${FEATURE_USER_DOCS_AUTOGEN:-on}" = "off" ]; then
  echo "  path-inventory.md NOT regenerated (FEATURE_USER_DOCS_AUTOGEN=off). Run: /feature-user-docs $FEATURE"
else
  # Read the count the generator itself states, rather than re-deriving it from the markdown.
  count_of() {
    [ -f "$1" ] || { echo 0; return; }
    grep -m1 -oE 'Verified app paths: \*\*[0-9]+\*\*' "$1" 2>/dev/null \
      | grep -oE '[0-9]+' || echo 0
  }
  BEFORE_COUNT="$(count_of "$ROOT/$INV")"
  if "$PY" "$SCRIPT" --repo-root "$ROOT" scan "$FEATURE" --write >/dev/null 2>&1; then
    AFTER_COUNT="$(count_of "$ROOT/$INV")"
    echo "  REGENERATED (automatic, deterministic): $INV  [$BEFORE_COUNT -> $AFTER_COUNT verified paths]"
  else
    echo "  could not regenerate $INV — run manually: /feature-user-docs $FEATURE"
  fi
fi

# --- the half that needs a model: the prose map ----------------------------------------------------
OV=".docs/planning/$FEATURE/user-docs/OVERVIEW.md"
if [ -f "$ROOT/$OV" ]; then
  echo "  NOT automatic — refresh the PROSE reading map now (it needs reading files, so a hook cannot):"
  echo "    1. Read $INV and diff it against the paths cited in $OV."
  echo "    2. Open any newly-added file; add its 1-2 sentence entry to the right group. Edit"
  echo "       incrementally — do NOT rewrite the curated prose."
  echo "    3. Update the header's 'Phases complete' to $NCOMPLETE and the generated date."
  echo "    4. Verify: python .codex/skills/feature-user-docs/scripts/feature-user-docs.py verify $FEATURE"
else
  echo "  NO reading map exists for this feature yet. Create it now: /feature-user-docs $FEATURE"
fi
echo "  Agent: feature-user-docs-agent · Skill: feature-user-docs"

exit 0
