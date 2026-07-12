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
2. **Determine the MERGE MODE** from the user's request / `$ARGUMENTS` (default `both`):
   | Mode | User phrasing (examples) | Effect on **app code / state** | Effect on **logs** |
   |---|---|---|---|
   | **`both`** (default) | "merge both", "get latest from both", (no mode given) | integrate both devices' most-recent work (disjoint union; conflicts surfaced) | **union both** (0 loss) |
   | **`theirs`** | "did work on the laptop — pull full from there, ignore the work here" | adopt the **other device's** code/state as the base | **union both** (0 loss) |
   | **`ours`** | "ignore the laptop, keep the home work" | keep **this device's** code/state; don't adopt their code | **union both** (0 loss) |
   > **Invariant:** the **logs ALWAYS union both devices' entries (0 chat-history loss)** in every mode.
   > The mode only changes which *app code/state* is adopted. In `theirs`/`ours` you still read the other
   > device's handoff so you understand what they did — you just don't take their *code*.
3. **Fetch all lanes:** `git fetch origin`.
4. **Report divergence** vs `main` and the other device's lane:
   ```bash
   git rev-list --left-right --count origin/main...HEAD
   git rev-list --left-right --count origin/main...origin/<other-device>-Work
   ```
5. **Determine the most-forward-appropriate state** — read `.adr/current/development-progress.md`,
   `.docs/planning/*`, the newest `HANDOFF.md` entry, and the diverging commits. Normally the latest
   handoff is on `origin/main`. If the two device lanes advanced different ADR areas → integrate BOTH.
6. **Adopt CODE per the chosen mode into this device's working branch:**
   - **`theirs`:** take the other device's tree for app code — `git merge -X theirs origin/main` (or
     `origin/<other>-Work`), or reset the app paths to their version. Never delete a lane; if unsure, ask.
   - **`ours`:** keep local — `git merge -X ours origin/main` (records the merge, keeps our content), or
     skip the code merge entirely and only integrate logs (step 7).
   - **`both`** (default) — resolve as below:
   - **Fresh clone / no local `<Device>-Work` yet** (on `main` after cloning) → create the lane first:
     `git checkout -B <Device>-Work origin/<Device>-Work` (if the remote lane exists) else
     `git checkout -b <Device>-Work` from `main`. (So `/winddown`'s device-branch push can't fail.)
   - Behind `main` only → `git merge --ff-only origin/main`.
   - Local unpushed work + `main` moved → `git pull --rebase origin main`.
   - Other lane ahead of `main` (unreleased) → surface + integrate per ADR/HANDOFF, or ask the user.
   - Genuinely DIVERGED → **STOP and reconcile with the user.** Never force-push, never discard.
   - **Disjoint areas** (e.g. component work here + app work on the other device) → the merge is a **clean
     union**; both survive. Same-file overlap → a normal conflict is surfaced for you to reconcile (nothing
     is dropped). See system docs → "Both devices advanced — the reconciliation happy path."
   - **Identity is safe across the merge:** the merge may briefly adopt the other device's `device.local.md`
     (`merge=ours` only fires on a true conflict), but the installed `post-merge` hook runs
     `device-identity-heal.sh` immediately, restoring this clone's device from `.git/device-identity` —
     *before* any commit. If you see a `[device-identity] self-heal:` line, that's the safety net working.
7. **Integrate the LOGS — ALWAYS, in every mode (0 chat-history loss):**
   ```bash
   bash .claude/hooks/scripts/branched-logs.sh absorb-all <other-device> origin/main
   bash .claude/hooks/scripts/branched-logs.sh merge-all
   ```
   This pulls the other device's chat-history / HANDOFF / sync-log entries into their device segment and
   regenerates the merged views — **unioned, deduped, chronological**. It runs even in `theirs`/`ours`
   mode, so no entry is ever lost. (`merge-all` also auto-fires from the `post-merge` hook after any pull.)
   The merged views are `merge=ours` (derived, git keeps ours) so the pull never conflicts on them; the
   per-device segments carry the real data. See system docs → `tests-explained.md` + branched-logs.
8. **Read the newest `HANDOFF.md` entry** (now unioned across both devices) + skim the status board;
   **summarize in chat**: what the last agent on EACH device did, where they stopped, the next actions,
   and any blockers/gotchas. This is the "I'm back — what's the state?" ingest.
9. **Confirm** the resolved state (`git status`, sync vs `main`) and state that you're ready to continue.

## Notes
- Full protocol + branch model: `.docs/runbooks/development/device-sync-and-handoff-protocol.md`.
- The SessionStart banner already flags when a device/`main` is ahead — `/pickup` acts on it.
- Pair with `/winddown` at the end of work.

$ARGUMENTS
