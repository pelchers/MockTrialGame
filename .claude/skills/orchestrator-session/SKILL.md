---
name: orchestrator-session
description: Run the orchestration loop for multi-phase sessions, spinning up a new subagent per phase.
---

## Purpose
Manage a long-running session by delegating each phase to a new subagent, while the current
chat acts as the orchestrator.

## Orchestrator loop
1) Read the previous phase review and current phase plan.
2) Spawn a new subagent for the phase.
3) Require a "poke" back with:
   - Completed tasks summary
   - Files changed (tree snippet)
   - Validation results
   - Commit + push confirmation
   - Next-phase readiness
4) Update primary task list phase status and prepare the next phase plan.

## Phase kickoff
- Each phase begins with a brief review of the previous phase review.

## Required outputs
- Phase review file with tree + technical breakdown.
- Phase plan moved to history after validation.
- Commit and push per phase (HTTPS remote).

## Testing policy
- Never force passing tests. Investigate failures, document causes, and fix for production readiness.

## Subagent spawning (Claude exec)
Use the orchestration queue + hook to spawn subagents:
1) Write `.claude/orchestration/queue/next_phase.json`
2) Set `autoSpawn: true` (and `dryRun: false` for real execution)
3) Run `powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/scripts/orchestrator-poke.ps1`
4) The hook runs `claude exec` with the provided prompt and moves the queue file to history.
5) If `agent` is set in the queue file, the hook prefixes the prompt with the agent file path.

## Templates
Use templates in `templates/` and references in `references/`.

## Remote handling
- Use HTTPS remotes (not SSH) for pushes.
- Do not hardcode repository remotes.
