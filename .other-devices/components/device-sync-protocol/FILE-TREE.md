# FILE-TREE — `device-sync-protocol` component

> Every file this component **adds** or **edits** in the host repo, with status. Use this as the
> authoritative checklist when porting to a template/other repo. `NEW` = create; `EDIT` = modify
> existing; `LOCAL` = tracked per-branch / machine-local (no `.gitignore` entry — each device's lane
> self-describes, per the no-ignore policy).
>
> This component **layers on top of** `device-branch-routing`: it reuses that component's
> `device.local.md` toggle + `SessionStart` hook *wiring* and repositions the branch model
> (`main` → handoff/savepoint/stable/prod; both devices default to their working lane). Several of the
> `EDIT` rows below are the device-branch-routing files updated for the new branch model.
>
> The `.codex/` mirrors + cross-file consistency edits are produced by a **parallel agent**; they are
> listed here as part of this component even where not all are present on disk yet.

## Tree (paths relative to repo root)

```
repo-root/
├── HANDOFF.md ............................................... NEW   (append-only, per-device handoff log)
├── CLAUDE.md ............................................... EDIT  (+ Device Sync & Handoff convention block)
├── .claude/
│   ├── CLAUDE.md .......................................... EDIT  (+ Device Sync & Handoff convention block)
│   ├── skills/device-sync-protocol/SKILL.md .............. NEW
│   ├── commands/pickup.md ................................ NEW   (/pickup)
│   ├── commands/winddown.md ............................. NEW   (/winddown)
│   ├── agents/device-sync-agent/AGENT.md ................ NEW
│   ├── hooks/scripts/device-sync-check.sh ............... EDIT  (extended: cross-device pickup signal + HANDOFF freshness + branch-model)
│   ├── skills/device-branch-routing/SKILL.md ............ EDIT  (working-lane default + main = handoff/savepoint/prod)
│   └── commands/device.md ............................... EDIT  (resolved-target wording for the new branch model)
├── .codex/
│   ├── CODEX.md ......................................... EDIT  (+ Device Sync & Handoff convention block)
│   ├── AGENTS.md ........................................ EDIT  (+ Device Sync & Handoff convention block)
│   ├── skills/device-sync-protocol/SKILL.md ............. NEW   (mirror)
│   ├── commands/pickup.md .............................. NEW   (mirror; header → Instructions for Codex)
│   ├── commands/winddown.md ........................... NEW   (mirror; header → Instructions for Codex)
│   ├── agents/device-sync-agent/AGENT.md .............. NEW   (mirror)
│   ├── hooks/scripts/device-sync-check.sh ............. EDIT  (mirror of the extended hook)
│   ├── skills/device-branch-routing/SKILL.md .......... EDIT  (mirror of the working-lane update)
│   ├── commands/device.md ............................. EDIT  (mirror of the branch-model wording)
│   ├── system_docs/device_sync_protocol/README.md ..... NEW
│   └── system_docs/device_sync_protocol/USAGE_GUIDE.md . NEW
├── device.local.md ....................................... EDIT/LOCAL (working-lane re-pin; tracked per-branch, no-ignore)
├── .docs/runbooks/development/
│   ├── device-sync-and-handoff-protocol.md ............. NEW   (the full runbook / design doc)
│   └── device-branch-convention.md .................... EDIT  (note: main = handoff/savepoint/prod; working-lane default)
└── .github/workflows/ci.yml .............................. EDIT  (CI aware of Home-Work / Asus-Work lanes + main)
```

## Counts
- **NEW:** 14 files — HANDOFF.md, 2 skill (claude+codex), 2 `/pickup`, 2 `/winddown`, 2 agent AGENT.md,
  runbook, 2 system_docs (README + USAGE_GUIDE), + this staging package.
- **EDIT:** 13 files — root `CLAUDE.md`, `.claude/CLAUDE.md`, `.codex/CODEX.md`, `.codex/AGENTS.md`
  (convention block); `device-sync-check.sh` (`.claude` + `.codex`, extended); `device-branch-routing`
  SKILL (`.claude` + `.codex`); `device.md` command (`.claude` + `.codex`); `device-branch-convention.md`
  runbook; `.github/workflows/ci.yml`.
- **LOCAL (tracked per-branch):** 1 file — `device.local.md` (working-lane re-pin; NOT gitignored).

## Staged copies in this package
| Live file | Copy here |
|---|---|
| `.claude/skills/device-sync-protocol/SKILL.md` (== `.codex/…`) | `artifacts/SKILL.md` |
| `.claude/commands/pickup.md` (Codex variant: header line only) | `artifacts/pickup.md` |
| `.claude/commands/winddown.md` (Codex variant: header line only) | `artifacts/winddown.md` |
| `.claude/agents/device-sync-agent/AGENT.md` (== `.codex/…`) | `artifacts/AGENT.md` |
| `.claude/hooks/scripts/device-sync-check.sh` (extended; == `.codex/…`) | `artifacts/device-sync-check.sh` |
| `.docs/runbooks/development/device-sync-and-handoff-protocol.md` | `artifacts/runbook-device-sync-and-handoff-protocol.md` |
| `HANDOFF.md` template (header/entry-template block, install-ready) | `artifacts/HANDOFF.template.md` |
| design note (decisions + branch model for this component) | `plans/device-sync-and-handoff-protocol-design.md` |
| CLAUDE/CODEX convention block (managed, paste-ready) | `snippets/convention-snippet.md` |
| SessionStart hook wiring note (already exists via device-branch-routing) | `snippets/sessionstart-hook-note.md` |

> The `.claude` and `.codex` copies of the skill/agent/hook are byte-identical except path strings;
> the commands differ only in their `Instructions for Claude` / `Instructions for Codex` header.
> `device.local.md` is TRACKED per-branch (no-ignore policy) — do NOT gitignore it and do NOT
> overwrite another device's committed copy.
