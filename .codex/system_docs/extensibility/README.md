# Extensibility System

## Purpose

The extensibility system provides three mechanisms for customizing and extending Claude
Code behavior: agents, skills, and hooks. Together they form a layered architecture
where agents define who does the work, skills define what expertise is available, and
hooks define when automation runs.

## Architecture Overview

```
  +---------------------------------------------------+
  |                  Claude Code                       |
  +---------------------------------------------------+
       |                |                |
       v                v                v
  +-----------+   +-----------+   +-----------+
  |  Agents   |   |  Skills   |   |  Hooks    |
  +-----------+   +-----------+   +-----------+
  | WHO does  |   | WHAT they |   | WHEN auto |
  | the work  |   | know how  |   | runs      |
  |           |   | to do     |   |           |
  | - Model   |   | - SKILL.md|   | - Event   |
  | - Perms   |   | - scripts/|   |   triggers|
  | - Tools   |   | - resources|  | - Exit    |
  | - Skills  |   |           |   |   codes   |
  +-----------+   +-----------+   +-----------+
       |                |                |
       v                v                v
  YAML front-     Progressive       settings.json
  matter +        disclosure        hook configs
  markdown        (3-level)
  instructions
```

## Component Locations

| Component              | Path                                           |
|------------------------|------------------------------------------------|
| Agent creation skill   | `.codex/skills/creating-claude-agents/SKILL.md` |
| Skill creation skill   | `.codex/skills/creating-claude-skills/SKILL.md` |
| Hooks skill            | `.codex/skills/using-claude-hooks/SKILL.md`     |
| Agent template         | `.codex/skills/creating-claude-agents/scripts/agent-template.md` |
| Skill template         | `.codex/skills/creating-claude-skills/scripts/skill-template.md` |
| Agent architecture ref | `.codex/skills/creating-claude-agents/resources/agent-architecture.md` |
| Subagent patterns ref  | `.codex/skills/creating-claude-agents/resources/subagent-patterns.md` |
| Progressive disclosure | `.codex/skills/creating-claude-skills/resources/progressive-disclosure.md` |
| All agents             | `.codex/agents/`                                |
| All skills             | `.codex/skills/`                                |
| Hook scripts           | `.codex/hooks/scripts/`                         |
| Project settings       | `.codex/settings.json`                          |
| User settings          | `~/.codex/settings.json`                        |
| Local overrides        | `.codex/settings.local.json`                    |

## How They Work Together

1. **An agent** is configured with a model, permission mode, tools, and skills.
2. **Skills** referenced by the agent are loaded via progressive disclosure when relevant.
3. **Hooks** fire at lifecycle events, running validation, formatting, or automation
   scripts regardless of which agent is active.

An agent can reference multiple skills. A skill can be referenced by multiple agents.
Hooks apply to all agents uniformly via settings.json.

## Related Documentation

- [Agent Creation](./agent-creation.md) -- Full guide to creating agents
- [Skill Creation](./skill-creation.md) -- Full guide to creating skills
- [Hooks System](./hooks-system.md) -- Hook types, exit codes, and patterns
