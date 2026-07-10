---
name: sync-component
description: Propagate a reusable component (device-sync-protocol, device-branch-routing, etc.) from this repo to all SYNC-REPOS targets (incl. the Template `All` registry) — copy files, wire the SessionStart hook, append convention blocks idempotently, seed HANDOFF, and log. Copy-only; run /sync-flush after to commit+push.
invocable: true
---

# /sync-component — propagate a component to all sync targets

Part of the component-sync module. Copies the reusable-component surface from this repo (source of
truth) into every `SYNC-REPOS.md` target, WIRES the SessionStart hook into each target's
`settings.json`, appends convention blocks idempotently, seeds `HANDOFF.md` if missing, and appends a
row to `component-sync-log.md`. **Never commits** (that's `/sync-flush`) and **never touches** a
target's own `device.local.md` or project app files.

## Instructions for Claude

1. **Run the propagation** for each target (the script owns the file list + hook-wiring + logging):
   ```bash
   for t in "C:/Template/Claude+Codex Agent+Skill Sync/All" "C:/Dispatch/Template/All" \
            "C:/Game/MockTrial.game" "C:/App/AppDock" "C:/App/PortfolioV1" "C:/Ideas/IDEA-MANAGEMENT" \
            "C:/Extensions/Markdown Mermaid Editor" "C:/coding/apps/campus" \
            "C:/App/Portfolios/Restaurant-MarTech" "C:/App/Portfolios/Brand-MarTech" \
            "C:/Tool/OutreachAI" "C:/Tool/Clients/CC/DualLeads" "C:/App/HealthApps" "C:/App/HealthApps/LivBeyond"; do
     bash .claude/hooks/scripts/sync-component.sh "$t" "$(basename "$t")"
   done
   ```
   (The target list mirrors `SYNC-REPOS.md`. On the laptop, add `sync-repos-asus-laptop.md` targets.)
2. **Append/refresh a row** in `component-sync-log.md` describing what was propagated + the targets.
3. **Then run `/sync-flush --dry-run`** to preview, and `/sync-flush` to commit+push the component paths.

## Notes
- Source of truth = whichever repo you run this from; it copies OUT to the targets.
- Full model: `.docs/runbooks/development/device-sync-and-handoff-protocol.md` + `multi-device-and-agent-contract.md`.
- Auto-detection of edited component files: PostToolUse `component-change-detector.sh` → `.git/component-sync-pending`.

$ARGUMENTS
