# Usage Guide: Device Sync & Handoff Protocol

## Quick Start

At the **start** of work on any machine:
```
/pickup
```
Fetches every lane, adopts the most-forward-appropriate handoff into this device's working branch,
reads the newest `HANDOFF.md` entry, and rebuilds understanding before you do anything.

At the **end** of work:
```
/winddown
```
Commits everything to your working lane, prepends a `HANDOFF.md` entry, and pushes your device branch
**and** `main` (kept in sync) so the next machine can resume cold.

## Reading the SessionStart banner

The `device-sync-check.sh` hook runs automatically at every session start and prints a banner. What
each line means and what to do:

| Banner line | Meaning | Do |
|---|---|---|
| `[device-sync] device=… \| branch=… \| default-target=… \| release=…` | resolved device + your working lane + release method | informational |
| `SYNCED with main` | your device branch == `main` (latest handoff) | proceed (still skim `HANDOFF.md`) |
| `AHEAD of main by N` | you have local work not yet handed off | proceed; `/winddown` will sync `main` |
| `BEHIND main by N (pull/rebase before working)` | another device handed off; you're behind | run `/pickup` before working |
| `DIVERGED (ahead A / behind B)` | both lanes moved | reconcile with the user before working |
| `⚠ origin/main ahead of your branch by N — run /pickup before working.` | the latest handoff is ahead of you | run `/pickup` |
| `⚠ Asus-Work has N commit(s) not on main (unreleased)` | the other lane has work not yet on `main` | `/pickup` will surface it |
| `HANDOFF: <date> · <device> (<host>) · <agent> · branch <X>-Work` | who wrote the last handoff + when | read that `HANDOFF.md` entry |
| `main = handoff/savepoint/stable/prod; commit on your working lane, sync main at /winddown.` | branch-model reminder | commit to your lane, not `main` |
| `[!] hostname pin '<p>' != this host '<h>'` | `device.local.md` may be copied from another machine | fix the device toggle (`/device`) |

> **Rule of thumb:** any `⚠` line or a `BEHIND` / `DIVERGED` state → run **`/pickup`** before working.

## Detailed Usage

### `/pickup` — what it does, step by step
1. Resolves your working branch via `device-branch-routing` (home→`Home-Work`, asus→`Asus-Work`).
2. `git fetch origin`, then reports divergence vs `main` and the other device's lane:
   ```bash
   git rev-list --left-right --count origin/main...HEAD
   git rev-list --left-right --count origin/main...origin/<other-device>-Work
   ```
3. Determines the most-forward-**appropriate** state from the ADR status board + planning docs + the
   newest `HANDOFF.md` entry (not raw commit count).
4. Adopts it into your working branch: `--ff-only` (behind only) / `pull --rebase` (local work + main
   moved) / surface-and-ask (other lane ahead) / STOP (truly diverged).
5. Summarizes the prior agent's handoff in chat and confirms it's ready to continue.

### `/winddown` — what it does, step by step
1. Commits everything to your working lane (`git add -A && git commit`).
2. Prepends a `HANDOFF.md` entry (see template below). Commits it.
3. Updates `.chat-history/user-messages.md` + the status board if not current.
4. Pushes the device branch and syncs `main`:
   ```bash
   git push origin <Device>-Work
   git push origin <Device>-Work:main     # fast-forward only
   ```
   If `<Device>-Work:main` is **not** a fast-forward → run `/pickup` first, then push. Never force-push `main`.
5. Optional `/savepoint <name>` at a milestone (from `main`). Verifies `origin/main...HEAD` = `0 0`.

### HANDOFF.md entry format (newest on top)
```text
## <YYYY-MM-DD HH:MM TZ> · <device> (<hostname>) · <agent> · branch <X>-Work @ <short-sha>
**Synced from:** <what /pickup adopted this session, or "fresh clone">
**What changed:** <the work done>
**Where I stopped / state:** <current app + DB + branch state>
**Next actions:** <ordered, concrete>
**Blocked on (needs user/external):** <keysets, proxy creds, decisions>
**Gotchas:** <traps the next agent must know>
```

