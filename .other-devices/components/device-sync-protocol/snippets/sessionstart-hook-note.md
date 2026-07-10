# SessionStart hook wiring — ALREADY EXISTS (no new wiring needed)

This component does **not** add a new hook wiring entry. It **extends the existing hook script**
`.claude/hooks/scripts/device-sync-check.sh`, which is already wired into
`.claude/settings.json` → `hooks.SessionStart` by the **device-branch-routing** component.

## What that means when installing into a target repo

1. If the target repo **already has device-branch-routing installed**, the `SessionStart` wiring is
   present. You only need to **overwrite the hook script** (`.claude/hooks/scripts/device-sync-check.sh`
   and its `.codex/` mirror) with the **extended** version shipped in this package's `artifacts/`.
   No `settings.json` edit is required.

2. If the target repo does **not** yet have device-branch-routing, install that component first (it
   ships the `settings.json` `hooks.SessionStart` entry), then apply this component's extended hook
   on top.

## The existing wiring (for reference — from device-branch-routing)

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/scripts/device-sync-check.sh",
            "description": "Report this device + branch sync status vs main (device-branch-routing)"
          }
        ]
      }
    ]
  }
}
```

## What the extension added

The extended `device-sync-check.sh` keeps the original device/branch/ahead-behind banner and ADDS:
- **Cross-device pickup signal** — flags when `origin/main` (the latest handoff) or the *other*
  device's working lane is ahead of your branch → `⚠ … — run /pickup before working.`
- **HANDOFF.md freshness** — prints the newest `HANDOFF.md` entry header (who handed off + when).
- **Branch-model reminder** — `main = handoff/savepoint/stable/prod; commit on your working lane,
  sync main at /winddown.`
- Fetches **both** working lanes (`Home-Work`, `Asus-Work`) plus `main`, and defaults each device to
  its **working lane** (2026-07-06 branch-model change) instead of home→`main`.
