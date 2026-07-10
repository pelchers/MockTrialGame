# FILE-TREE — `device-branch-routing` component

> Every file this component **adds** or **edits** in the host repo, with status. Use this as the
> authoritative checklist when porting to a template/other repo. `NEW` = create; `EDIT` = modify
> existing; `TRACKED` = committed per-branch (no-ignore policy — each device's lane self-describes).

## Tree (paths relative to repo root)

```
repo-root/
├── device.local.example.md ................................ NEW   (committed template)
├── device.local.md ....................................... TRACKED (committed per-branch; no-ignore)
├── CLAUDE.md ............................................. EDIT  (+ Device Branch Convention)
├── .claude/
│   ├── CLAUDE.md ........................................ EDIT  (+ Device Branch Convention)
│   ├── settings.json ................................... EDIT  (+ hooks.SessionStart)
│   ├── skills/device-branch-routing/SKILL.md ........... NEW
│   ├── hooks/scripts/device-sync-check.sh .............. NEW
│   └── commands/device.md .............................. NEW   (/device)
├── .codex/
│   ├── CODEX.md ........................................ EDIT  (+ Device Branch Convention)
│   ├── AGENTS.md ....................................... EDIT  (+ Device branch convention)
│   ├── skills/device-branch-routing/SKILL.md ........... NEW
│   ├── hooks/scripts/device-sync-check.sh .............. NEW
│   ├── commands/device.md .............................. NEW
│   └── system_docs/device_branch_routing/README.md ..... NEW
└── .docs/
    ├── planning/plans/2-device-aware-branch-convention.md  NEW   (design/decisions)
    └── runbooks/development/device-branch-convention.md ... NEW   (runbook + user guide)
```

## Counts
- **NEW:** 11 files (1 template, 2 skill, 2 hook, 2 command, 1 system_docs, 1 plan, 1 runbook, + this staging package)
- **EDIT:** 5 files (root `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/settings.json`, `.codex/CODEX.md`, `.codex/AGENTS.md`)
- **TRACKED per-branch:** 1 file (`device.local.md` — committed on each device's branch; no `.gitignore` entry, per the no-ignore policy)

## Staged copies in this package
| Live file | Copy here |
|---|---|
| `.claude/skills/device-branch-routing/SKILL.md` (== `.codex/…`) | `artifacts/SKILL.md` |
| `.claude/hooks/scripts/device-sync-check.sh` (== `.codex/…`) | `artifacts/device-sync-check.sh` |
| `.claude/commands/device.md` (Codex variant: header line only) | `artifacts/device.md` |
| `.codex/system_docs/device_branch_routing/README.md` | `artifacts/system_docs-README.md` |
| `.docs/runbooks/development/device-branch-convention.md` | `artifacts/runbook-device-branch-convention.md` |
| `device.local.example.md` | `artifacts/device.local.example.md` |
| `.docs/planning/plans/2-device-aware-branch-convention.md` | `plans/2-device-aware-branch-convention.md` |
| CLAUDE/CODEX convention block | `snippets/convention-snippet.md` |
| `.claude/settings.json` SessionStart wiring | `snippets/settings-sessionstart-snippet.json` |
| no-ignore policy note (do NOT add to `.gitignore`) | `snippets/gitignore-snippet.txt` |

> The `.claude` and `.codex` copies of the skill and hook are byte-identical except path strings;
> the command differs only in its `Instructions for Claude` / `Instructions for Codex` header.
