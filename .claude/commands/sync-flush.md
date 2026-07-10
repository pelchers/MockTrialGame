---
name: sync-flush
description: Commit + push the propagated component paths in every SYNC-REPOS target (incl. the Template `All` registry) so cross-repo component work is never stranded before a device switch. Commits ONLY the component paths (never a target's unrelated app files). Supports --dry-run.
invocable: true
---

# /sync-flush — flush stranded cross-repo component changes

Part of the component-sync module. Walks every `SYNC-REPOS.md` target's git root and, for each with
un-synced **component** changes, commits + pushes **only the component paths** on the target's current
branch. Safe: a target's own hundreds of unrelated in-progress files are left untouched.

## Instructions for Claude

1. **Preview first:**
   ```bash
   bash .claude/hooks/scripts/sync-flush.sh --dry-run
   ```
   Show the user which targets are DIRTY and which component paths would be committed.
2. **Flush (commit + push):**
   ```bash
   bash .claude/hooks/scripts/sync-flush.sh
   ```
   Reports per target: committed+pushed / clean / push-failed. Never force-pushes; never `add -A`.
3. **Mark flushed** in `component-sync-log.md`.

## Notes
- Auto-fired too: the idle monitor (after `IDLE_HANDOFF_HOURS`) and SessionEnd both flush; this command
  is the on-demand path. `SYNC_FLUSH=off` disables.
- The Template `All` repo's git root is its parent (`Claude+Codex Agent+Skill Sync`) — the flush handles
  the `All/` path prefix automatically.
- Full model: `.docs/runbooks/development/device-sync-and-handoff-protocol.md`.

$ARGUMENTS
