# FILE-TREE — `cycle-back` (install checklist)

Files this component adds/edits in a host repo.

## Created
```
.claude/skills/cycle-back/SKILL.md
.claude/agents/cycle-back-agent/AGENT.md
.claude/commands/cycle-back.md
.claude/hooks/scripts/cycle-back-surface.sh
.claude/system_docs/cycle_back/README.md
.claude/system_docs/cycle_back/USAGE_GUIDE.md
.codex/skills/cycle-back/SKILL.md                 (mirror)
.codex/agents/cycle-back-agent/AGENT.md           (mirror)
.codex/commands/cycle-back.md                     (mirror; header → Codex)
.codex/hooks/scripts/cycle-back-surface.sh        (mirror)
.codex/system_docs/cycle_back/README.md           (mirror)
.codex/system_docs/cycle_back/USAGE_GUIDE.md      (mirror)
.docs/runbooks/development/cycle-back.md          (.docs only — NOT mirrored to .codex)
.other-devices/components/cycle-back/**           (this portable package)
.chat-history/cycle-back.md                       (project-local — created on first use; NEVER synced)
```

## Edited (shared wiring)
```
.claude/settings.json                             (+1 SessionStart hook entry)
.claude/hooks/scripts/sync-flush.sh               (+cycle-back paths in PATHS; mirror to .codex)
.codex/hooks/scripts/sync-flush.sh                (mirror of the PATHS edit)
CLAUDE.md / .claude/CLAUDE.md / .codex/CODEX.md / .codex/AGENTS.md   (+managed convention block)
SYNC-REPOS.md                                     (register the component)
.claude/system_docs/README.md / .codex/system_docs/README.md         (master index: File Tree + Overview row)
```

## Counts
- 1 skill · 1 agent · 1 command · 1 hook · 2 system_docs · 1 runbook · 1 portable package.
- 13 created component files (excluding the project-local log + this package) + 6 wiring edits.

## Do-NOT
- Do **NOT** sync `.chat-history/cycle-back.md` — it is project-local (each repo its own).
- Do **NOT** mirror the runbook into `.codex` (runbooks live only in `.docs/`).
