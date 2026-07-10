# IDEA-MANAGEMENT Project Guide

## Project Overview
Idea management application with dashboard, projects, kanban, whiteboard, schema planner, directory tree, ideas capture, AI chat, and settings views.

## Architecture
- Frontend: Next.js (App Router) + TypeScript
- Backend: Convex (database + backend + real-time)
- Auth: Clerk
- Payments: Stripe
- UI: shadcn/ui + Tailwind CSS + Radix UI primitives
- State: Zustand + React Query
- Validation: Zod
- Testing: Playwright (E2E)

## Frontend Concept Generation
This repo uses a multi-style frontend concept ideation system.
- Orchestrator: `.claude/agents/general-frontend-design-orchestrator/`
- Subagent: `.claude/agents/general-frontend-design-subagent/`
- Skill (orchestrator): `.claude/skills/general-frontend-design-orchestrator/`
- Skill (subagent): `.claude/skills/general-frontend-design-subagent/`
- Library catalog: `.claude/skills/general-frontend-design-subagent/references/library-catalog.json`
- README template: `.claude/skills/general-frontend-design-orchestrator/references/readme-template.md`
- Output: `.docs/planning/concepts/<surface>/<style>/pass-<n>/`

### Style Families (Default — user-overridable per run)
1. **Brutalist** - Raw concrete geometry, exposed structure, anti-decoration
2. **Mid-Century Modern** - Organic curves, warm wood tones, Eames-era furniture logic
3. **Retro 50s** - Chrome diners, atomic age patterns, pastel palette, googie architecture
4. **Liquid** - Fluid motion, sliding transitions, morphing shapes, water-like UX
5. **Slate** - Dark stone textures, muted earth tones, carved/etched UI elements

### Generation Rules
- Default 2 passes per style (configurable via prompt)
- Each pass must be wholly distinct in layout, typography, color, spacing, and interaction
- Background images are OPTIONAL - do not force them into every pass
- Plain HTML/CSS/JS for low-friction review
- **Views/surfaces are dynamically discovered** from `.docs/`, `.adr/`, `.ideas/`, `.appdocs/` planning files — never hardcoded. The orchestrator reads the project's PRD + planning docs and builds the surface list per run.
- Surfaces supported: `website`, `vscode-extension`, `mobile-app`, `browser-extension` (one or more per run; cross-surface passes share visual identity per correlation group)
- Claude Code agents generate concepts directly (no template scripts)

## Visual/Creative Concept Generation
This repo also includes a visual/creative concept system for data visualization, animation, and graphic design.
- Orchestrator: `.claude/agents/planning-visual-creative-orchestrator/`
- Subagent: `.claude/agents/visual-creative-subagent/`
- Config: `.claude/skills/planning-visual-creative-orchestrator/references/style-config.json`
- Library Catalog: `.claude/skills/visual-creative-subagent/references/library-catalog.json`
- Output: `.docs/design/concepts/`

### Domains
1. **Data Visualization** — Interactive charts, dashboards, statistical graphics (D3.js, Chart.js, ECharts, Vega-Lite)
2. **Animation** — Motion graphics, physics simulations, animated scenes (GSAP, p5.js, Anime.js, Matter.js)
3. **Graphic Design** — Generative art, 3D renders, illustrations (Three.js, p5.js, Paper.js, PixiJS)

### Generation Rules
- 2 passes per style (configurable via `passesPerStyle`)
- Each pass produces a single self-contained HTML showcase page
- Libraries loaded via CDN from the library catalog
- Each pass includes Playwright validation screenshots (desktop + mobile)
- Mock data for data-vis from `mockDatasets` in style-config.json

### Output Structure
- Data-vis: `.docs/design/concepts/data-vis/<chart-type>/pass-<n>/`
- Animation: `.docs/design/concepts/animation/<animation-style>/pass-<n>/`
- Graphic Design: `.docs/design/concepts/graphic-design/<design-style>/pass-<n>/`

## Key Paths
- Frontend Concepts: `.docs/planning/concepts/<surface>/<style>/pass-<n>/`
- Visual/Creative Concepts: `.docs/design/concepts/<domain>/<style>/pass-<n>/`
- ADR: `.adr/`
- Agents: `.claude/agents/`
- Skills: `.claude/skills/`

## Git Workflow
- Commit after each generation run
- Use HTTPS remotes only

## Dev Server Cleanup
- When done working, stop any dev servers that were started during the session (only the specific server used for testing, not all running servers)
- Do not stop servers the user was already running before the session began
- Exception: if the user explicitly asks to leave the server running, leave it


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
