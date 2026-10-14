#!/usr/bin/env bash
# feature-review-refresh.sh — SessionStart staleness check for the feature-review convention.
#
# Prints a short banner when the root FEATURE-REVIEW.md looks OUT OF DATE against the upstream PR
# list, so a fresh session (including a just-compacted one) knows the index a reviewer trusts may be
# lying. It never edits the file — refreshing is /feature-review, a deliberate act.
#
# Staleness is judged two ways, both cheap:
#   1. An OPEN PR whose number does not appear in the file at all — something was submitted and the
#      index never heard about it.
#   2. The file's "Last refreshed" date is older than the newest of our commits that touched CC/ —
#      i.e. feature work has landed since the index was last looked at.
#
# Deliberately does NOT call the network by default: `gh` is only used when it is already
# authenticated AND FEATURE_REVIEW_HOOK_NET=on, so a SessionStart banner can never hang a session on
# a slow or rate-limited API. Without the network it falls back to check 2 alone.
#
# Quiet by design: prints NOTHING when the index looks current, when the file is absent, or on any
# error. Never fails a session.
#   Disable with FEATURE_REVIEW_REFRESH=off.
set -uo pipefail
[ "${FEATURE_REVIEW_REFRESH:-on}" = "off" ] && exit 0

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
FILE="$ROOT/FEATURE-REVIEW.md"

# No index yet — say so once, since the whole point is that a reviewer can find one.
if [ ! -f "$FILE" ]; then
  if [ -d "$ROOT/.adr/orchestration" ]; then
    echo "[feature-review] no FEATURE-REVIEW.md at the repo root — a reviewer has no index of what"
    echo "           exists, where to review it, or which PR carries it. Create it with /feature-review."
  fi
  exit 0
fi

reasons=()

# ── 1. Open PRs the index has never mentioned ───────────────────────────────────────────────────
if [ "${FEATURE_REVIEW_HOOK_NET:-off}" = "on" ] && command -v gh >/dev/null 2>&1; then
  # `|| true` throughout: an auth failure, no network or a rate limit must be silent, not an error.
  open_prs="$(gh pr list --author "@me" --state open --limit 20 --json number \
                --jq '.[].number' 2>/dev/null || true)"
  missing=()
  for n in $open_prs; do
    grep -q "pull/$n\b\|#$n\b" "$FILE" 2>/dev/null || missing+=("#$n")
  done
  [ "${#missing[@]}" -gt 0 ] && reasons+=("open PR(s) not in the index: ${missing[*]}")
fi

# ── 2. Feature work landed since the index was last refreshed ───────────────────────────────────
# "Last refreshed:** YYYY-MM-DD" in the header.
refreshed="$(grep -m1 -oE 'Last refreshed:\*\* [0-9]{4}-[0-9]{2}-[0-9]{2}' "$FILE" 2>/dev/null \
             | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' || true)"
if [ -n "$refreshed" ]; then
  # Newest commit date touching the product subtree.
  last_cc="$(git -C "$ROOT" log -1 --format=%ad --date=short -- CC/ 2>/dev/null || true)"
  if [ -n "$last_cc" ] && [[ "$last_cc" > "$refreshed" ]]; then
    reasons+=("CC/ changed on $last_cc; index last refreshed $refreshed")
  fi
fi

[ "${#reasons[@]}" -eq 0 ] && exit 0

echo "[feature-review] FEATURE-REVIEW.md may be stale — refresh with /feature-review:"
for r in "${reasons[@]}"; do
  echo "           - $r"
done
exit 0
