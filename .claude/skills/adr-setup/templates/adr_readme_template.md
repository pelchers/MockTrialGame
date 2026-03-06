# ADR Workspace

This directory manages Architecture Decision Records and session orchestration for the project.

## Structure
- `orchestration/` — Permanent session-level documents (PRD, tech requirements, task lists, notes)
- `current/` — Active phase files for in-progress work
- `history/` — Completed phase plans and reviews (archived)
- `agent_ingest/` — Imported agent notes and external context

## Sessions
| # | Session | Status |
|---|---------|--------|
| 1 | [SESSION_NAME] | [planned/in_progress/complete] |

## Conventions
- Sessions use UPPERCASE_SNAKE_CASE with numeric prefix
- Phase files: `phase_N.md` (plan) and `phase_N_review.md` (review)
- Orchestration files are permanent; phase files move from current/ to history/ on completion
- See `.claude/skills/adr-setup/SKILL.md` for full convention reference
