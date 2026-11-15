# FILE-TREE — `contributor-conventions` component

> Every file this component **adds** or **edits** in the host repo, with status. Use this as the
> authoritative checklist when porting to a template/other repo. `NEW` = create; `EDIT` = modify
> existing (append idempotently); `LOCAL` = tracked per-repo (no `.gitignore` entry — no-ignore policy);
> `ORCH` = **orchestrator-owned** (built + registered + tested by the orchestrator, NOT by this component).
>
> This component is a **companion to** `device-sync-protocol`: both read a tracked `*.local.md` sibling
> at the repo root. `device.local.md` answers *which device*; `repo.local.md` answers *what our
> relationship to this repo is*.

## Tree (paths relative to repo root)

```
repo-root/
├── repo.local.md ........................................... LOCAL (ownership + remotes; tracked per-repo, no-ignore)
├── CLAUDE.md ............................................... EDIT  (+1 line at END of production-pr-on-request block)
├── .claude/
│   ├── CLAUDE.md .......................................... EDIT  (+1 line at END of production-pr-on-request block)
│   ├── skills/contributor-conventions/SKILL.md ........... NEW
│   ├── commands/promote-pr.md ............................ NEW   (/promote-pr)
│   ├── commands/declare-repo.md .......................... NEW   (/declare-repo)
│   ├── agents/contributor-promotion-agent/AGENT.md ....... NEW
│   ├── agents/git-workflow-agent/AGENT.md ................ EDIT  (+1 line at END of production-pr-on-request block)
│   ├── hooks/scripts/contributor-repo-check.sh ........... ORCH  (SessionStart banner — orchestrator builds)
│   ├── hooks/scripts/contributor-push-guard.sh ........... ORCH  (PreToolUse fail-open guard — orchestrator builds)
│   └── settings.json ..................................... ORCH  (hook registration — orchestrator edits; NOT this component)
├── .codex/
│   ├── CODEX.md .......................................... EDIT  (+1 line at END of production-pr-on-request block)
│   ├── AGENTS.md ......................................... EDIT  (+1 line at END of production-pr-on-request block)
│   ├── skills/contributor-conventions/SKILL.md ........... NEW   (mirror)
│   ├── commands/promote-pr.md ............................ NEW   (mirror; header → Instructions for Codex)
│   ├── commands/declare-repo.md .......................... NEW   (mirror; header → Instructions for Codex)
│   ├── agents/contributor-promotion-agent/AGENT.md ....... NEW   (mirror)
│   ├── hooks/scripts/contributor-repo-check.sh ........... ORCH  (mirror — orchestrator builds)
│   ├── hooks/scripts/contributor-push-guard.sh ........... ORCH  (mirror — orchestrator builds)
│   ├── hooks/settings.json .............................. ORCH  (hook registration — orchestrator edits; NOT this component)
│   └── system_docs/contributor_conventions/
│       ├── README.md ..................................... NEW
│       ├── USAGE_GUIDE.md ................................ NEW
│       ├── ARCHITECTURE.md ............................... NEW
│       └── HOOKS-TODO.md ................................. NEW   (the two hook specs for the orchestrator)
├── .docs/runbooks/development/
│   └── contributor-conventions.md ........................ NEW   (the full runbook)
├── SYNC-REPOS.md ........................................... EDIT  (register the component in "What to sync")
└── sync-repos-<device>.md ................................. EDIT  (Components-tracked row + Sync-log entry)
```

## Counts
- **NEW:** 14 files — `repo.local.md.template` (staged) + 2 skill (claude+codex) + 2 `/promote-pr` +
  2 `/declare-repo` + 2 agent AGENT.md + runbook + 4 system_docs (README, USAGE_GUIDE, ARCHITECTURE,
  HOOKS-TODO) — plus this staging package.
- **EDIT:** 7 files — root `CLAUDE.md`, `.claude/CLAUDE.md`, `.codex/CODEX.md`, `.codex/AGENTS.md`,
  `.claude/agents/git-workflow-agent/AGENT.md` (one-line governance pointer); `SYNC-REPOS.md` +
  `sync-repos-<device>.md` (register the component).
- **LOCAL (tracked per-repo):** 1 file — `repo.local.md` (created via `/declare-repo`; NOT gitignored).
- **ORCH (orchestrator-owned, NOT this component):** the two hook scripts (`.claude` + `.codex`) +
  `settings.json` registration.

## Staged copies in this package
| Live file | Copy here |
|---|---|
| `.claude/skills/contributor-conventions/SKILL.md` (== `.codex/…`) | `artifacts/SKILL.md` |
| `.claude/commands/promote-pr.md` (Codex variant: header only) | `artifacts/promote-pr.md` |
| `.claude/commands/declare-repo.md` (Codex variant: header only) | `artifacts/declare-repo.md` |
| `.claude/agents/contributor-promotion-agent/AGENT.md` (== `.codex/…`) | `artifacts/AGENT.md` |
| `repo.local.md` (placeholder template, both boxes unchecked) | `artifacts/repo.local.md.template` |
| `.docs/runbooks/development/contributor-conventions.md` | `artifacts/runbook-contributor-conventions.md` |
| the two hook specs (orchestrator builds the scripts) | `artifacts/HOOKS-TODO.md` |
| design note (decisions + two-remote model) | `plans/contributor-conventions-design.md` |
| one-line governance pointer (paste-ready) | `snippets/convention-snippet.md` |
| the two-hooks note (orchestrator-owned; no settings.json edit here) | `snippets/sessionstart-hook-note.md` |

> The `.claude` and `.codex` copies of the skill/agent are byte-identical except path strings; the
> commands differ only in their `Instructions for Claude` / `Instructions for Codex` header.
> `repo.local.md` is TRACKED per-repo (no-ignore policy) — do NOT gitignore it and do NOT overwrite
> another repo's committed copy (each repo declares its own ownership + remotes).
