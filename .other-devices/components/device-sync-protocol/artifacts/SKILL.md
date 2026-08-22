---
name: device-sync-protocol
description: Cross-device pickup + wind-down rituals for multi-machine work (home-desktop ⇄ asus-laptop). Use at the START of work (get synced to the most-forward version before proceeding) and at the END of work (leave a clean handoff on the device branch + main). Trigger on "pickup", "wind down", "handoff", "sync up", "start/finish work on this device", a SessionStart banner reporting another device is ahead, OR natural-language cues that the user just switched machines — e.g. "I'm back", "back from my other laptop/desktop", "what's the state of things", "catch me up", "where did we leave off", "resume".
---

# Device Sync & Handoff Protocol

One repo, multiple machines. Each device works on its own **working branch** (`Home-Work`,
`Asus-Work`); **`main` is the handoff + savepoint + stable/prod branch**. This skill is the ritual an
agent runs to (1) get onto the most-forward version before working, and (2) hand off cleanly after.

> Companion to `device-branch-routing` (which resolves *which* working branch this device uses). Full
> reference: `.docs/runbooks/development/device-sync-and-handoff-protocol.md`. Living log: `HANDOFF.md`.

## Branch model (read first)
- `Home-Work` = home-desktop default lane · `Asus-Work` = asus-laptop default lane (from `device.local.md`).
- `main` = handoff + savepoint + stable + deployment/prod. Updated ONLY at a handoff (wind-down pushes
  device branch **and** `main` in sync) and at savepoints. **The latest handoff always lives on `main`.**
- **Feature axis (contract §1.5):** routine work happens on the **`f<N>-<slug>@luke` feature branch**
  named in `device.local.md` §5 (`ACTIVE_FEATURE_BRANCH`) — the durable carry-forward tip for that
  feature. The device lane is fast-forwarded to that feature tip at wind-down; it is the savepoint /
  handoff pointer, not the feature's source of truth. The canonical **Feature-Lane Registry** (feature ·
  branch · base · status · **last advanced by `device@sha`**) lives in
  `.adr/current/development-progress.md`. Device identity is **metadata, not a fixed owner**.
- **Convergence (no fixed owner):** features forward-merge at the integration tip per
  `lane-forward-integration.md`; whichever device performs a given merge/promotion **records it** in the
  registry. `pull --rebase` before pushing keeps single-branch pushes fast-forward-only, so a shared
  feature branch never clobbers across sessions. (Opt-in escape hatch for true concurrent co-dev:
  device-suffixed `f<N>-<slug>@luke__<device>` branches that merge into the canonical.)

---

## PICKUP — run at the start of work (`/pickup`)

1. **Fetch all lanes:** `git fetch origin` (main + both device branches + savepoints).
2. **Assess divergence:**
   ```bash
   git rev-list --left-right --count origin/main...HEAD          # behind<TAB>ahead vs main
   git rev-list --left-right --count origin/main...origin/Asus-Work   # (other lane vs main)
   ```
