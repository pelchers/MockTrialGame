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

### Dev server cleanup
- When done working, stop any dev servers that were started during the session (only the specific server used for testing, not all running servers).
- Do not stop servers the user was already running before the session began.
- Exception: if the user explicitly asks to leave the server running, leave it.

### Subagent spawning (required)
- Queue the next phase in `.codex/orchestration/queue/next_phase.json`.
- Use the Stop hook or manually run `powershell -NoProfile -ExecutionPolicy Bypass -File .codex/hooks/scripts/orchestrator-poke.ps1`.
- The hook executes `codex exec` and archives the queue file in `.codex/orchestration/history/`.
- If `agent` is set in the queue file, the hook prefixes the prompt with the agent file path.

## Project-Specific Guidance

Replace this section with project-specific goals, key paths, and active sessions when deploying this template to a new repo.

## Confirm Before Acting Convention
- When the user says "confirm request", "confirm reasoning", "confirm before proceeding", or similar phrasing, it means: **present your understanding of the request in chat and wait for explicit approval before taking any action.**
- This is a per-instance instruction — it applies only to that specific interaction, not permanently. Once the user approves, proceed normally.
- Do NOT change any settings, modes, or permissions. Simply pause, explain what you plan to do, and wait for a "yes", "proceed", "approved", or similar confirmation.
- If the user says "reconfirm request", repeat your understanding again for a second review before acting.


## Completion Convention
- When tasked with implementing features, plans, or scoped work — complete ALL items in the defined scope. Do not defer remaining tasks to "next session" unless the user explicitly asks to stop or split the work.
- Go out of the way to perform additional testing, research, and validation to assure best practices are met and exceeded. Validation (build checks, Playwright tests, screenshots) is part of completing work, not a separate optional step.
- This applies to agent-defined scopes of work as well — agents must finish what they start, not leave partial implementations.
- Exception: If a dependency is missing (e.g., API keys not yet provided), or a blocking issue requires user input, document what's blocked and why — but complete everything that can be completed.

<!-- BEGIN device-sync-and-handoff convention (managed; append idempotently — do not duplicate) -->
## Device Sync & Handoff Convention (Required)
- **Multi-device repo** (home-desktop ⇄ asus-laptop). BOTH devices commit to their own **working lane**
  (`Home-Work` / `Asus-Work`, resolved from `device.local.md`). **`main` = handoff + savepoint + stable +
  deployment/prod** — NOT a daily lane; it is synced to your working lane only at wind-down.
- **START of work → `/pickup`** (skill `device-sync-protocol`): `git fetch` all lanes, determine the
  most-forward-*appropriate* state (ADR/planning/`HANDOFF.md`-informed, not raw commit count), adopt it
  into your working branch (`--ff-only` / `pull --rebase`; STOP + ask if lanes truly diverged — never
  force-push, never discard a lane), then read the newest `HANDOFF.md` entry + status board before working.
  The SessionStart banner flags when a device/`main` is ahead.
- **END of work → `/winddown`**: commit to your lane → prepend a `HANDOFF.md` entry (append-only,
  per-device) → update chat-history + status board → `git push origin <Device>-Work` then
  `git push origin <Device>-Work:main` (fast-forward only) → optional `/savepoint` at a milestone.
- Full protocol: `.docs/runbooks/development/device-sync-and-handoff-protocol.md`. Log: `HANDOFF.md`.
<!-- END device-sync-and-handoff convention -->
