# Device Sync & Handoff Protocol System

## Overview
Keeps multi-device development (🖥 home-desktop ⇄ 💻 asus-laptop) coherent by wrapping two rituals
around every work session: **`/pickup`** at the start (get onto the most-forward-*appropriate* version
before doing anything) and **`/winddown`** at the end (leave a clean, machine-readable handoff on the
device branch **and** `main`). An append-only **`HANDOFF.md`** log carries "where we left off + what's
next" between machines, and an extended `SessionStart` hook flags when another device/`main` is ahead
so every conversation knows whether to `/pickup`.

Companion to **`device-branch-routing`**: that component resolves *which* working branch this device
commits to; this one layers the cross-device **sync + handoff** on top.

## Components
| Component | Path |
|---|---|
| **Handoff log (append-only, per-device)** | `HANDOFF.md` (repo root, tracked) |
| **Skill** | `.claude/skills/device-sync-protocol/SKILL.md` · `.codex/skills/device-sync-protocol/SKILL.md` |
| **Command** `/pickup` | `.claude/commands/pickup.md` · `.codex/commands/pickup.md` |
| **Command** `/winddown` | `.claude/commands/winddown.md` · `.codex/commands/winddown.md` |
| **Agent** `device-sync-agent` | `.claude/agents/device-sync-agent/AGENT.md` · `.codex/agents/device-sync-agent/AGENT.md` |
| **Hook (extended, SessionStart)** | `.claude/hooks/scripts/device-sync-check.sh` · `.codex/hooks/scripts/device-sync-check.sh` |
| **Identity auto-heal** | `.claude/hooks/scripts/device-identity-heal.sh` · `.codex/hooks/scripts/device-identity-heal.sh` — restores `device.local.md` after a cross-device merge; auto-fired by a git `post-merge` hook the SessionStart hook installs (+ `.git/device-identity` per-clone source of truth) |
| **Hook wiring** | `.claude/settings.json` → `hooks.SessionStart` (already wired by `device-branch-routing`) |
| **Convention block** | `CLAUDE.md` · `.claude/CLAUDE.md` · `.codex/CODEX.md` · `.codex/AGENTS.md` (managed `device-sync-and-handoff` block) |
| **Runbook** | `.docs/runbooks/development/device-sync-and-handoff-protocol.md` |
| **System docs** | `.codex/system_docs/device_sync_protocol/README.md` (this) · `USAGE_GUIDE.md` |
| **Portable package** | `.other-devices/components/device-sync-protocol/` (FILE-TREE + MANIFEST + NOTES + artifacts/ + plans/ + snippets/) |
| **Device resolver (companion)** | `device-branch-routing` skill + `device.local.md` (repo root) |

## Branch model (updated 2026-07-06)
| Branch | Role |
|---|---|
| `Home-Work` | 🖥 home-desktop **working lane** — default commit target on the home desktop |
| `Asus-Work` | 💻 asus-laptop **working lane** — default commit target on the Asus laptop |
| `main` | **handoff + savepoint + stable + deployment/prod** — NOT a daily lane; synced at wind-down only |

- Both devices default to their **own working lane** (resolved from `device.local.md` via
  `device-branch-routing`). Home-desktop no longer commits directly to `main` (changed 2026-07-06).
- `main` is updated **only at a handoff** (wind-down pushes the device branch **and** `main` in sync) and
  at **savepoints/milestones** (`/savepoint`). Production deploys from `main`.
- **The most recent handoff always lives on `main`** (and on the device branch that did it) — the next
  machine gets the latest work by pulling `main`.

## The two rituals
### PICKUP (`/pickup` — start of work)
1. Resolve this device's working branch (`device-branch-routing` / `device.local.md`).
2. `git fetch origin` (main + both device lanes + savepoints).
3. Determine the most-forward-**appropriate** state — read `.adr/current/development-progress.md` +
   `.docs/planning/*` + the newest `HANDOFF.md` entry + the diverging commits (NOT raw commit count). If
   two lanes advanced different ADR areas → integrate **both**.
4. Adopt into your working branch: behind `main` only → `git merge --ff-only origin/main`; local work +
   `main` moved → `git pull --rebase origin main`; other lane ahead → surface + integrate/ask; genuinely
   DIVERGED → STOP and reconcile. Never force-push; never discard.
5. Read the newest `HANDOFF.md` entry + skim the status board → rebuild understanding → proceed.

### WIND-DOWN (`/winddown` — end of work)
1. `git add -A && git commit` — nothing uncommitted on your device lane.
2. Prepend a `HANDOFF.md` entry (newest on top): synced-from · what changed · where I stopped/state ·
   next actions · blocked-on · gotchas · branch@sha. Commit it.
3. Push the device branch AND sync `main`:
   `git push origin <Device>-Work` then `git push origin <Device>-Work:main` (fast-forward only).
   If `<Device>-Work:main` is not a fast-forward → `/pickup` first, then push.
