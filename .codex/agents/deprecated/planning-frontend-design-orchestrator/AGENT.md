# Planning Frontend Design Orchestrator

Orchestrates style-configured frontend concept generation by dispatching isolated subagent jobs for each style and pass, then enforcing visual validation.

## How It Works in Claude Code
Unlike the Codex version which relied on PowerShell template scripts to generate boilerplate HTML, this orchestrator dispatches each (style, pass) job as a **Claude Code Task agent** that generates concepts from scratch using its own creative judgment. This eliminates the template sameness problem.

## Required Inputs
- Style config: `.claude/skills/planning-frontend-design-orchestrator/references/style-config.json`
- Output root: `.docs/planning/concepts`
- Uniqueness catalog: `.claude/skills/planning-frontend-design-orchestrator/references/layout-uniqueness-catalog.json`
- Inspiration catalog: `.claude/skills/frontend-design-subagent/references/external-inspiration-catalog.json`
- Product context: `.claude/skills/frontend-design-subagent/references/product-context.md`

## Mandatory Orchestration Rules
1. Read the style config to get style families and passes per style.
2. For each `(style, pass)` combination, dispatch a separate Claude Code Task agent (subagent_type=general-purpose) with a comprehensive prompt containing:
   - The style definition, palette, and design direction
   - The uniqueness profile (shell, nav, flow, scroll, motion, etc.)
   - Inspiration references for that specific pass
   - The **product context** (data models, terminology, content vocabulary) — all mock content must align with the real app PRD
   - The output directory path
   - Explicit instruction to generate ALL files from scratch (no templates)
3. Each pass must produce a fully navigable app frontend covering all required views.
4. Each pass MUST be visually and structurally distinct - different layout architecture, different typography choices, different spacing rhythm, different component shapes, different color application.
5. Background images are OPTIONAL. Not every pass needs one. Use them only when they genuinely enhance the aesthetic (e.g., a concrete texture for brutalist, a starfield for retro 50s). Many passes should rely purely on CSS gradients, patterns, or solid color.
6. Run uniqueness validation across all generated passes after completion.
7. Emit a summary index after generation.

## Required Page Views Per Pass
- Dashboard
- Projects / Drive View
- Project Workspace
- Kanban
- Whiteboard
- Schema Planner
- Directory Tree
- Ideas
- AI Chat
- Settings

## Key Differences from Codex Version
- **No template script**: Each pass is generated fresh by the AI agent, not stamped from `generate-concept.ps1`
- **No mandatory background images**: `requireDownloadedMedia` is false by default
- **No mandatory three.js/gsap**: Animation libraries are style-dependent, not forced
- **Agent-driven uniqueness**: The orchestrator writes a detailed creative brief per pass that ensures structural divergence, rather than relying on CSS class token rotation
- **Claude Code Task agents**: Uses `Task` tool with `subagent_type=general-purpose` for parallel dispatch

## Validation Contract
- Run uniqueness validation script after generation
- Each pass must have: `index.html`, `style.css`, `app.js`, `README.md`
- Each pass must have `validation/handoff.json` with style metadata
- Each pass must have `validation/inspiration-crossreference.json`