3. **Determine the most-forward-APPROPRIATE state** — not by raw commit count. Read
   `.adr/current/development-progress.md` + `.docs/planning/*` + the newest `HANDOFF.md` entry + the
   diverging commits, and judge which lane advanced the project's plan furthest. Normally that is the
   latest handoff on `origin/main`. If the two device branches advanced **different** ADR areas →
   integrate **both** (never discard a lane's work).
4. **Adopt it into your device branch** (stay on your own lane, updated):
   - **Fresh clone / no local working lane** (you're on `main` with no `<Device>-Work` yet — common
     right after cloning on a new machine): create it FIRST — `git checkout -B <Device>-Work origin/<Device>-Work`
     if the remote lane exists, else `git checkout -b <Device>-Work` from the current `main`. Wind-down's
     `git push origin <Device>-Work` needs the lane to exist.
   - Behind `main` only, no local work → `git merge --ff-only origin/main`.
   - Local unpushed work + `main` moved → `git pull --rebase origin main`.
   - Other device branch ahead of `main` (unreleased) → surface it; integrate per ADR/HANDOFF or ask
     the user to promote it. **Never force-push. Never discard a lane's commits.**
   - Genuinely DIVERGED (both lanes have unique commits) → **STOP, report, reconcile with the user.**
5. **Merge modes (from the user's prompt; default `both`):** `both` = integrate both devices' most-recent
   work; `theirs` = adopt the other device's app code ("pull full from there, ignore the work here");
   `ours` = keep this device's code. **In EVERY mode the logs still union (0 chat-history loss)** and you
   still read the other device's handoff — the mode only changes which app *code* is adopted.
6. **Integrate the LOGS (always, every mode):**
   ```bash
   bash .claude/hooks/scripts/branched-logs.sh absorb-all <other-device> origin/main
   bash .claude/hooks/scripts/branched-logs.sh merge-all
   ```
   Pulls the other device's chat-history + HANDOFF entries into their segment and regenerates the merged
   views — unioned, deduped, chronological (0 loss). See `branched-logs` + `.codex/system_docs/branched_logs/`.
7. **Read the newest `HANDOFF.md` entry** (now unioned across both devices) + skim the status board,
   **including the Feature-Lane Registry** → rebuild understanding of where EACH device left off. Confirm
   which `f<N>` branch this device drives (`device.local.md` §5). If it isn't checked out, `git checkout`
   it; then `git pull --rebase` so your next push is fast-forward-only.
8. **Proceed** — continue where the other agent left off.

## WIND-DOWN — run at the end of work (`/winddown`)

1. **Commit everything** to your **active feature branch** (`device.local.md` §5 `ACTIVE_FEATURE_BRANCH`;
   falls back to the device lane if none): `git add -A && git commit -m "..."`.
2. **Prepend a `HANDOFF.md` entry** (template in `HANDOFF.md`; newest on top): synced-from · what
   changed · where I stopped/state · next actions · blocked-on · gotchas · **feature-id · feature-branch ·
   base · last-advanced-by `device@sha`** · branch@sha. Commit it.
3. **Pull-rebase the feature branch; push it; fast-forward the device lane to it; sync `main`:**
   ```bash
   git pull --rebase origin <ACTIVE_FEATURE_BRANCH>     # take the other device's latest FIRST (keeps push ff)
   git push origin <ACTIVE_FEATURE_BRANCH>              # the feature work tip (ALWAYS)
   git branch -f <Device>-Work <ACTIVE_FEATURE_BRANCH>  # device lane = savepoint pointer to the tip
   git push origin <Device>-Work
   git push origin <Device>-Work:main                   # ff main to this handoff (stable/prod)
   ```
   `main` is ff'd only when this feature tip is a superset of `main` (the usual case at a convergence /
   promotion point). If `<Device>-Work:main` is NOT a fast-forward (main moved via another device),
   `/pickup` first (forward-merge at the integration tip), then push. **Never force-push.** No fixed
   owner — whoever is at the convergence point does the merge + records it in the registry.
4. **(Optional) savepoint** at a milestone: `/savepoint <name>` (from `main`).
5. **Verify:** `git status` clean; `git rev-list --left-right --count origin/main...HEAD` = `0 0`.
6. Update `.chat-history/user-messages.md` + the status board — **including this feature's row in the
   Feature-Lane Registry** (last advanced by `device@sha` · date, status).

---

## IDLE AUTO-HANDOFF (safety net for "I walked away and switched machines")

A background monitor (`.claude/hooks/scripts/idle-handoff-monitor.sh`, scheduled every ~20 min via
`register-idle-handoff.ps1` — a Windows Scheduled Task, NOT a Claude event hook) handles the case
where the user steps away WITHOUT running `/winddown`:

- After **`IDLE_HANDOFF_HOURS`** (default 4) of **no source-file edits**, if there is un-handed-off
  work it: commits it → **prepends an AUTO-HANDOFF `HANDOFF.md` entry** → **pushes the DEVICE BRANCH**.
- It **NEVER syncs `main`** — `main` is stable/prod, so auto-pushing possibly-mid-work code there is
  unsafe. Syncing `main` stays a deliberate `/winddown`.
- Single-fires per work-batch (`.git/idle-handoff-state`), never force-pushes, resolves the lane from
  `device.local.md`, and notes if `.chat-history` looks stale. `IDLE_HANDOFF=off` disables it;
  `IDLE_HANDOFF_AGENT=1` uses the subscription CLI for a richer summary.

**So the user can just switch machines and say "I'm back / what's the state of things"** — the new
machine's agent runs PICKUP, pulls the (auto-)pushed device branch, reads the newest `HANDOFF.md`
entry, and resumes. Nothing is lost even without a manual wind-down.

---

## Guardrails
- **Never force-push** any shared branch; integrate with rebase/merge.
- **Never discard** a device lane's commits — when unsure, STOP and ask.
- `main` is stable/prod: only fast-forward it to a completed, committed handoff (or a savepoint).
- If `device.local.md` is missing/ambiguous, resolve via `device-branch-routing` first (never guess a target).

## Related
- SessionStart banner: `.claude/hooks/scripts/device-sync-check.sh` (reports if a device/`main` is ahead + HANDOFF freshness).
- Commands: `/pickup`, `/winddown`. Agent: `device-sync-agent`. Toggle: `/device` + `device-branch-routing`.
- Portable package: `.other-devices/components/device-sync-protocol/`.
