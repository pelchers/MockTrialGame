# MANIFEST — `device-sync-protocol`

**What it is:** cross-device pickup/wind-down rituals for multi-machine work. At the **start** of work
`/pickup` fetches every lane, adopts the most-forward-*appropriate* handoff into this device's working
branch, and rebuilds understanding from `HANDOFF.md` + the status board. At the **end** of work
`/winddown` commits to the working lane, prepends a `HANDOFF.md` entry, and pushes the device branch
**and** `main` in sync. An extended `SessionStart` hook flags when another device/`main` is ahead and
prints HANDOFF freshness so every session knows whether to `/pickup`.

**Branch model:** both devices default to their **working lane** (home→`Home-Work`, asus→`Asus-Work`);
**`main` = handoff + savepoint + stable + deployment/prod**, synced only at wind-down and savepoints.

**Type:** full component (skill + 2 commands + agent + extended hook + handoff log + system_docs +
runbook + convention). Companion / layer on top of `device-branch-routing`.

**Self-documenting package contents:**
- `FILE-TREE.md` — every file added/edited in the host repo (the install checklist).
- `artifacts/` — exact copies of the live files.
- `plans/` — the design note (decisions + branch model).
- `snippets/` — paste-ready CLAUDE/CODEX convention block + the "hook wiring already exists" note.
- `NOTES.md` — development context + rationale + gotchas.

---

## Prerequisite

Install **`device-branch-routing`** first (this component reuses its `device.local.md` toggle and its
`.claude/settings.json` → `hooks.SessionStart` wiring). If it is already installed, you only overwrite
the hook script — no `settings.json` edit is needed. See `snippets/sessionstart-hook-note.md`.

## Install into a target repo (file → target path)

| From (this package) | → Target path in destination repo | Action |
|---|---|---|
| `artifacts/SKILL.md` | `.claude/skills/device-sync-protocol/SKILL.md` | create |
| `artifacts/SKILL.md` | `.codex/skills/device-sync-protocol/SKILL.md` | create (swap `.claude`→`.codex` in "Related" paths) |
| `artifacts/pickup.md` | `.claude/commands/pickup.md` | create |
| `artifacts/pickup.md` | `.codex/commands/pickup.md` | create (header → `Instructions for Codex`, paths `.claude`→`.codex`) |
| `artifacts/winddown.md` | `.claude/commands/winddown.md` | create |
| `artifacts/winddown.md` | `.codex/commands/winddown.md` | create (header → `Instructions for Codex`, paths `.claude`→`.codex`) |
| `artifacts/AGENT.md` | `.claude/agents/device-sync-agent/AGENT.md` | create |
| `artifacts/AGENT.md` | `.codex/agents/device-sync-agent/AGENT.md` | create (swap `.claude`→`.codex` in References) |
| `artifacts/device-sync-check.sh` | `.claude/hooks/scripts/device-sync-check.sh` | **overwrite** (extends the device-branch-routing hook) |
| `artifacts/device-sync-check.sh` | `.codex/hooks/scripts/device-sync-check.sh` | **overwrite** |
| `artifacts/runbook-device-sync-and-handoff-protocol.md` | `.docs/runbooks/development/device-sync-and-handoff-protocol.md` | create |
| `artifacts/HANDOFF.template.md` | `HANDOFF.md` (repo root) | create (seed; first `/winddown` prepends the first real entry) |
| `plans/device-sync-and-handoff-protocol-design.md` | `.docs/planning/plans/<n>-device-sync-and-handoff-protocol.md` | create (optional; renumber) |
| `snippets/convention-snippet.md` | append the managed block to `CLAUDE.md`, `.claude/CLAUDE.md`, `.codex/CODEX.md`, `.codex/AGENTS.md` | edit |
| `snippets/sessionstart-hook-note.md` | reference only — the SessionStart wiring already exists via device-branch-routing | n/a |
| — (system docs; regenerate or copy) | `.codex/system_docs/device_sync_protocol/README.md` + `USAGE_GUIDE.md` | create |

### Branch-model changes to existing files (device-branch-routing carry-over edits)

These EDITs re-point the *existing* device-branch-routing files at the new branch model. Apply them so
the two components agree:
- `.claude/skills/device-branch-routing/SKILL.md` (+ `.codex/`) — default target = the device's
  **working lane** (home→`Home-Work`, asus→`Asus-Work`); `main` = handoff/savepoint/stable/prod.
- `.claude/commands/device.md` (+ `.codex/`) — resolved-target wording updated for the working-lane default.
- `.docs/runbooks/development/device-branch-convention.md` — note `main` is now handoff/savepoint/prod.
- `device.local.md` — re-pin this machine to its working lane (tracked per-branch; no-ignore).
- `.github/workflows/ci.yml` — make CI aware of the `Home-Work` / `Asus-Work` lanes + `main`.

## Per-target adaptation

- **Device names / working-lane branches:** edit the device list and `Home-Work` / `Asus-Work` names in
  the skill, commands, agent, hook, convention snippet, and runbook to suit the target's machines. The
  *shape* is identical; only names change.
- **Main branch name:** if the target's stable/prod branch isn't `main`, change `MAIN="main"` in the
  hook and the `main` references in the skill/commands/agent/runbook.
- **Savepoint step** is optional (`/savepoint` from `savepoint-branching`); drop it if the target repo
  doesn't use savepoints.

## Post-install validation (run in the target repo)

1. `bash .claude/hooks/scripts/device-sync-check.sh` → prints device + branch + `main`-ahead/behind +
   (if another lane/`main` is ahead) the `run /pickup` line + the newest `HANDOFF.md` header.
2. **Dry `/pickup` logic:** `git fetch origin`; `git rev-list --left-right --count origin/main...HEAD`
   → confirm the behind/ahead counts match the banner; confirm the fast-forward path
   (`git merge --ff-only origin/main`) is what the skill would run when behind-only.
3. **Dry `/winddown` logic:** confirm `git push origin <Device>-Work:main` would be a **fast-forward**
   (`git rev-list --count origin/main..HEAD` with `origin/main..<lane>` containing no non-lane commits);
   if not a fast-forward, `/pickup` first. Never force-push `main`.
4. `git ls-files HANDOFF.md device.local.md` → both tracked (HANDOFF.md is the shared log;
   device.local.md is per-branch, NOT gitignored).
5. Confirm `.claude` ⇄ `.codex` parity (`syncing-claude-codex` skill) and that the system_docs entry exists.

## Provenance
- Origin repo: CarAggregator, branch `Home-Work`, machine `home-desktop` (hostname VENGEANCE).
- Born from a real cross-device handoff gap on 2026-07-06 (see `NOTES.md`).
- Live sources mirror under `.claude/` + `.codex/` + `.docs/` + `HANDOFF.md` of the origin repo.
