#!/usr/bin/env bash
# contributor-push-guard.sh — PreToolUse (Bash|PowerShell)
#
# Part of the contributor-conventions component. FAIL-OPEN last-resort guard: it blocks
# ONLY an accidental `git push` to the DECLARED UPSTREAM remote of a repo that repo.local.md
# marks `contributor`. It NEVER blocks working-remote pushes, NEVER blocks on an `owner` repo,
# and ALWAYS allows a push carrying the CONTRIBUTOR_PUSH_OK=1 marker (the sanctioned escape
# hatch used by /promote-pr). Any uncertainty (no jq, no repo.local.md, no upstream, parse
# issue) -> ALLOW. Behavior spec: .codex/system_docs/contributor_conventions/HOOKS-TODO.md
set -uo pipefail

# Command under inspection. Read stdin ONCE, then parse with jq if available else node
# (node is always present) — fail-open on any parse issue.
INPUT="$(cat 2>/dev/null || echo "")"

# FAST PATH: this hook fires on EVERY Bash/PowerShell call. If the raw payload does not
# even mention 'push', there is nothing to guard — bail before spawning any parser.
echo "$INPUT" | grep -q 'push' || exit 0

if command -v jq >/dev/null 2>&1; then
  CMD="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null || echo "")"
else
  CMD="$(printf '%s' "$INPUT" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{let c='';try{c=(JSON.parse(s).tool_input||{}).command||''}catch(e){}process.stdout.write(String(c))})" 2>/dev/null || echo "")"
fi
[ -n "$CMD" ] || exit 0

# Only git pushes matter.
echo "$CMD" | grep -q 'git push' || exit 0

# Sanctioned / explicitly-authorized upstream push -> always allow.
echo "$CMD" | grep -q 'CONTRIBUTOR_PUSH_OK=1' && exit 0

# Need repo.local.md at the repo root; absent -> allow (e.g. a scratch clone).
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$ROOT" ] || exit 0
DECL="$ROOT/repo.local.md"
[ -f "$DECL" ] || exit 0

# Only contributor repos are guarded; owner/unknown -> allow.
grep -qiE '^[[:space:]]*-?[[:space:]]*\[[xX]\][[:space:]]*contributor' "$DECL" || exit 0

# Declared upstream identifiers.
UP_URL="$(grep -iE '^[[:space:]]*upstream_remote[[:space:]]*=' "$DECL" | head -1 | sed 's/^[^=]*=//; s/#.*//; s/[[:space:]]//g')"
UP_ID="$(grep -iE '^[[:space:]]*upstream_repo_id[[:space:]]*=' "$DECL" | head -1 | sed 's/^[^=]*=//; s/#.*//; s/[[:space:]]//g')"

# The PUSH INVOCATION ONLY — every line that runs `git push`, from `git push` onward.
#
# The identifier match below used to run against the WHOLE command string, so a command that merely
# MENTIONED the upstream anywhere (a commit message in a heredoc, an echoed note, a path) read as a
# push to it. A routine `git push origin <lane>` chained after a `git commit -F -` whose message
# discussed the upstream was blocked on exactly that.
#
# That false positive is not harmless: the documented way past this block is to prefix
# CONTRIBUTOR_PUSH_OK=1, so a guard that fires on ordinary working-remote pushes teaches the very
# reflex that disarms it. Precision is part of the safety property.
#
# Coverage is unchanged — a real upstream push names the upstream in the push's own arguments.
PUSHCMD="$(echo "$CMD" | grep -o 'git push.*' || true)"
[ -n "$PUSHCMD" ] || exit 0

# Does this push target the upstream? (URL substring, repo-id substring, or a remote named upstream/prod/production)
TARGET=0
[ -n "$UP_URL" ] && echo "$PUSHCMD" | grep -qF "$UP_URL" && TARGET=1
[ -n "$UP_ID" ]  && echo "$PUSHCMD" | grep -qF "$UP_ID"  && TARGET=1
echo "$PUSHCMD" | grep -qE 'git push[[:space:]]+([^[:space:]]+[[:space:]]+)*(upstream|prod|production)([[:space:]/]|$)' && TARGET=1

[ "$TARGET" = "1" ] || exit 0   # not the upstream -> allow (working remote, etc.)

# High-confidence accidental upstream push on a contributor repo -> block.
echo "BLOCKED (contributor-conventions): this pushes to the declared UPSTREAM of a contributor repo." >&2
echo "Upstream pushes are user-request-only + PR-ready. Use /promote-pr (the scratch-clone PR flow)." >&2
echo "If the user explicitly authorized THIS exact push, prefix it: CONTRIBUTOR_PUSH_OK=1 git push ..." >&2
exit 2
