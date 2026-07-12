#!/usr/bin/env bash
# sync-component.sh — propagate the reusable device-sync / device-branch component
# surface from THIS repo (source of truth) to one target repo, WIRE the SessionStart
# hook into the target's settings.json (idempotent), seed HANDOFF.md if missing, append
# convention blocks idempotently, and LOG to component-sync-log.md. Copy-only (never
# commits — /sync-flush commits+pushes only the component paths). Safe: never touches
# the target's device.local.md or project-specific app files.
#
#   Usage:  sync-component.sh <target-dir> <label>
#   Then:   sync-flush.sh   (to commit+push what this staged)
set -uo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TARGET="${1:?target dir}"; NAME="${2:-$(basename "$TARGET")}"
log() { echo "[sync-component:$NAME] $*"; }
[ -d "$TARGET" ] || { log "MISSING target — skip"; exit 0; }

# --- reusable files (overwrite target copies with the corrected source) ---------
FILES=(
  ".claude/skills/device-sync-protocol/SKILL.md" ".codex/skills/device-sync-protocol/SKILL.md"
  ".claude/skills/device-branch-routing/SKILL.md" ".codex/skills/device-branch-routing/SKILL.md"
  ".claude/agents/device-sync-agent/AGENT.md" ".codex/agents/device-sync-agent/AGENT.md"
  ".claude/commands/pickup.md" ".claude/commands/winddown.md" ".claude/commands/device.md"
  ".claude/commands/sync-flush.md" ".claude/commands/sync-component.md"
  ".codex/commands/pickup.md" ".codex/commands/winddown.md" ".codex/commands/device.md"
  ".codex/commands/sync-flush.md" ".codex/commands/sync-component.md"
  ".claude/hooks/scripts/device-sync-check.sh" ".codex/hooks/scripts/device-sync-check.sh"
  ".claude/hooks/scripts/device-identity-heal.sh" ".codex/hooks/scripts/device-identity-heal.sh"
  ".claude/hooks/scripts/branched-log-merge.py" ".codex/hooks/scripts/branched-log-merge.py"
  ".claude/hooks/scripts/branched-logs.sh" ".codex/hooks/scripts/branched-logs.sh"
  ".claude/skills/chat-history-convention/SKILL.md" ".codex/skills/chat-history-convention/SKILL.md"
  ".claude/skills/chat-history-convention/scripts/append-user-message.ps1" ".codex/skills/chat-history-convention/scripts/append-user-message.ps1"
  ".codex/system_docs/branched_logs/README.md" ".codex/system_docs/branched_logs/tests-explained.md"
  ".claude/hooks/scripts/idle-handoff-monitor.sh" ".codex/hooks/scripts/idle-handoff-monitor.sh"
  ".claude/hooks/scripts/register-idle-handoff.ps1" ".codex/hooks/scripts/register-idle-handoff.ps1"
  ".claude/hooks/scripts/sync-flush.sh" ".codex/hooks/scripts/sync-flush.sh"
  ".claude/hooks/scripts/sync-component.sh" ".codex/hooks/scripts/sync-component.sh"
  ".claude/hooks/scripts/component-change-detector.sh" ".codex/hooks/scripts/component-change-detector.sh"
  ".claude/hooks/scripts/session-winddown.sh" ".codex/hooks/scripts/session-winddown.sh"
  ".codex/system_docs/device_sync_protocol/README.md" ".codex/system_docs/device_sync_protocol/USAGE_GUIDE.md"
  ".codex/system_docs/device_branch_routing/README.md"
  ".docs/runbooks/development/device-sync-and-handoff-protocol.md"
  ".docs/runbooks/development/device-branch-convention.md"
  ".docs/runbooks/development/multi-device-and-agent-contract.md"
  "multi-device-and-agent-contract.md" "device.local.example.md"
  "SYNC-REPOS.md" "sync-repos-asus-laptop.md"
)
copied=0
for f in "${FILES[@]}"; do
  [ -f "$SRC/$f" ] || continue
  mkdir -p "$(dirname "$TARGET/$f")" && cp "$SRC/$f" "$TARGET/$f" && copied=$((copied+1))
done
log "copied $copied reusable files"

