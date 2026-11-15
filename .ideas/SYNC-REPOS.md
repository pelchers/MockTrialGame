# Sync Repos

This file mirrors the root `SYNC-REPOS.md` so the idea logging workflow can be run from inside `.ideas/`.

When adding new agents, skills, or system docs to `.claude/` and `.codex/`, and when updating the `.ideas/` folder, also sync them to these repos:

| Repo | Path | Notes |
|------|------|-------|
| Template | `C:\Template\Claude+Codex Agent+Skill Sync\All` | Primary template — all agents/skills/system_docs |
| MockTrial | `C:\Game\MockTrial.game` | Game project |
| AppDock | `C:\App\AppDock` | App project |
| PortfolioV1 | `C:\App\PortfolioV1` | Portfolio project |
| IDEA-MANAGEMENT | `C:\Ideas\IDEA-MANAGEMENT` | Idea management app |
| Markdown Mermaid Editor | `C:\Extensions\Markdown Mermaid Editor` | VS Code extension |
| Campus | `C:\coding\apps\campus` | Campus app |
| Dispatch Template | `C:\Dispatch\Template\All` | Dispatch template — all agents/skills/system_docs |
| Brand-MarTech | `C:\App\Portfolios\Brand-MarTech` | Umbrella marketing portfolio (core site) |
| CDP | `C:\App\CDP` | Car dealership platform (private, single owner) |

## What to sync

- `.ideas/ideas.md`
- `.ideas/README.md`
- `.ideas/SYNC-REPOS.md`
- `.ideas/<Idea Title>/...`
- `.claude/agents/idea-logger/agent.md`
- `.claude/skills/logging-ideas/SKILL.md`
- `.claude/commands/log-idea.md`
- `.claude/hooks/scripts/idea-log-detect.sh`
- `.claude/hooks/settings.json`
- `.claude/system_docs/idea_logging/README.md`
- `.claude/system_docs/idea_logging/USAGE_GUIDE.md`
- `.claude/system_docs/idea_logging/ARCHITECTURE.md`
- `.codex/agents/idea-logger/AGENT.md`
- `.codex/skills/logging-ideas/SKILL.md`
- `.codex/commands/log-idea.md`
- `.codex/system_docs/idea_logging/README.md`
- `.codex/system_docs/idea_logging/USAGE_GUIDE.md`
- `.codex/system_docs/idea_logging/ARCHITECTURE.md`

## How

Use the `syncing-claude-codex` skill for `.claude/` <-> `.codex/` sync within a repo.
Use the `maintaining-trinary-sync` skill or manual copy for cross-repo sync.
