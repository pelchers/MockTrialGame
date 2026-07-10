# NOTES — `device-sync-protocol` (development context)

## Problem it solves
`device-branch-routing` answers *where do I commit on this machine?* — but it does not answer the two
questions that actually bite on a multi-device project: **"am I starting from the most-forward version
of the work?"** and **"did I leave the next machine enough to resume cold?"** This component was born
from a **real cross-device handoff gap on 2026-07-06**: work advanced on the laptop (`Asus-Work`) and
the home desktop, and without an explicit start-of-work sync + an end-of-work handoff record it was
easy to start on a stale base or lose the "where we left off / what's next" thread between machines.

The fix is two rituals — **`/pickup`** at the start and **`/winddown`** at the end — plus an
append-only **`HANDOFF.md`** log and a `SessionStart` banner that tells you when to run `/pickup`.

## Key design decisions (full list in `plans/device-sync-and-handoff-protocol-design.md` §0)
- **`main` = handoff + savepoint + stable + deployment/prod** — NOT a daily working lane. The latest
  handoff always lives on `main`, so the next machine resumes by pulling `main`. Production deploys
  from `main`; savepoints (`/savepoint`) cut from `main`.
- **Both devices default to their own working lane** (home→`Home-Work`, asus→`Asus-Work`). This changed
  2026-07-06 — home-desktop no longer commits directly to `main`. `main` is synced to the working lane
  **only at wind-down** and at savepoints.
- **Append-only, per-device `HANDOFF.md`** — same shape/spirit as the `chat-history` convention: newest
  entry on top, device-labeled, never rewritten. It is the "where we left off + next steps" layer; the
  status board + chat-history are the "understanding" layer this protocol ties together.
- **Intelligent, ADR-informed pickup** — "most-forward" is decided by reading
  `.adr/current/development-progress.md` + `.docs/planning/*` + the newest `HANDOFF.md` entry + the
  diverging commits, **NOT** by raw commit count. If two lanes advanced *different* ADR areas → integrate
  **both**; never discard a lane's work.
- **Extend the existing hook, don't add a new one.** `device-sync-check.sh` (from device-branch-routing)
  gained the cross-device pickup signal + HANDOFF freshness line; the `SessionStart` *wiring* is unchanged
  and already present. No new `settings.json` entry.
- **Codex parity** — skill, both commands, agent, extended hook, and system_docs mirrored into `.codex/`;
  convention block appended to `.codex/CODEX.md` + `.codex/AGENTS.md`.

## Gotchas when porting
- **Windows case-collision → the file is `HANDOFF.md`, not `handoff.md`.** On case-insensitive
  filesystems (Windows/macOS default), a lowercase `handoff.md` alongside any `HANDOFF*` path collides.
  Keep the canonical uppercase `HANDOFF.md`; do not add a differently-cased twin.
- **Never force-push `main`** (or any shared branch). `main` is stable/prod — only *fast-forward* it to
  a completed, committed handoff (or a savepoint).
- **`<Device>-Work:main` must be a fast-forward.** If `main` moved (another device handed off) since your
  last pull, `git push origin <Device>-Work:main` will be rejected — run `/pickup` first to integrate,
  then push. Never `--force` your way past it.
- **Never discard a lane's commits.** Genuine divergence (both lanes have unique commits `main` lacks) →
  STOP and reconcile with the user (rebase/merge/cherry-pick) before working.
- **`device.local.md` is tracked per-branch** (no-ignore policy) — do NOT gitignore it and do NOT
  overwrite another device's committed copy. Resolve the device via `device-branch-routing` first; never
  guess a target.
- **Keep `.claude` ⇄ `.codex` in sync** (`syncing-claude-codex`) — the mirrors differ only in path
  strings and the command header (`Instructions for Claude` vs `Instructions for Codex`).
- The `HANDOFF.template.md` artifact is the install seed (header + entry template, no device entry) — a
  fresh repo starts with zero entries; the first `/winddown` prepends the first real one.

## Why staged here
Per the `.other-devices/` convention: anything reusable/template-worthy built on a device must be staged
as a portable package so it can be synced to template repos / other machines from the main PC. This
component pairs with `device-branch-routing` (the reference example) and layers the cross-device sync +
handoff on top of it.
