#!/usr/bin/env bash
# install-git-hooks.sh — install the repo's local git hooks. Idempotent; run once per clone.
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
hooks="$repo/.git/hooks"
mkdir -p "$hooks"

pre="$hooks/pre-commit"
marker="# >>> cc-local env-location-guard >>>"
if [ -f "$pre" ] && grep -qF "$marker" "$pre"; then
  echo "pre-commit: env-location-guard already installed"
else
  if [ ! -f "$pre" ]; then printf '#!/usr/bin/env bash\nset -uo pipefail\n' > "$pre"; fi
  cat >> "$pre" <<EOF

$marker
bash "\$(git rev-parse --show-toplevel)/scripts/env-location-guard.sh" || exit 1
# <<< cc-local env-location-guard <<<
EOF
  chmod +x "$pre"
  echo "pre-commit: env-location-guard installed"
fi