4. (Optional) `/savepoint <name>` at a milestone (from `main`).
5. Update `.chat-history/user-messages.md` + the status board. Verify `git status` clean and
   `git rev-list --left-right --count origin/main...HEAD` = `0 0`.

## Both devices advanced — the reconciliation happy path (validated)

The common real case: **this machine did work in one area (e.g. the device-sync component) while the
other machine did unrelated work in another area (e.g. app features + `/savepoint` branches).** Both must
survive; the goal is "get the most recent from **both**." Here is exactly how the protocol produces that.

**Sequence (device B handed off first; device A picks up):**
1. **Device B** (`/winddown`): pushes `B-Work` and fast-forwards `main` to it. `main` now carries B's work.
2. **Device A** (`/pickup`): `git fetch`; sees `origin/main` ahead. Since A has its *own* un-handed-off
   commits, this is a **merge / `git pull --rebase` of `origin/main` into `A-Work`**. Because A and B
   touched **disjoint files**, git produces a **clean union** — A keeps its work *and* gains B's. (If they
   touched the **same lines**, git raises a normal merge conflict → the protocol STOPS and reconciles with
   the user; nothing is ever silently dropped.)
3. **Device A** (`/winddown`): pushes `A-Work` and fast-forwards `main`. `main` now carries **both**.
4. **Device B** (next `/pickup`): pulls `main`, gaining A's work. Both machines are now in full parity.

**Append-only / per-device files reconcile, they don't collide:**
- `HANDOFF.md` is `merge=union` — both devices' handoff entries are kept side by side (no conflict).
- `device.local.md` is `merge=ours` **and** identity-healed (below) — each clone keeps its *own* device.
- **Savepoint branches** made on the other device are ordinary refs — `git fetch` brings them down and the
  lane/`main` sync never touches them; they remain available to check out.

### Device-identity auto-heal (closes the pickup-merge window)
`device.local.md` is per-machine but **tracked**. `.gitattributes merge=ours` only fires on a real
*conflict*; on a `/pickup` that merges the other lane, only *their* copy changed, so git fast-adopts it —
silently flipping this clone's device identity. Left unhealed, a `/winddown` in the **same session** could
push the wrong identity to your lane and `main`. The fix:
- **`device-identity-heal.sh`** keeps a per-clone source of truth at **`.git/device-identity`** (never
  merged — it lives outside the work tree) and restores the section-1 checkbox + `HOSTNAME` pin from it.
  It **captures** identity once on a *trusted* run (hostname pin matches, so a wrong toggle is never
  trusted) and **restores** it whenever a merge clobbers it.
- The `SessionStart` hook runs the heal **and installs a git `post-merge` hook**, so the heal **auto-fires
  the instant a `/pickup` merge or any `git pull` lands** — before any commit can push the wrong identity.
- `main`'s `device.local.md` is a don't-care: every clone self-heals locally from `.git/device-identity`.

> This whole path is exercised end-to-end by the `ds-testlab` harness (`C:/Work/App/ds-testlab/run-tests.sh`,
> scenarios G/H/I/J): disjoint union · both-advance-`main` union · same-file conflict surfaced ·
> pickup→winddown-same-session identity integrity — **30/30 assertions green**.

## Usage
```
/pickup      # start of work — fetch all lanes, adopt the most-forward handoff, read HANDOFF.md
/winddown    # end of work — commit, append HANDOFF entry, push device branch + main (in sync)
```
The `SessionStart` hook runs automatically and prints:
```
[device-sync] device=… | branch=… | default-target=… | release=…
[device-sync] SYNCED|AHEAD|BEHIND|DIVERGED … main
[device-sync] ⚠ origin/main ahead of your branch by N — run /pickup before working.
[device-sync] HANDOFF: <date> · <device> (<host>) · <agent> · branch <X>-Work
[device-sync] main = handoff/savepoint/stable/prod; commit on your working lane, sync main at /winddown.
```

## Guardrails
- **Never force-push** a shared branch; integrate with rebase/merge. `main` only fast-forwards to a
  completed, committed handoff (or a savepoint).
- **Never discard** a device lane's commits — when unsure, STOP and ask.
- `<Device>-Work:main` must be a fast-forward; if not, `/pickup` first.
- If `device.local.md` is missing/ambiguous, resolve via `device-branch-routing` first — never guess a target.

## Notes
- Extends the `device-branch-routing` `SessionStart` hook (no new wiring); reuses its `device.local.md`
  toggle. Both components must agree on the branch model.
- Hook, skill, commands, and agent are mirrored `.claude` ⇄ `.codex` per the claude-codex sync convention.
- On Windows/macOS (case-insensitive FS) the log is `HANDOFF.md` (uppercase) — no lowercase twin.
- Portable copy: `.other-devices/components/device-sync-protocol/`.
