# NOTES — `device-branch-routing` (development context)

## Problem it solves
One repo, multiple machines (🖥 home-desktop, 💻 asus-laptop). Each device should have a different
default git target, and the work laptop must never accidentally push to `main`. Manual conventions
in CLAUDE.md alone can't do this — a committed convention is identical on every machine, so it
can't carry per-device state, and "check sync every conversation" can't be a memory (only a hook
runs every session).

## Key design decisions (full list in `plans/2-device-aware-branch-convention.md` §0)
- **Rules committed; toggle tracked per-branch.** `device.local.md` is committed on each device's
  branch (no-ignore policy) so the other device understands the lane; the rules live in committed
  files identical everywhere. (Originally designed gitignored/per-machine; superseded 2026-06-22 by
  the no-ignore + multi-agent-collaboration policy.)
- **One file the user edits:** `device.local.md`, three checkboxes (device · target · release).
- **Sync-check = `SessionStart` hook** with a bounded best-effort `git fetch` (8s) → local-ref
  fallback labeled `(stale)`. Never blocks a session.
- **Push-gate in the skill:** `asus-laptop` routine push → `Asus-Work`; `main` only on explicit
  "push to main".
- **Release method toggle:** `direct-push` (default) vs `pr-release`.
- **Parse robustness:** the hook reads the checked token via `awk '{print $3}'` (3rd field) — NOT
  sed `.*` — because emoji in the comments break `.*` under the C locale. (This bit us once; keep
  the awk approach when porting.)

## Gotchas when porting
- DO commit `device.local.md` on this device's branch (no-ignore policy); do NOT gitignore it, and do NOT overwrite another device's committed copy.
- Keep the awk-based parsing (see above).
- Rename branches/devices per target project, but keep the resolution *shape*.
- The Codex command/skill/hook are mirrors; keep `.claude` ⇄ `.codex` in sync with
  `syncing-claude-codex`.

## Why staged here
Per the `.other-devices/` convention: anything reusable/template-worthy built on a non-main device
is staged as a portable package so it can be synced to template repos / other machines from the
main PC. This component is the **reference example** for that convention.