# --- portable packages ----------------------------------------------------------
for pkg in device-sync-protocol device-branch-routing multi-agent-collaboration branched-logs; do
  [ -d "$SRC/.other-devices/components/$pkg" ] || continue
  mkdir -p "$TARGET/.other-devices/components"
  cp -r "$SRC/.other-devices/components/$pkg" "$TARGET/.other-devices/components/"
done
log "staged .other-devices packages"

# --- HANDOFF.md — seed from template only if missing ----------------------------
TPL="$SRC/.other-devices/components/device-sync-protocol/artifacts/HANDOFF.template.md"
[ ! -f "$TARGET/HANDOFF.md" ] && [ -f "$TPL" ] && { cp "$TPL" "$TARGET/HANDOFF.md"; log "seeded HANDOFF.md"; }

# --- protect per-device / append-only files across merges (append, don't clobber) ---
GA="$TARGET/.gitattributes"
grep -q "device.local.md merge=ours" "$GA" 2>/dev/null || printf 'device.local.md merge=ours\n' >> "$GA"
grep -q "HANDOFF.md merge=union" "$GA" 2>/dev/null || printf 'HANDOFF.md merge=union\n' >> "$GA"
git -C "$TARGET" config merge.ours.driver true 2>/dev/null || true
log "ensured .gitattributes (device.local.md merge=ours) + merge driver"

# --- WIRE the SessionStart hook into settings.json (idempotent) ------------------
wire_hook() {
  local sj="$1"
  [ -d "$(dirname "$sj")" ] || return 0
  local PY; PY="$(command -v python 2>/dev/null || command -v python3 2>/dev/null || true)"
  [ -z "$PY" ] && { log "python not found — cannot wire $sj (copy done; wire manually)"; return 0; }
  local out; out="$("$PY" - "$sj" <<'PYEOF'
import json,sys,os
sj=sys.argv[1]
try:
    d=json.load(open(sj,encoding="utf-8")) if os.path.exists(sj) and os.path.getsize(sj) else {}
except Exception:
    d={}
d.setdefault("hooks",{})
def cmds(evt):
    return " ".join(json.dumps(x) for x in d["hooks"].get(evt,[]))
# (event, matcher-or-None, script, description)
WANT=[
    ("SessionStart", None, "device-sync-check.sh", "Device + branch + cross-device sync status (device-sync-protocol)"),
    ("PostToolUse", "Edit|Write", "component-change-detector.sh", "Flag edited reusable-component files for cross-repo propagation"),
    ("SessionEnd", None, "session-winddown.sh", "Auto safety-net: snapshot this repo's lane + report stranded component changes"),
]
added=[]
for evt,matcher,script,desc in WANT:
    if script in cmds(evt):  # already wired
        continue
    entry={"hooks":[{"type":"command","command":f"bash .claude/hooks/scripts/{script}","description":desc}]}
    if matcher: entry={"matcher":matcher,**entry}
    d["hooks"].setdefault(evt,[]).append(entry)
    added.append(evt)
if added:
    json.dump(d,open(sj,"w",encoding="utf-8"),indent=2)
    print("WIRED "+",".join(added))
else:
    print("PRESENT")
PYEOF
)" || { log "could not wire ${sj#$TARGET/} (python error) — leaving as-is"; return 0; }
  log "auto-fire hooks: $out → ${sj#$TARGET/}"
}
wire_hook "$TARGET/.claude/settings.json"

# --- idempotent convention-block append -----------------------------------------
ensure_block() {
  local file="$1" marker="$2" src="$3"
  [ -f "$file" ] || return 0
  grep -q "$marker" "$file" && return 0
  local blk; blk="$(awk "/<!-- BEGIN $marker/,/<!-- END $marker/" "$src")"
  [ -n "$blk" ] && printf '\n\n%s\n' "$blk" >> "$file" && log "appended '$marker' → ${file#$TARGET/}"
}
for f in "$TARGET/.claude/CLAUDE.md" "$TARGET/.codex/CODEX.md" "$TARGET/.codex/AGENTS.md" "$TARGET/CLAUDE.md"; do
  ensure_block "$f" "device-sync-and-handoff convention" "$SRC/.claude/CLAUDE.md"
done

log "DONE (copy-only — run sync-flush.sh to commit+push component paths). device.local.md untouched."
