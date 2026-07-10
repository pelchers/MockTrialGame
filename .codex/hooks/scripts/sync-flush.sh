#!/usr/bin/env bash
# sync-flush.sh — the anti-stranding flush of the component-sync module.
#
# When reusable components are propagated from THIS repo to the SYNC-REPOS targets
# (incl. the Template `All` registry), those targets are changed FROM OUTSIDE and end
# up dirty+unpushed. This flush commits + pushes ONLY the component paths (never the
# whole tree — targets often carry hundreds of unrelated in-progress files) on each
# target's CURRENT branch, so component work is never stranded before a device switch.
# Idempotent (no-op when a target has no component changes). SAFE: it touches only the
# known component pathspec, so a target's own uncommitted app work is left alone.
#
#   Usage:  sync-flush.sh [--dry-run]     (default DOES commit+push; --dry-run only reports)
#   Called by: /sync-flush, the SessionEnd hook, and the idle-handoff monitor.
#   Config: SYNC_FLUSH=off disables · SYNC_FLUSH_MSG overrides the commit message.
set -uo pipefail
DRY=0; [ "${1:-}" = "--dry-run" ] && DRY=1
[ "${SYNC_FLUSH:-on}" = "off" ] && { echo "[sync-flush] disabled (SYNC_FLUSH=off)"; exit 0; }
MSG="${SYNC_FLUSH_MSG:-chore(component-sync): sync reusable components from CarAggregator [auto]}"

# --- SYNC-REPOS target paths (this machine). Keep in step with SYNC-REPOS.md. ---
TARGETS=(
  "C:/Template/Claude+Codex Agent+Skill Sync/All"
  "C:/Dispatch/Template/All"
  "C:/Game/MockTrial.game"
  "C:/App/AppDock"
  "C:/App/PortfolioV1"
  "C:/Ideas/IDEA-MANAGEMENT"
  "C:/Extensions/Markdown Mermaid Editor"
  "C:/coding/apps/campus"
  "C:/App/Portfolios/Restaurant-MarTech"
  "C:/App/Portfolios/Brand-MarTech"
  "C:/Tool/OutreachAI"
  "C:/Tool/Clients/CC/DualLeads"
  "C:/App/HealthApps"
  "C:/App/HealthApps/LivBeyond"
)

# --- ONLY these paths are ever committed (the reusable-component surface) --------
PATHS=(
  ".claude/skills/device-sync-protocol" ".codex/skills/device-sync-protocol"
  ".claude/skills/device-branch-routing" ".codex/skills/device-branch-routing"
  ".claude/agents/device-sync-agent" ".codex/agents/device-sync-agent"
  ".claude/commands/pickup.md" ".claude/commands/winddown.md" ".claude/commands/device.md"
  ".claude/commands/sync-flush.md" ".claude/commands/sync-component.md"
  ".codex/commands/pickup.md" ".codex/commands/winddown.md" ".codex/commands/device.md"
  ".codex/commands/sync-flush.md" ".codex/commands/sync-component.md"
  ".claude/hooks/scripts/device-sync-check.sh" ".codex/hooks/scripts/device-sync-check.sh"
  ".claude/hooks/scripts/idle-handoff-monitor.sh" ".codex/hooks/scripts/idle-handoff-monitor.sh"
  ".claude/hooks/scripts/register-idle-handoff.ps1" ".codex/hooks/scripts/register-idle-handoff.ps1"
  ".claude/hooks/scripts/sync-flush.sh" ".codex/hooks/scripts/sync-flush.sh"
  ".claude/hooks/scripts/sync-component.sh" ".codex/hooks/scripts/sync-component.sh"
  ".claude/hooks/scripts/component-change-detector.sh" ".codex/hooks/scripts/component-change-detector.sh"
  ".claude/hooks/scripts/session-winddown.sh" ".codex/hooks/scripts/session-winddown.sh"
  ".codex/system_docs/device_sync_protocol" ".codex/system_docs/device_branch_routing"
  ".docs/runbooks/development/device-sync-and-handoff-protocol.md"
  ".docs/runbooks/development/device-branch-convention.md"
  ".docs/runbooks/development/multi-device-and-agent-contract.md"
  "multi-device-and-agent-contract.md" "device.local.example.md"
  "SYNC-REPOS.md" "sync-repos-asus-laptop.md" "component-sync-log.md"
  ".other-devices/components/device-sync-protocol"
  ".other-devices/components/device-branch-routing"
  ".other-devices/components/multi-agent-collaboration"
  ".other-devices/components/chat-history-convention"
  "HANDOFF.md"
  ".claude/CLAUDE.md" ".codex/CODEX.md" ".codex/AGENTS.md" "CLAUDE.md"
)

declare -A seen_root
flushed=0; clean=0; skipped=0
echo "[sync-flush] mode=$([ $DRY = 1 ] && echo DRY-RUN || echo COMMIT+PUSH) — scanning ${#TARGETS[@]} targets (component paths ONLY)"
for t in "${TARGETS[@]}"; do
  [ -d "$t" ] || { echo "  MISSING  $t"; skipped=$((skipped+1)); continue; }
  root="$(git -C "$t" rev-parse --show-toplevel 2>/dev/null || true)"
  [ -z "$root" ] && { echo "  NO-GIT   $t (files copied but not versioned — can't push)"; skipped=$((skipped+1)); continue; }
  prefix="$(git -C "$t" rev-parse --show-prefix 2>/dev/null || echo '')"   # e.g. "All/" when target != git root
  key="$root|$prefix"
  [ -n "${seen_root[$key]:-}" ] && continue
  seen_root[$key]=1
  branch="$(git -C "$root" symbolic-ref --short -q HEAD 2>/dev/null || echo '(detached)')"

  # collect only the component paths that actually changed
  changed=()
  for p in "${PATHS[@]}"; do
    st="$(git -C "$root" status --porcelain -- "${prefix}${p}" 2>/dev/null)"
    [ -n "$st" ] && changed+=("${prefix}${p}")
  done
  if [ ${#changed[@]} -eq 0 ]; then echo "  clean    [$branch] $t"; clean=$((clean+1)); continue; fi
  echo "  DIRTY    [$branch] $t — ${#changed[@]} component path(s):"
  printf '             %s\n' "${changed[@]}" | head -10
  [ ${#changed[@]} -gt 10 ] && echo "             … (+$((${#changed[@]}-10)) more)"
  if [ "$DRY" = 1 ]; then continue; fi
  if git -C "$root" add -- "${changed[@]}" 2>/dev/null \
     && git -C "$root" commit -q -m "$MSG" -- "${changed[@]}" 2>/dev/null; then
    if git -C "$root" push origin "$branch" 2>/dev/null; then
      echo "             ✓ committed + pushed (component paths only) on $branch"
    else
      echo "             ⚠ committed but PUSH FAILED (offline/no upstream/non-ff) — not force-pushing"
    fi
    flushed=$((flushed+1))
  else
    echo "             ⚠ commit failed — skipped (target left as-is)"; skipped=$((skipped+1))
  fi
done
echo "[sync-flush] done — flushed=$flushed clean=$clean skipped=$skipped $([ $DRY = 1 ] && echo '(dry-run: nothing changed)')"
exit 0
