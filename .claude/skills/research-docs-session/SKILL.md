---
name: research-docs-session
description: Orchestrate research and documentation work with phase planning, validation, and archival.
---

## Purpose
Apply structured ADR orchestration to research + documentation sessions.

## Required steps
1) Align with the session primary task list and PRD.
2) Create or update phase plan before starting research work.
3) Capture sources, notes, and assets in the appropriate folders.
4) Validate citations and media references against source URLs.
5) Create a phase review file in history with file tree + technical summary.
6) Move completed phase plan to history and create the next phase plan.
7) Check off completed phases in the primary task list.
8) Commit and push all phase changes.

## Output requirements
- Phase plan with research tasks, validation steps, and deliverables.
- Documentation updates tied to the sitemap.
- Media references and local copies where allowed.
- Phase review file with file tree + technical summary.
- A structured "poke" back to the orchestrator.

## Templates
Use templates in `templates/` and references in `references/`.

## Remote handling
Do not hardcode repository remotes; use the repo's configured remote.
Use HTTPS remotes (not SSH) for pushes.
