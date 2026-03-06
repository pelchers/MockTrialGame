# Codex Project Guide

## Project-Agnostic Reference

### How Codex discovers instructions
- Codex loads **global** instructions from `~/.codex/AGENTS.override.md` or `~/.codex/AGENTS.md` (first non-empty file wins).
- Codex then walks from the repo root to the working directory, looking for `AGENTS.override.md`, then `AGENTS.md`, then any names in `project_doc_fallback_filenames`.
- `project_doc_max_bytes` limits how much is ingested per directory; large guidance should be split across nested directories if needed.
- **Note:** `CODEX.md` is not a default instruction filename unless it is listed in `project_doc_fallback_filenames`. If you want Codex to ingest this file automatically, add it to the fallback list in `~/.codex/config.toml`.

### Repo assets Codex can use
- `.codex/agents/` for specialized agents and subagents.
- `.codex/skills/` for reusable skills (task-level workflows).
- `.codex/commands/` for reusable command shortcuts.
- `.codex/hooks/` for lifecycle hooks.
- `.codex/rules/` for command allowlists.

### Orchestration loop (multi-phase tasks)
- For any primary task list with phases, use **longrunning-session** + **orchestrator-session**.
- Each phase must:
  - Start with a phase plan in `.adr/current/<SESSION>/phase_N.md`.
  - End with a review file in `.adr/history/<SESSION>/phase_N_review.md`.
  - Update task list checkboxes in `.adr/orchestration/<SESSION>/primary_task_list.md`.
  - Commit + push once validations pass.
- Orchestrator must "poke" the next subagent after each phase.

### CLI references
- Codex supports instruction discovery via `AGENTS.md` and fallback names, configurable in `~/.codex/config.toml`.
- Use `codex exec` for scripted subagent runs; it supports `--cd` and `--full-auto`.

## Conventions (This Repo)

### ADR lifecycle
- Phase files live in `.adr/current/<SESSION>/` during work.
- Completed phase files move to `.adr/history/<SESSION>/`.
- Each phase requires a review file with tree + summary + validations.

### Git workflow
- Commit after each phase completion.
- Push after each phase completion.
- Use HTTPS remotes only (no SSH).

### Testing
- Prefer Playwright for E2E flows.
- Include multi-role coverage (user, moderator, admin, owner) where relevant.
- Never force passing tests. Investigate failures, document causes, and fix for production readiness.

### Subagent spawning (required)
- Queue the next phase in `.codex/orchestration/queue/next_phase.json`.
- Use the Stop hook or manually run `powershell -NoProfile -ExecutionPolicy Bypass -File .codex/hooks/scripts/orchestrator-poke.ps1`.
- The hook executes `codex exec` and archives the queue file in `.codex/orchestration/history/`.
- If `agent` is set in the queue file, the hook prefixes the prompt with the agent file path.

## Project-Specific Guidance

Replace this section with project-specific goals, key paths, and active sessions when deploying this template to a new repo.