### The device-sync-agent
For an autonomous run, the `device-sync-agent` executes either ritual end-to-end (it loads the
`device-sync-protocol`, `device-branch-routing`, `managing-git-workflows`, and `chat-history-convention`
skills). Use it when you want the pickup/wind-down done without step-by-step prompting.

## Worked example: component work here + app work on the other device

The exact case you hit when returning to a repo after doing unrelated work on each machine. Say
🖥 home did heavy work on a **component** (`Home-Work`), and 💻 the laptop did **app features + savepoint
branches** and already handed off to `main`.

**On home, at session start** the banner shows:
```
[device-sync] device=home-desktop | branch=Home-Work | default-target=Home-Work | release=direct-push
[device-sync] DIVERGED (ahead 3 / behind 5)          # home has 3 component commits; main has 5 app commits
[device-sync] ⚠ origin/main ahead of your branch by 5 — run /pickup before working.
```
Run **`/pickup`**. It merges `origin/main` into `Home-Work`:
- Disjoint files (component vs app) → **clean union**: home keeps its 3 component commits *and* gains the
  laptop's 5 app commits. Same-file overlap → conflict is surfaced for you to reconcile (never dropped).
- `HANDOFF.md` union-merges both devices' entries; `device.local.md` is **auto-healed** back to
  `home-desktop` by the `post-merge` hook the instant the merge lands (see below).
- The laptop's **savepoint branches** are now fetched locally (`git branch -a` shows them) — check any out
  to inspect a "good app state."

Finish, then **`/winddown`**: home pushes `Home-Work` and fast-forwards `main`. `main` now has **both**
the component and the app work. Next time the laptop runs `/pickup`, it pulls `main` and gains the
component work — full parity, zero loss.

### Why your device identity survives the merge
On the `/pickup` merge, git briefly adopts the laptop's `device.local.md` (merge=ours only fires on a true
conflict). The installed **`post-merge` hook runs `device-identity-heal.sh` immediately**, restoring
`device.local.md` to `home-desktop` from `.git/device-identity` — *before* your `/winddown` commit. So you
never push the wrong device onto your lane or `main`. If you ever see:
```
[device-identity] self-heal: device.local.md was 'asus-laptop' but this clone is 'home-desktop' … restored to 'home-desktop'.
```
that is the safety net working as designed — no action needed.

## Troubleshooting

**`<Device>-Work:main` push rejected (not a fast-forward)** — `main` moved via another device since your
last pull. Run `/pickup` to integrate `origin/main`, then push again. Never `--force`.

**Lanes DIVERGED** — both your lane and another have unique commits `main` lacks. STOP; reconcile with
the user (rebase/merge/cherry-pick). The protocol never discards a lane's commits.

**`device.local.md` shows the *other* device after a `/pickup`** — expected transient: the merge adopted
their tracked copy. The `post-merge` hook + `device-identity-heal.sh` restore it from `.git/device-identity`
automatically (you'll see a `[device-identity] self-heal:` line). If it did *not* restore, the heal script
or the `post-merge` hook is missing in this clone — re-run the `SessionStart` hook
(`bash .claude/hooks/scripts/device-sync-check.sh`) to reinstall both, or run `/device` to re-pin manually.
On a brand-new clone whose `device.local.md` came from the other device, the hook won't *guess* — set your
device with `/device` once and it captures `.git/device-identity` for all future heals.

**Banner says a device is ahead but `/pickup` finds nothing** — the bounded fetch may have been offline
(look for a `(local ref, may be stale)` suffix). Re-run with a connection, or `git fetch origin` manually.

**No `HANDOFF.md` line in the banner** — the file is empty/missing or lowercase. Ensure the canonical
uppercase `HANDOFF.md` exists at the repo root (Windows/macOS are case-insensitive — no `handoff.md` twin).

**`device.local.md` missing/ambiguous** — resolve the device first with `/device` (device-branch-routing);
never guess a push target.
