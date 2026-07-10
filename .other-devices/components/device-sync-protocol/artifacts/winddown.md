---
name: winddown
description: End-of-work ritual — commit everything, append a HANDOFF.md entry, and push this device's working branch AND main (kept in sync) so the other machine's agent can pick up cleanly.
invocable: true
---

# /winddown — leave a clean handoff

Runs the WIND-DOWN half of the Device Sync & Handoff Protocol. Uses the `device-sync-protocol` skill.

## Instructions for Claude

When `/winddown` is invoked:

1. **Resolve this device's working branch** (via `device-branch-routing`): home→`Home-Work`, asus→`Asus-Work`.
2. **Commit everything** to the working branch: `git add -A && git commit -m "..."` (verify `git status` clean after).
3. **Prepend a `HANDOFF.md` entry** (newest on top, per the template in `HANDOFF.md`):
   `## <date> · <device> (<hostname>) · claude · branch <X>-Work @ <sha>` +
   **Synced from · What changed · Where I stopped/state · Next actions · Blocked on · Gotchas**.
   Commit the HANDOFF update.
4. **Update** `.chat-history/user-messages.md` + `.adr/current/development-progress.md` if not already current.
5. **Push the device branch AND sync `main`:**
   ```bash
   git push origin <Device>-Work
   git push origin <Device>-Work:main     # fast-forward main to this handoff (stable/prod)
   ```
   If `<Device>-Work:main` is NOT a fast-forward → run `/pickup` first (integrate `main`), then push.
   **Never force-push `main`.**
6. **(Optional) savepoint** if this is a milestone: `/savepoint <name>` (from `main`).
7. **Verify + report:** `git status` clean; `git rev-list --left-right --count origin/main...HEAD` = `0 0`
   (device branch == `main` == this handoff). Tell the user the next machine can `/pickup` to resume.

## Notes
- `main` is the stable/savepoint/prod branch — only fast-forward it to a completed, committed handoff.
- Full protocol: `.docs/runbooks/development/device-sync-and-handoff-protocol.md`. Pair with `/pickup`.

$ARGUMENTS
