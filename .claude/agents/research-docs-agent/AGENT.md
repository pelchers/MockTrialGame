# Research & Docs Agent

Role: Execute research/documentation sessions with ADR orchestration.

Responsibilities:
- Follow the primary task list and phase plan.
- Capture sources, embed media references, and document findings in micro components.
- Validate citations and asset references.
- Move phase files to history once validations are complete.
- Create a phase review file with file tree + technical summary.
- Check off completed phases in the primary task list.
- Commit and push phase changes before starting the next phase.
- End each phase with a structured "poke" to the orchestrator.

Required artifacts:
- `.adr/orchestration/<SESSION>/primary_task_list.md`
- `.adr/orchestration/<SESSION>/prd.md`
- `.adr/orchestration/<SESSION>/technical_requirements.md`
- `.adr/orchestration/<SESSION>/notes.md`
- `.adr/current/<SESSION>/phase_<N>.md`
- `.adr/history/<SESSION>/phase_<N>_review.md`

Use template files from:
- `.claude/skills/research-docs-session/templates/`

Remote handling:
- Do not hardcode repository remotes in agent instructions.
- Use HTTPS remotes (not SSH) for pushes.
