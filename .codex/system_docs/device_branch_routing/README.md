# Device Branch Routing System

## Overview
Routes git commits/pushes to the correct branch based on **which physical machine** the AI agent
is running on. The active device, default target branch, and release method are declared in a
single per-branch tracked file at the repo root — `device.local.md` — the only file the user edits. A
`SessionStart` hook reports branch + ahead/behind-vs-`main` every conversation, and a skill
enforces that the work laptop never auto-pushes to `main`.

## Components
| Component | Path |
|---|---|
| **Toggle (per-device, tracked per-branch)** | `device.local.md` (repo root) |
| **Template (committed)** | `device.local.example.md` (repo root) |
| **Skill** | `.claude/skills/device-branch-routing/SKILL.md` · `.codex/skills/device-branch-routing/SKILL.md` |
| **Hook (SessionStart)** | `.claude/hooks/scripts/device-sync-check.sh` · `.codex/hooks/scripts/device-sync-check.sh` |
| **Hook wiring** | `.claude/settings.json` → `hooks.SessionStart` |
| **Command** | `.claude/commands/device.md` (`/device`) · `.codex/commands/device.md` |
| **Runbook + user guide** | `.docs/runbooks/development/device-branch-convention.md` |
| **Plan / decisions** | `.docs/planning/plans/2-device-aware-branch-convention.md` |
| **Portable package** | `.other-devices/components/device-branch-routing/` (FILE-TREE + MANIFEST + NOTES + artifacts/ + plans/ + snippets/) |
| **no-ignore policy** | `device.local.md` is TRACKED per-branch (NOT gitignored); `device.local.example.md` also tracked |

## Naming
| Device id | Display | Branch |
|---|---|---|
| `home-desktop` | 🖥 Home PC | `Home-Work` |
| `asus-laptop` | 💻 Asus Work Laptop | `Asus-Work` |
| `<name>-device` (future) | — | `<Name>-Work` |

`main` = handoff + savepoint + stable + deployment/prod branch (synced to a working lane only at wind-down).

## Toggles (in device.local.md)
1. Device — `home-desktop` | `asus-laptop`
2. Default target — `device-default` | `main`
3. Release method — `direct-push` (default) | `pr-release`
4. `HOSTNAME=` pin (safety net)

## Resolution rules
- `home-desktop` + `device-default` → `Home-Work` (routine pushes go to the working lane; `main` synced at wind-down).
- `asus-laptop` + `device-default` → `Asus-Work` (routine pushes go to the working lane; `main` synced at wind-down).
- Either device + target `main` → `main`.
- Release to `main`: `direct-push` (default) or `pr-release` (open a PR).

## Usage
```
/device              # show resolved device / target / release
/device asus|home    # switch this machine's device
/device main|device-default
/device direct|pr    # switch release method
```
The `SessionStart` hook runs automatically and prints:
```
[device-sync] device=… | branch=… | default-target=… | release=…
[device-sync] SYNCED|AHEAD|BEHIND|DIVERGED … main
```

## Notes
- `device.local.md` is TRACKED and committed per-branch (no-ignore policy) so each device's lane self-describes; don't overwrite another device's committed copy.
- The hook and skill are mirrored `.claude` ⇄ `.codex` per the claude-codex sync convention.
- Replaces the previous hardcoded single-`Work`-branch convention.
