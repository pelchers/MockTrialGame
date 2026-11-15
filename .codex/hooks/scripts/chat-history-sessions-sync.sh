#!/usr/bin/env bash
# chat-history-sessions-sync.sh: keeps .chat-history/sessions/ in step with the chat history on
# its own, so no agent has to load a skill or remember to run split-sessions.mjs.
#
# Part of the chat-history-convention component (the "Sessions folder" section of its SKILL.md).
# Registered in .claude/settings.json on three events:
#   PostToolUse (Edit|Write)  right after an entry is written with the Edit or Write tool
#   Stop                      at the end of every turn, which also catches entries appended by a
#                             shell command (heredoc, append-user-message.ps1)
#   SessionStart              catches entries that arrived with a pull from another device
#
# Cheap when nothing changed: it compares the size and modified time of the history files with a
# stamp kept under .git/ and exits. Only when they differ does it run split-sessions.mjs, which
# reads the history and never writes it, and rewrites only the session files whose content changed.
# Never blocks and never fails a tool call (always exits 0). Disable with
# CHAT_HISTORY_SESSIONS_SYNC=off.
set -uo pipefail
[ "${CHAT_HISTORY_SESSIONS_SYNC:-on}" = "off" ] && exit 0

# Read the hook payload (if any). For an Edit or Write, skip fast unless the edited file is a
# chat history file.
payload=""
[ -t 0 ] || payload="$(cat 2>/dev/null || true)"
case "$payload" in
  *'"tool_name"'*)
    case "$payload" in
      *user-messages*) : ;;
      *) exit 0 ;;
    esac
    ;;
esac

ROOT="${CLAUDE_PROJECT_DIR:-}"
[ -n "$ROOT" ] && [ -d "$ROOT" ] || ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CH="$ROOT/.chat-history"
[ -d "$CH" ] || exit 0

SCRIPT=""
for c in "$ROOT/.claude/skills/chat-history-convention/scripts/split-sessions.mjs" \
         "$ROOT/.codex/skills/chat-history-convention/scripts/split-sessions.mjs"; do
  [ -f "$c" ] && { SCRIPT="$c"; break; }
done
[ -n "$SCRIPT" ] || exit 0
command -v node >/dev/null 2>&1 || exit 0

# Signature of the history sources: name, size and modified time of each.
sig=""
for f in "$CH"/user-messages*.md "$CH"/user-messages*.log; do
  [ -f "$f" ] || continue
  st="$(stat -c '%s:%Y' "$f" 2>/dev/null || stat -f '%z:%m' "$f" 2>/dev/null || echo '?')"
  sig="$sig|${f##*/}:$st"
done
[ -n "$sig" ] || exit 0

# Stamp lives in the git dir (never committed). Keyed by the repo path so several projects that
# share one git dir (a template umbrella) do not overwrite each other's stamp.
GD="$(git -C "$ROOT" rev-parse --absolute-git-dir 2>/dev/null || true)"
[ -n "$GD" ] && [ -d "$GD" ] || GD="${TMPDIR:-/tmp}"
key="$(printf '%s' "$ROOT" | cksum | cut -d' ' -f1)"
STAMP="$GD/chat-history-sessions-$key.stamp"

if [ -d "$CH/sessions" ] && [ -f "$STAMP" ] && [ "$(cat "$STAMP" 2>/dev/null)" = "$sig" ]; then
  exit 0
fi

if ( cd "$ROOT" && node "$SCRIPT" >/dev/null 2>&1 ); then
  printf '%s' "$sig" > "$STAMP" 2>/dev/null || true
fi
exit 0
