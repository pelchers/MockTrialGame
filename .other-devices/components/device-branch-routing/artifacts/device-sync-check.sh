#!/usr/bin/env bash
# device-sync-check.sh — SessionStart
#
# Reads the per-machine toggle (device.local.md at repo root), resolves the default
# git target for THIS device, and reports branch + ahead/behind vs main so every new
# conversation starts knowing whether it is synced with main.
#
# Part of the device-branch-routing component. Edits to behavior belong in:
#   .docs/runbooks/development/device-branch-convention.md
# The user only ever edits device.local.md.
#
# Read-only except: if device.local.md is missing it seeds one from the template.
set -uo pipefail

MAIN="main"

# --- locate repo root -------------------------------------------------------
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then
  echo "[device-sync] not a git repo — skipping"
  exit 0
fi

TOGGLE="$ROOT/device.local.md"
TEMPLATE="$ROOT/device.local.example.md"

# --- ensure toggle exists ---------------------------------------------------
if [ ! -f "$TOGGLE" ]; then
  if [ -f "$TEMPLATE" ]; then
    cp "$TEMPLATE" "$TOGGLE" 2>/dev/null || true
    echo "[device-sync] WARNING: device.local.md was missing — seeded from template."
    echo "[device-sync] ACTION: open device.local.md and check ONE device, then continue."
    exit 0
  fi
  echo "[device-sync] WARNING: no device.local.md and no template. Cannot resolve device."
  echo "[device-sync] ACTION: create device.local.md (see runbook) before any push."
  exit 0
fi

# --- parse the checked boxes (token = 3rd field, before any '#' comment) -----
# Using awk '{print $3}' avoids locale/emoji issues in the trailing comments.
checked="$(grep -E '^[[:space:]]*-[[:space:]]\[x\]' "$TOGGLE" 2>/dev/null \
  | awk '{print $3}' | tr -d '\r')"

pick() { echo "$checked" | grep -xE "$1" | head -1; }

device="$(pick 'home-desktop|asus-laptop')"
target="$(pick 'device-default|main')"
method="$(pick 'direct-push|pr-release')"
[ -z "$method" ] && method="direct-push"

# hostname pin (toggle 4)
pin="$(grep -E '^HOSTNAME=' "$TOGGLE" 2>/dev/null | head -1 | sed -E 's/^HOSTNAME=//' | tr -d '[:space:]')"
host="$(hostname 2>/dev/null || echo "${COMPUTERNAME:-}")"

# --- resolve default branch -------------------------------------------------
if [ -z "$device" ]; then
  echo "[device-sync] WARNING: no device checked in device.local.md — STOP and ask before any push."
  exit 0
fi

if [ "$target" = "main" ]; then
  default_branch="$MAIN"
elif [ "$device" = "home-desktop" ]; then
  default_branch="$MAIN"
elif [ "$device" = "asus-laptop" ]; then
  default_branch="Asus-Work"
else
  default_branch="$MAIN"
fi

# branch name — robust to unborn HEAD (no commits) and detached HEAD
cur="$(git symbolic-ref --short -q HEAD 2>/dev/null || true)"
[ -z "$cur" ] && cur="$(git rev-parse --abbrev-ref HEAD 2>/dev/null | tr -d '\r\n')"
[ -z "$cur" ] && cur='(detached)'

# --- best-effort bounded fetch ---------------------------------------------
stale=""
if command -v timeout >/dev/null 2>&1; then
  timeout 8 git fetch --quiet origin "$MAIN" 2>/dev/null || stale=" (local ref, may be stale)"
else
  git fetch --quiet origin "$MAIN" 2>/dev/null || stale=" (local ref, may be stale)"
fi

# --- ahead/behind vs origin/main -------------------------------------------
sync="(no origin/$MAIN)"
if git rev-parse --verify --quiet "origin/$MAIN" >/dev/null 2>&1; then
  counts="$(git rev-list --left-right --count "origin/$MAIN...HEAD" 2>/dev/null || echo '0 0')"
  behind="$(echo "$counts" | awk '{print $1+0}')"
  ahead="$(echo "$counts" | awk '{print $2+0}')"
  if [ "$ahead" -eq 0 ] && [ "$behind" -eq 0 ]; then
    sync="SYNCED with $MAIN"
  elif [ "$behind" -eq 0 ]; then
    sync="AHEAD of $MAIN by $ahead"
  elif [ "$ahead" -eq 0 ]; then
    sync="BEHIND $MAIN by $behind (pull/rebase before working)"
  else
    sync="DIVERGED (ahead $ahead / behind $behind)"
  fi
fi

# --- hostname guard ---------------------------------------------------------
warn=""
if [ -n "$pin" ] && [ -n "$host" ] && [ "${pin,,}" != "${host,,}" ]; then
  warn="  [!] hostname pin '$pin' != this host '$host' — device.local.md may be copied from another machine."
fi

# --- banner -----------------------------------------------------------------
echo "[device-sync] device=$device | branch=$cur | default-target=$default_branch | release=$method"
echo "[device-sync] $sync$stale"
if [ "$device" = "asus-laptop" ] && [ "$target" != "main" ]; then
  echo "[device-sync] push-gate: routine commits/pushes -> Asus-Work; push to main ONLY when explicitly directed."
fi
[ -n "$warn" ] && echo "[device-sync]$warn"
exit 0
