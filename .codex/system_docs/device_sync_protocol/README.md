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
