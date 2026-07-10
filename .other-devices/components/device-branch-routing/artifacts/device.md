---
name: device
description: Show or change this machine's device git toggle (device.local.md) — which device, default branch target, and release method.
invocable: true
---

# /device — device git toggle

Shows and edits `device.local.md` (repo root, tracked per-branch, no-ignore policy), the single file that tells the AI
agent which device this machine is and where commits/pushes go by default.

## Instructions for Claude

When `/device` is invoked:

1. **Show current state** — run the sync hook to print the resolved banner:
   ```bash
   bash .claude/hooks/scripts/device-sync-check.sh
   ```
   Then read `device.local.md` and report, in plain language:
   - Device (`home-desktop` / `asus-laptop`)
   - Default target branch (resolved: home→`Home-Work`, asus→`Asus-Work`, or forced `main`)
   - Release method (`direct-push` / `pr-release`)
   - Hostname pin vs actual `hostname`

2. **If `device.local.md` is missing** — copy the template and tell the user to pick a device:
   ```bash
   cp device.local.example.md device.local.md
   ```

3. **If the user passed an argument** (`$ARGUMENTS`), apply it by editing the checkboxes in
   `device.local.md` (check exactly one box per section; uncheck the others):
   - `home` / `home-desktop` / `desktop` → check `home-desktop`
   - `asus` / `laptop` / `work` → check `asus-laptop`
   - `main` → set target toggle to `main`; `device-default` → set target to `device-default`
   - `direct` / `direct-push` → release `direct-push`; `pr` / `pr-release` → release `pr-release`
   - Pin the hostname: set `HOSTNAME=` to the current `hostname` if blank or mismatched.

4. **Commit `device.local.md`** on this device's branch (no-ignore policy) so the other device
   understands this lane. Do NOT gitignore it, and do NOT overwrite another device's committed copy.

5. **Confirm** the new resolved state by re-running the hook from step 1.

## Examples

```
/device              → show current device/target/release
/device asus         → set this machine to the Asus work laptop (→ Asus-Work)
/device home         → set this machine to the home desktop (→ Home-Work)
/device pr           → switch release method to PR-into-main
```

## Notes

- Resolution + push-gate rules live in the `device-branch-routing` skill.
- `main` = handoff + savepoint + stable/prod — synced to your working lane at `/winddown` (skill
  `device-sync-protocol`), not a daily target. Both devices default to their own `*-Work` lane.
- Full setup / new-device guide: `.docs/runbooks/development/device-branch-convention.md`.
- The work laptop (`asus-laptop`) never auto-pushes to `main` — only when explicitly directed.

$ARGUMENTS
