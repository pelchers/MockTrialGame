---
name: pickup
description: Start-of-work ritual — fetch all device lanes, adopt the most-forward handoff into this device's working branch, read HANDOFF.md, and rebuild understanding before proceeding.
invocable: true
---

# /pickup — get synced to the most-forward version

Runs the PICKUP half of the Device Sync & Handoff Protocol so this machine's agent starts on the
latest cross-device work. Uses the `device-sync-protocol` skill.

## Instructions for Claude

When `/pickup` is invoked:

1. **Resolve this device's working branch** (via `device-branch-routing` / `device.local.md`):
   home-desktop→`Home-Work`, asus-laptop→`Asus-Work`.
2. **Fetch all lanes:** `git fetch origin`.
3. **Report divergence** vs `main` and the other device's lane:
   ```bash
   git rev-list --left-right --count origin/main...HEAD
   git rev-list --left-right --count origin/main...origin/<other-device>-Work
   ```
4. **Determine the most-forward-appropriate state** — read `.adr/current/development-progress.md`,
   `.docs/planning/*`, the newest `HANDOFF.md` entry, and the diverging commits. Normally the latest
   handoff is on `origin/main`. If the two device lanes advanced different ADR areas → integrate BOTH.
5. **Adopt it into this device's working branch:**
   - **Fresh clone / no local `<Device>-Work` yet** (on `main` after cloning) → create the lane first:
     `git checkout -B <Device>-Work origin/<Device>-Work` (if the remote lane exists) else
     `git checkout -b <Device>-Work` from `main`. (So `/winddown`'s device-branch push can't fail.)
   - Behind `main` only → `git merge --ff-only origin/main`.
   - Local unpushed work + `main` moved → `git pull --rebase origin main`.
   - Other lane ahead of `main` (unreleased) → surface + integrate per ADR/HANDOFF, or ask the user.
   - Genuinely DIVERGED → **STOP and reconcile with the user.** Never force-push, never discard.
6. **Read the newest `HANDOFF.md` entry** + skim the status board; **summarize in chat**: what the
   last agent did, where they stopped, the next actions, and any blockers/gotchas.
7. **Confirm** the resolved state (`git status`, sync vs `main`) and state that you're ready to continue.

## Notes
- Full protocol + branch model: `.docs/runbooks/development/device-sync-and-handoff-protocol.md`.
- The SessionStart banner already flags when a device/`main` is ahead — `/pickup` acts on it.
- Pair with `/winddown` at the end of work.

$ARGUMENTS
