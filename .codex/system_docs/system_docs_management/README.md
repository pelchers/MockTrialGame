# System Docs Management System

System documentation for the system-docs-agent — the agent that creates and maintains this very directory.

## Purpose

Maintains the `.codex/system_docs/` directory as the central reference mapping every agent, skill, configuration, and output path in the project. Automatically invoked after new agents or skills are created to ensure all components are documented, categorized, and indexed.

## When to Use

- After creating a new agent (auto-invoked via creating-claude-agents skill)
- After creating a new skill (auto-invoked via creating-claude-skills skill)
- When modifying or renaming existing agents/skills
- When deprecating agents/skills (moves docs to `deprecated/`)
- When the master index needs a manual refresh

## Architecture

```
┌─────────────────────────────────────────────────┐
│          System Docs Agent                       │
│   (Documentation Maintainer / Index Updater)     │
├─────────────────────────────────────────────────┤
│  1. Reads new agent/skill YAML frontmatter       │
│  2. Classifies: folder vs table entry            │
│  3. Creates system_docs README if folder         │
│  4. Updates master index (file tree + table)     │
│  5. Mirrors to both repos if needed              │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ New Agent│  │ New Skill│  │ Existing │
  │ Created  │  │ Created  │  │ Modified │
  └──────────┘  └──────────┘  └──────────┘
```

## Key Concepts

### Auto-Invocation Chain

```
creating-claude-agents skill    creating-claude-skills skill
        │                               │
        └───── "Post-Creation" step ────┘
                       │
                       ▼
              system-docs-agent
                       │
                       ▼
              .codex/system_docs/ updated
```

Both the `creating-claude-agents` and `creating-claude-skills` skills include a mandatory final step that invokes the system-docs-agent.

### Classification Decision Tree

The agent determines whether a new component gets a dedicated folder or a table entry:
- **Folder**: Multi-component systems, orchestrator/subagent pairs, skills with substantial resources
- **Table entry**: Single standalone utility skills, simple tools without dedicated agents

### Master Index Sections

The master index (`system_docs/README.md`) has three sections that must all be updated:
1. **File Tree** — visual map of every system folder with agent/skill/config/output paths
2. **Skills Not Mapped** — table for standalone skills
3. **System Overview** — summary table with agent/skill counts and totals

## Agent & Skill Locations

| Component | Claude Path | Codex Path |
|-----------|-------------|------------|
| Agent | `.claude/agents/system-docs-agent/AGENT.md` | `.codex/agents/system-docs-agent.md` |
| Skill | `.claude/skills/system-docs-agent/SKILL.md` | `.codex/skills/system-docs-agent/SKILL.md` |
| System Docs Root | — | `.codex/system_docs/README.md` |
| This Documentation | — | `.codex/system_docs/system_docs_management/README.md` |

## Integration with Other Systems

- **extensibility**: The system-docs-agent is the downstream consumer of the agent/skill creation guides. It reads what the extensibility system produces.
- **claude_codex_sync**: System docs changes may need to be mirrored via the sync agent.
- **All other systems**: Every system in system_docs/ was either created by or should be maintained by this agent.
