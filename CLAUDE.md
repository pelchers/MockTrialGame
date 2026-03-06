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
- Orchestrator: `.claude/agents/planning-frontend-design-orchestrator/`
- Subagent: `.claude/agents/frontend-design-subagent/`
- Config: `.claude/skills/planning-frontend-design-orchestrator/references/style-config.json`
- Output: `.docs/planning/concepts/`

### Style Families (Current)
1. **Brutalist** - Raw concrete geometry, exposed structure, anti-decoration
2. **Mid-Century Modern** - Organic curves, warm wood tones, Eames-era furniture logic
3. **Retro 50s** - Chrome diners, atomic age patterns, pastel palette, googie architecture
4. **Liquid** - Fluid motion, sliding transitions, morphing shapes, water-like UX
5. **Slate** - Dark stone textures, muted earth tones, carved/etched UI elements

### Generation Rules
- 2 passes per style = 10 total concept passes
- Each pass must be wholly distinct in layout, typography, color, spacing, and interaction
- Background images are OPTIONAL - do not force them into every pass
- Plain HTML/CSS/JS for low-friction review
- Each pass covers all 10 app views (dashboard through settings)
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
- Frontend Concepts: `.docs/planning/concepts/<style>/pass-<n>/`
- Visual/Creative Concepts: `.docs/design/concepts/<domain>/<style>/pass-<n>/`
- ADR: `.adr/`
- Agents: `.claude/agents/`
- Skills: `.claude/skills/`

## Git Workflow
- Commit after each generation run
- Use HTTPS remotes only
