<!-- Paste this managed block into the target repo's CLAUDE.md / .claude/CLAUDE.md (Markdown, ##),
     and adapt the heading depth for .codex/CODEX.md (####) and .codex/AGENTS.md (##).
     Append idempotently between the BEGIN/END markers — do NOT duplicate if a block already exists.
     Adjust the device list + working-lane branch names to the target project. -->

<!-- BEGIN device-sync-and-handoff convention (managed; append idempotently — do not duplicate) -->
## Device Sync & Handoff Convention (Required)
- **Multi-device repo** (home-desktop ⇄ asus-laptop). BOTH devices commit to their own **working lane**
  (`Home-Work` / `Asus-Work`, resolved from `device.local.md`). **`main` = handoff + savepoint + stable +
  deployment/prod** — NOT a daily lane; it is synced to your working lane only at wind-down.
- **START of work → `/pickup`** (skill `device-sync-protocol`): `git fetch` all lanes, determine the
  most-forward-*appropriate* state (ADR/planning/`HANDOFF.md`-informed, not raw commit count), adopt it
  into your working branch (`--ff-only` / `pull --rebase`; STOP + ask if lanes truly diverged — never
  force-push, never discard a lane), then read the newest `HANDOFF.md` entry + status board before working.
  The SessionStart banner flags when a device/`main` is ahead.
- **END of work → `/winddown`**: commit to your lane → prepend a `HANDOFF.md` entry (append-only,
  per-device) → update chat-history + status board → `git push origin <Device>-Work` then
  `git push origin <Device>-Work:main` (fast-forward only) → optional `/savepoint` at a milestone.
- Full protocol: `.docs/runbooks/development/device-sync-and-handoff-protocol.md`. Log: `HANDOFF.md`.
<!-- END device-sync-and-handoff convention -->

<!-- Paste into all four always-loaded instruction files:
       CLAUDE.md · .claude/CLAUDE.md · .codex/CODEX.md · .codex/AGENTS.md
     This convention LAYERS ON TOP of the device-branch-routing "Device Branch Convention" block
     (the working-lane resolver) — keep both; do not replace one with the other. -->
