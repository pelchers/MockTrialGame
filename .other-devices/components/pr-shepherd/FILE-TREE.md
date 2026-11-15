# FILE-TREE — `pr-shepherd` component

> Every file this component **adds** or **edits** in the host repo, with status. Use this as the
> authoritative checklist when porting to a template/other repo. `NEW` = create; `EDIT` = modify existing
> (append idempotently); `LOCAL` = tracked per-repo, project-local state (no `.gitignore` entry — no-ignore
> policy); `OP` = **operator-applied** (the `/promote-pr` hand-off edit is owned by the operator /
> `contributor-conventions`, NOT applied by this component — see `snippets/promote-pr-integration.md`).
>
> This component is the **maintenance half of** `contributor-conventions`: that one OPENS the upstream
> feature-branch PR (`/promote-pr`); this one WATCHES it and remediates each gating failure until it merges.
> Runbooks live ONLY in `.docs/` — they are NOT mirrored into `.codex`.

## Tree (paths relative to repo root)

```
repo-root/
├── CLAUDE.md ............................................... EDIT  (+ managed `pr-shepherd` convention block)
├── SYNC-REPOS.md .......................................... EDIT  (register component + runbook set + learned-checks + managed block)
├── .claude/
│   ├── CLAUDE.md ......................................... EDIT  (+ managed `pr-shepherd` convention block)
│   ├── skills/pr-shepherd/SKILL.md ...................... NEW
│   ├── agents/pr-shepherd-agent/AGENT.md ................ NEW
│   ├── commands/pr-watch.md ............................. NEW   (/pr-watch)
│   ├── commands/promote-pr.md ........................... OP    (+1 hand-off step: auto `/pr-watch add` — operator-applied)
│   ├── hooks/scripts/sync-component.sh .................. EDIT  (append component paths to the FILES=() array)
│   └── system_docs/
│       ├── README.md .................................... EDIT  (master index — File Tree block + System Overview row + Total)
│       └── pr_shepherd/
│           ├── README.md ................................ NEW
│           └── USAGE_GUIDE.md ........................... NEW
├── .codex/
│   ├── CODEX.md ......................................... EDIT  (+ managed `pr-shepherd` convention block)
│   ├── AGENTS.md ........................................ EDIT  (+ managed `pr-shepherd` convention block)
│   ├── skills/pr-shepherd/SKILL.md ...................... NEW   (mirror)
│   ├── agents/pr-shepherd-agent/AGENT.md ................ NEW   (mirror)
│   ├── commands/pr-watch.md ............................. NEW   (mirror; header → Instructions for Codex)
│   ├── commands/promote-pr.md ........................... OP    (mirror of the hand-off step — operator-applied)
│   └── system_docs/
│       ├── README.md .................................... EDIT  (master index — File Tree block + System Overview row + Total)
│       └── pr_shepherd/
│           ├── README.md ................................ NEW   (mirror)
│           └── USAGE_GUIDE.md ........................... NEW   (mirror)
├── .docs/runbooks/development/
│   ├── pr-shepherd.md ................................... NEW   (the full runbook — .docs only, NOT mirrored to .codex)
│   └── pre-pr-learned-checks.md ........................ NEW   (learned-checks registry — .docs only; CONTENT is intentionally synced)
└── .chat-history/
    └── pr-watch-log.md ................................. LOCAL (per-PR watch state; created by /pr-watch add; project-local, no-ignore)
```

## Counts
- **NEW:** 12 files — 2 skill (claude+codex) + 2 agent + 2 `/pr-watch` command + 1 runbook + 1
  learned-checks + 2 system_docs README (claude+codex) + 2 system_docs USAGE_GUIDE (claude+codex).
  (Plus this staging package under `.other-devices/components/pr-shepherd/`.)
- **EDIT:** 10 files — `.claude/hooks/scripts/sync-component.sh` (FILES array); `SYNC-REPOS.md`; master
  system_docs README ×2 (`.claude` + `.codex`); the 4 convention files (`CLAUDE.md`, `.claude/CLAUDE.md`,
  `.codex/CODEX.md`, `.codex/AGENTS.md`) — managed `pr-shepherd` block; and the 2 `/promote-pr` commands
  (`.claude` + `.codex`) — the auto-register hand-off step (**OP — operator-applied**, not by this
  component).
- **LOCAL (tracked per-repo, project-local):** 1 file — `.chat-history/pr-watch-log.md` (created at runtime
  by `/pr-watch add`; NOT gitignored, NOT content-synced).

## Staged copies in this package
| Live file | Copy here |
|---|---|
| `.claude/skills/pr-shepherd/SKILL.md` (== `.codex/…`) | `artifacts/SKILL.md` |
| `.claude/agents/pr-shepherd-agent/AGENT.md` (== `.codex/…`) | `artifacts/AGENT.md` |
| `.claude/commands/pr-watch.md` (Codex variant: header only) | `artifacts/pr-watch.md` |
| `.docs/runbooks/development/pr-shepherd.md` | `artifacts/runbook-pr-shepherd.md` |
| `.docs/runbooks/development/pre-pr-learned-checks.md` | `artifacts/pre-pr-learned-checks.md` |
| `.claude/system_docs/pr_shepherd/README.md` (== `.codex/…`) | `artifacts/README.md` |
| `.claude/system_docs/pr_shepherd/USAGE_GUIDE.md` (== `.codex/…`) | `artifacts/USAGE_GUIDE.md` |
| approved design note (purpose · loop · composition · guardrails · learned-checks+sync · cron-vs-durable) | `plans/pr-shepherd-design.md` |
| paste-ready managed convention block | `snippets/convention-snippet.md` |
| the one-line `/promote-pr` hand-off step (operator-applied) | `snippets/promote-pr-integration.md` |

> The `.claude` and `.codex` copies of the skill/agent/system_docs are byte-identical except path strings;
> the `/pr-watch` command differs only in its `Instructions for Claude` / `Instructions for Codex` header.
> The two runbooks live ONLY in `.docs/` (never mirrored to `.codex`); `pre-pr-learned-checks.md` is the
> one runbook whose CONTENT is intentionally synced across repos (the learned-checks registry).
