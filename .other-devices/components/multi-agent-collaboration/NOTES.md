# Notes — multi-agent-collaboration

## Why
Observed live (2026-06-22): two agents worked the same repos at once (this asus-laptop session + the tandem asus-laptop agent), and DualLeads + promgmnt/Needsboard instruction files changed mid-task. Nothing broke, but it invited clobbering / stale reads / lost edits. The tandem agent even flagged "active drift… promgmnt lost the anchor line between operations." This convention codifies safe concurrent habits.

## Core decision (per Luke)
**Always add-all + commit + push whenever a standard/convention denotes a commit.** Hand-scoping commits to "avoid" another agent's work is explicitly NOT wanted — the *irregardless* nature of always adding/committing/pushing everything is what obfuscates concurrent-work issues away: every state is captured in history and continuously integrated. (This supersedes an earlier draft that suggested scoping commits during concurrency.)

## Interaction with device-branch-routing
- Per-device branch lanes stay (asus-laptop → `Asus-Work`, home-desktop → `Home-Work`).
- **Change from the original component:** `device.local.md` is now **tracked/committed per-branch**, not gitignored — so each lane self-describes and is "understood" on the other device. `.gitignore` is removed (no-ignore policy); the `device-branch-routing` `gitignore-snippet.txt` is updated to reflect "tracked, do not ignore."
- The SessionStart hook (`device-sync-check.sh`) is read-only (seeds `device.local.md` from the example if missing) — it does not fight the no-ignore policy.

## Tradeoff to watch
Committing `device.local.md` per-branch is workable while each device stays on its own lane; the two lanes only meet at a merge to `main`, where `device.local.md` should be resolved to the target lane's value. If the tandem agent re-introduces the gitignore (it hardened the snippet against ignore-stripping), reconcile to this no-ignore policy.
