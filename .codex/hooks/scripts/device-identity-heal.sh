#!/usr/bin/env bash
# device-identity-heal.sh — keep THIS clone's device identity correct in device.local.md.
#
# device.local.md is per-machine but TRACKED (no-ignore policy). `.gitattributes` marks it
# `merge=ours`, but that driver only fires on a real CONFLICT (both sides changed the file).
# In the common cross-device case — the OTHER device changed device.local.md and this one did
# NOT — git fast-adopts THEIRS, silently clobbering this clone's identity. That is exactly what
# happens on a /pickup that merges the other lane's work (component work here, app work there).
#
# Fix: keep a per-clone source of truth at .git/device-identity (never merged — it lives in
# .git/, not the work tree) and restore the section-1 checkbox + HOSTNAME pin from it. Capture
# it once on a TRUSTED run (hostname pin matches this host, or is unset) so we only ever trust a
# correctly-set toggle. Idempotent + quiet: prints only when it actually heals.
#
# Fired by: device-sync-check.sh (SessionStart) AND a git `post-merge` hook that script installs,
# so identity is restored the instant a /pickup merge or `git pull` lands — before any commit can
# push the wrong identity to the working lane or main.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$ROOT" ] && exit 0
TOGGLE="$ROOT/device.local.md"
ID_FILE="$ROOT/.git/device-identity"
[ -f "$TOGGLE" ] || exit 0

cur="$(grep -E '^[[:space:]]*-[[:space:]]\[x\]' "$TOGGLE" 2>/dev/null \
  | awk '{print $3}' | tr -d '\r' | grep -xE 'home-desktop|asus-laptop' | head -1)"
pin="$(grep -E '^HOSTNAME=' "$TOGGLE" 2>/dev/null | head -1 | sed -E 's/^HOSTNAME=//' | tr -d '[:space:]')"
host="$(hostname 2>/dev/null || echo "${COMPUTERNAME:-}")"

set_device_box() {  # $1 = home-desktop|asus-laptop → rewrite the section-1 checkboxes
  local h=' ' a=' '
  [ "$1" = home-desktop ] && h=x; [ "$1" = asus-laptop ] && a=x
  sed -i -E "s/^([[:space:]]*-[[:space:]]*\[)[ xX](\][[:space:]]*home-desktop)/\1$h\2/; s/^([[:space:]]*-[[:space:]]*\[)[ xX](\][[:space:]]*asus-laptop)/\1$a\2/" "$TOGGLE" 2>/dev/null || true
}

if [ -f "$ID_FILE" ]; then
  want="$(head -1 "$ID_FILE" 2>/dev/null | tr -d '[:space:]\r')"
  if [ -n "$want" ] && [ "$want" != "$cur" ]; then
    set_device_box "$want"
    [ -n "$host" ] && sed -i -E "s/^HOSTNAME=.*/HOSTNAME=$host/" "$TOGGLE" 2>/dev/null || true
    echo "[device-identity] self-heal: device.local.md was '${cur:-<blank>}' but this clone is '$want' (clobbered by a cross-device merge) — restored to '$want'."
  fi
elif [ -n "$cur" ] && { [ -z "$pin" ] || [ "${pin,,}" = "${host,,}" ]; }; then
  echo "$cur" > "$ID_FILE" 2>/dev/null || true   # trusted capture — hostname matches (or unset)
fi
exit 0
