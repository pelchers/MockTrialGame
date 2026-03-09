# System Docs: TODO Tracker

## Purpose
Maintains `TODO.md` at the project root as a human-readable kanban board for the developer. Updated during planning conversations, orchestrator sessions, and on user request.

## Components

| Component | Path |
|-----------|------|
| Agent | `.codex/agents/todo-tracker/AGENT.md` |
| Skill | `.codex/skills/todo-tracker/SKILL.md` |
| Output | `TODO.md` (project root) |

## Architecture

- **Agent** defines behavior rules: when to update, writing style, column semantics
- **Skill** is user-invocable (`/todo`, `/todo add`, `/todo done`, `/todo future`)
- **Output** is a single markdown file with 4 kanban columns: IN PROGRESS, TODO NEXT, COMPLETED, TODO FUTURE

## Integration Points

- `longrunning-orchestrator-agent` — Updates TODO.md at session start (IN PROGRESS), phase completion (COMPLETED), and session end
- `orchestrator-session` skill — Triggers TODO updates as phases transition
- User conversations — Captures planning decisions as TODO items

## ADR Orchestration Discovery

The TODO tracker **must scan `.adr/orchestration/`** when creating or updating TODO.md. Each subfolder represents a build session with a `primary_task_list.md` containing phased tasks. The tracker:

1. Lists all session folders dynamically (never hardcoded)
2. Reads each `primary_task_list.md` to extract phase headings (`## Phase N — <title>`)
3. Checks phase completion status from checkbox counts (`[x]` vs `[ ]`)
4. Writes one line per phase into the appropriate TODO column, grouped under session headings
5. Includes a reference link to the full task list file for each session

This ensures the developer always has a quick-glance view of the full build pipeline alongside ad-hoc tasks.

## Key Design Decisions

- TODO.md is for the **human developer**, not for agents. One line per item, verb-first, no implementation details. Deep context lives in ADR docs and phase plans.
- ADR phases are summarized at phase level, not individual checkbox level. The task list link provides drill-down access.
