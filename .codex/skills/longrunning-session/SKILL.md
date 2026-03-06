---
name: longrunning-session
description: Orchestrate long-running sessions with phase planning, validation, and archival.
---

## Purpose
Enforce the ADR orchestration workflow for long-running sessions.

## Required steps (every session)
1) Ensure the session folder exists in orchestration/current/history.
2) Create or update primary task list, PRD, technical requirements, and notes in orchestration.
3) Create a phase plan in `current/` before starting work.
4) Execute tasks in that phase file.
5) Validate every item listed in the phase file.
6) Create a phase review file in `history/` with file tree + technical summary.
7) Move the phase file to `history/` when complete.
8) Check off the completed phase in the primary task list.
9) Commit and push all phase changes.
10) Create the next phase file before starting new work.

## Subagent handoff
- After completing a phase, queue the next phase in `.codex/orchestration/queue/next_phase.json`.
- Use the orchestrator poke hook to spawn the next Codex exec session.
- If an agent name is provided, the orchestrator prefixes the prompt with the agent file path.

## Output requirements
- `primary_task_list.md`
- `prd.md`
- `technical_requirements.md`
- `notes.md`
- `phase_<N>.md`
- `phase_<N>_review.md`

## Templates
Use templates in `templates/` for every file type.

## Safety
If access is missing or unclear, stop and request clarification before executing.

## Testing policy
- Never force passing tests. Investigate failures, document causes, and fix for production readiness.

## Remote handling
Do not hardcode repository remotes; use the repo's configured remote.
Use HTTPS remotes (not SSH) for pushes.
