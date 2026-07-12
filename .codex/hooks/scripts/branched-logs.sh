#!/usr/bin/env bash
# branched-logs.sh — orchestrate the device-branched append-log engine across ALL registered logs.
#
# Wraps branched-log-merge.py for the whole set of multi-device append logs so hooks + /pickup can
# act on them in one call. Each device appends only to its own segment `<base>.<device>.md`; the
# merged view `<base>.md` is regenerated deterministically. Logs ALWAYS union both devices' entries
# (0 chat-history loss) regardless of the code-merge mode.
#
#   merge-all                         rebuild every merged view from its segments (idempotent)
#   migrate-all [device]              one-time: split each legacy <base>.md into <base>.<device>.md
#   absorb-all  <other-device> <ref>  pull the OTHER branch's log entries in from a git ref (0 loss)
#
# Auto-fired: `merge-all` runs from the git post-merge hook (after every pull/merge). `/pickup` runs
# `absorb-all` for the other device's ref, then `merge-all`, in EVERY mode (both/theirs/ours).
set -uo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ENG="$ROOT/.claude/hooks/scripts/branched-log-merge.py"
[ -f "$ENG" ] || ENG="$ROOT/.codex/hooks/scripts/branched-log-merge.py"
PY="$(command -v python 2>/dev/null || command -v python3 2>/dev/null || echo python)"

# registry:  name | dir (relative to ROOT) | order (asc=newest-last, desc=newest-first) | logtype
# Only block-entry logs go through the segment/marker engine. component-sync-log is a mixed
# markdown-TABLE + prose ledger — markers between table rows would break the table — so it is
# protected by `merge=union` in .gitattributes instead (both devices' appended rows/sections survive).
LOGS=(
  "user-messages|.chat-history|asc|chat"
  "HANDOFF|.|desc|handoff"
)

resolve_device() {
  local t="$ROOT/device.local.md"; [ -f "$t" ] || return 0
  grep -E '^[[:space:]]*-[[:space:]]\[x\]' "$t" 2>/dev/null | awk '{print $3}' | tr -d '\r' \
    | grep -xE 'home-desktop|asus-laptop' | head -1
}
relpath() { [ "$1" = "." ] && echo "$2.md" || echo "$1/$2.md"; }

merge_all() {
  for spec in "${LOGS[@]}"; do IFS='|' read -r name dir order logtype <<< "$spec"
    [ -d "$ROOT/$dir" ] || continue
    "$PY" "$ENG" merge "$name" "$ROOT/$dir" "$order" 2>/dev/null || true
  done
}
migrate_all() {
  local dev="${1:-$(resolve_device)}"
  [ -z "$dev" ] && { echo "[branched-logs] no device resolved (device.local.md) — aborting migrate"; return 1; }
  for spec in "${LOGS[@]}"; do IFS='|' read -r name dir order logtype <<< "$spec"
    [ -f "$ROOT/$dir/$name.md" ] || continue
    "$PY" "$ENG" migrate "$name" "$ROOT/$dir" "$order" "$dev" "$logtype"
  done
}
absorb_all() {
  local other="$1" ref="$2" tmp path
  for spec in "${LOGS[@]}"; do IFS='|' read -r name dir order logtype <<< "$spec"
    path="$(relpath "$dir" "$name")"
    tmp="$ROOT/.git/.absorb-$name.tmp"
    # MSYS_NO_PATHCONV: git-bash otherwise mangles the `ref:sub/dir/file` blob spec into a Windows path
    if MSYS_NO_PATHCONV=1 git -C "$ROOT" show "$ref:$path" > "$tmp" 2>/dev/null; then
      "$PY" "$ENG" absorb "$name" "$ROOT/$dir" "$order" "$other" "$logtype" "$tmp"
    fi
    rm -f "$tmp" 2>/dev/null || true
  done
}

case "${1:-merge-all}" in
  merge-all)   merge_all ;;
  migrate-all) migrate_all "${2:-}" ;;
  absorb-all)  absorb_all "${2:?other-device}" "${3:?git-ref}" ;;
  *) echo "usage: branched-logs.sh [merge-all | migrate-all <device> | absorb-all <other-device> <ref>]"; exit 2 ;;
esac
