# Codex repo configuration

This folder holds repo-scoped Codex assets and team config.

- `config.toml` sets repo defaults for Codex.
- `requirements.toml` enforces repo constraints for Codex.
- `rules/` contains command-allowlist rules for Codex.
- `agents/` contains repo-scoped agents and subagents.
- `commands/` contains repo-scoped commands.
- `hooks/` contains repo-scoped hooks.
- `skills/` contains Codex skills for this repository.
- The Claude reference source for corollary skills lives at:
  `<PROJECT_ROOT>/.claude`

## Longrunning Workflow Convention

For any multi-phase task list (ADR sessions, research, or implementation), always use the
longrunning orchestration loop:

- Launch the **longrunning-session** agent to own the phase plan and validations.
- Use the **orchestrator-session** agent to spawn one subagent per phase.
- Each phase ends with a review file, updates the task list status, and a commit/push.
- The orchestrator "pokes" the next subagent and continues until all phases complete.
