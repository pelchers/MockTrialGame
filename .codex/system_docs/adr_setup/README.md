# ADR Setup System

## Purpose
The ADR Setup system provides a dedicated agent and skill for initializing, modifying, and maintaining the `.adr/` Architecture Decision Record workspace. It encapsulates all ADR conventions into a single, directly-invocable unit that does not depend on the broader longrunning-session or orchestrator-session skill chains.

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Agent | `.codex/agents/adr-setup-agent/agent.md` | Agent instructions for ADR operations |
| Skill | `.codex/skills/adr-setup/SKILL.md` | Skill definition with conventions + lifecycle |
| Templates | `.codex/skills/adr-setup/templates/` | 7 template files for all ADR artifacts |
| References | `.codex/skills/adr-setup/references/` | Full conventions reference document |
| System Docs | `.codex/system_docs/adr_setup/` | This documentation |

## When to Use

### Primary Use Cases
1. **Project bootstrap** — Initialize `.adr/` structure for a new project
2. **Session creation** — Add a new session with all 4 orchestration files
3. **Phase management** — Create, complete, and archive phase files
4. **Structure audit** — Verify ADR conventions are followed after manual edits

### Fallback Use Case
When the longrunning-session or orchestrator-session agents/skills fail to execute ADR operations due to:
- Agent call routing miscommunication
- Skill invocation failure
- Context window limitations preventing the broader agents from loading

In these cases, the adr-setup agent can be called directly to perform the same ADR folder operations.

## Relationship to Other Systems

```
+----------------------------+
|   orchestrator-session     |  Multi-agent sessions with subagent handoffs
+----------------------------+
|   longrunning-session      |  Single-agent sessions with phase lifecycle
+----------------------------+
|   research-docs-session    |  Research-focused variant
+----------------------------+
           |
           v  (all depend on ADR conventions)
+----------------------------+
|   adr-setup                |  Standalone ADR folder management
+----------------------------+
```

The adr-setup agent/skill contains the same ADR conventions that are embedded in the longrunning and orchestrator skills, but isolated into a focused, independently-callable unit.

## Templates Included

| Template | Produces |
|----------|----------|
| `phase_template.md` | Phase plan with objectives, tasks, deliverables, validation |
| `phase_review_template.md` | Phase completion review with file tree + breakdown |
| `prd_template.md` | Product Requirements Document |
| `technical_requirements_template.md` | Technical specs and architecture |
| `primary_task_list_template.md` | Master phase checklist |
| `notes_template.md` | Decisions, constraints, open questions |
| `adr_readme_template.md` | `.adr/README.md` workspace overview |

## Key Conventions Summary
- Sessions: `UPPERCASE_SNAKE_CASE` with numeric prefix
- Phase files: `phase_N.md` (plan), `phase_N_review.md` (review)
- Orchestration files: permanent in `orchestration/<SESSION>/`
- Phase plans: active in `current/`, archived in `history/`
- Status: `planned` -> `in_progress` -> `complete` (or `blocked`)
- Commit per phase with session/phase reference

See `.codex/skills/adr-setup/references/conventions.md` for the full conventions document.
