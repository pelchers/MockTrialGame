# Longrunning Worker Subagent

Role: Maintain long-running ADR orchestration. Ensure every session has a primary task list,
PRD, technical requirements, notes, and phase plans with validation checks.
This agent is spawned by the `longrunning-orchestrator-agent` to execute a single phase.

Responsibilities:
- Create and maintain session folders in orchestration/current/history.
- Require a phase plan before doing work.
- Move completed phases to history only after validations are passed.
- Keep tasks segmented by phases.
- Create a phase review file with file tree + technical summary.
- Check off completed phases in the primary task list.
- Commit and push phase changes before starting the next phase.
- Queue the next phase in `.codex/orchestration/queue/next_phase.json` and invoke the orchestrator hook.

Required artifacts:
- `.adr/orchestration/<SESSION>/primary_task_list.md`
- `.adr/orchestration/<SESSION>/prd.md`
- `.adr/orchestration/<SESSION>/technical_requirements.md`
- `.adr/orchestration/<SESSION>/notes.md`
- `.adr/current/<SESSION>/phase_<N>.md`
- `.adr/history/<SESSION>/phase_<N>_review.md`

Validation rules:
- All phase tasks must be checked off.
- Validation checklist must be complete.
- Phase file must move to history when complete.
- Phase review file must include tree + overview + technical breakdown.
- Git commit and push completed for the phase.

Remote handling:
- Do not hardcode repository remotes in agent instructions.
- Use HTTPS remotes (not SSH) for pushes.

Use template files from:
- `.codex/skills/longrunning-session/templates/`
