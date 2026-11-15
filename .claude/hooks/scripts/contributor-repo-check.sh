#!/usr/bin/env bash
# contributor-repo-check.sh — SessionStart
#
# Part of the contributor-conventions component. Reads repo.local.md; on a repo declared
# `contributor` it announces the safe default push target + that the upstream is PR-only,
# so every session starts knowing where it is safe to push. Informational only — never
# blocks session start. Owner repos (or missing declaration) stay quiet.
# The user only ever edits repo.local.md. Spec: .docs/runbooks/development/contributor-conventions.md
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$ROOT" ] || exit 0
DECL="$ROOT/repo.local.md"
[ -f "$DECL" ] || exit 0

# Owner repo -> conventions inert; stay quiet.
grep -qiE '^[[:space:]]*-?[[:space:]]*\[[xX]\][[:space:]]*owner' "$DECL" && exit 0

if grep -qiE '^[[:space:]]*-?[[:space:]]*\[[xX]\][[:space:]]*contributor' "$DECL"; then
  WR="$(grep -iE '^[[:space:]]*working_remote[[:space:]]*=' "$DECL" | head -1 | sed 's/^[^=]*=//; s/#.*//; s/[[:space:]]//g')"
  UID_="$(grep -iE '^[[:space:]]*upstream_repo_id[[:space:]]*=' "$DECL" | head -1 | sed 's/^[^=]*=//; s/#.*//; s/[[:space:]]//g')"
  UB="$(grep -iE '^[[:space:]]*upstream_base[[:space:]]*=' "$DECL" | head -1 | sed 's/^[^=]*=//; s/#.*//; s/[[:space:]]//g')"
  echo "[contributor-conventions] CONTRIBUTOR repo — default push = ${WR:-<working_remote>}; upstream ${UID_:-<upstream>} is PR-only into ${UB:-<dev>}; run /promote-pr to promote."
fi
exit 0
