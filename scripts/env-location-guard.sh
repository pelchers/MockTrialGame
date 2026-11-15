#!/usr/bin/env bash
# env-location-guard.sh — refuse to commit an env file from inside CC/.
#
# The env vault (.envs/, repo root) is committed on purpose: CC-Local is private and the values
# travel between devices. That is safe because of WHERE they live. `CC/` is the subtree that gets
# patched into PRs against fmchisti/collectibleclassics, so an env file tracked inside `CC/` could
# ride a patch into the production repo — a different and much worse exposure than a private remote.
#
# `CC/**/.env*` is gitignored, so the only way one gets staged is `git add -f`. This catches that.
#
# Run standalone (checks the index):   bash scripts/env-location-guard.sh
# Installed as .git/hooks/pre-commit by scripts/install-git-hooks.sh.
set -uo pipefail

staged="$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)"
[ -z "$staged" ] && exit 0

# Env files anywhere under CC/ — .env, .env.local, .env.mode-a, apps/x/.env.production, etc.
# `.env.example` is a documented template with no values and is allowed.
offenders="$(printf '%s\n' "$staged" \
  | grep -E '^CC/.*(^|/)\.env($|\.)' \
  | grep -v '\.env\.example$' || true)"

if [ -n "$offenders" ]; then
  echo "BLOCKED: env file(s) staged from inside CC/ —" >&2
  printf '  %s\n' $offenders >&2
  cat >&2 <<'MSG'

CC/ is patched into PRs against fmchisti/collectibleclassics, so an env file tracked there can
reach the production repo. Env values belong in the root vault instead:

  1. git restore --staged <the file above>
  2. put the values in the matching .envs/ file (see .envs/manifest.tsv)
  3. pwsh ./scripts/env-sync.ps1        # writes it back to the live path, untracked

Override only if you are certain (it will be committed and pushed):  git commit --no-verify
MSG
  exit 1
fi
exit 0
