# General Frontend Design System

System documentation for the general-purpose frontend concept generation agents and skills.

## Purpose

Generates multiple divergent frontend concept passes across user-defined styles. Each pass is a complete, standalone HTML/CSS/JS prototype with its own visual identity, layout, and interaction design. Used for design exploration and aesthetic direction discovery.

## Architecture

```
┌──────────────────────────────────────────────┐
│   General Frontend Design Orchestrator       │
│   (Style Parser / Spec Writer / Dispatcher)  │
├──────────────────────────────────────────────┤
│  Parses user prompt for styles + passes      │
│  Builds README spec per pass                 │
│  Enforces anti-convergence (unique flags)    │
│  Dispatches parallel subagents (up to 4)     │
│  Runs post-generation validation             │
└──────┬──────┬──────┬──────┬──────────────────┘
       │      │      │      │
       ▼      ▼      ▼      ▼
  ┌──────┐┌──────┐┌──────┐┌──────┐
  │Sub 1 ││Sub 2 ││Sub 3 ││Sub 4 │  (parallel)
  └──────┘└──────┘└──────┘└──────┘
  Each generates one concept pass from scratch
```

## Key Concepts

### Anti-Convergence System

No two passes within the same style group share:
- Layout archetype (sidebar-driven, full-bleed-immersive, dashboard-grid, etc.)
- Navigation model (persistent-left-rail, floating-fab-menu, hamburger-drawer, etc.)

The orchestrator assigns unique core flags to each pass before dispatching.

### Two-Tier Uniqueness Flags

**Orchestrator-assigned (structural):**
- Layout archetype
- Navigation model
- Information density
- Animation philosophy
- Color temperature

**Subagent-assigned (creative):**
- Typography pairing
- Grid system
- Interaction signature
- Visual motif
- Spacing rhythm
- Micro-interaction style
- Content hierarchy treatment

### Directed Reference Discovery

The orchestrator provides thematic search hints (not URLs). The subagent uses WebSearch to find actual reference sites and documents what patterns it adapted from each.

## Workflow

1. User provides style(s) and number of passes
2. Orchestrator writes README spec per pass with unique core flags
3. Orchestrator dispatches subagents (up to 4 in parallel per batch)
4. Each subagent: plans → validates CDNs → generates → validates with Playwright → reviews → fixes → completes
5. Orchestrator validates all passes have 20 required files
6. Summary index written

## Output Per Pass (20 files)

- 10 HTML pages (or 1 for single-page concepts)
- `style.css` (shared)
- `app.js` (shared)
- `README.md` (updated with subagent flags)
- `validation/handoff.json`
- `validation/inspiration-crossreference.json`
- `validation/report.playwright.json`
- `validation/desktop/showcase.png` + `showcase-viewport.png`
- `validation/mobile/showcase.png` + `showcase-viewport.png`

## Agent & Skill Locations

| Component | Claude Path | Codex Path |
|-----------|-------------|------------|
| Orchestrator Agent | `.claude/agents/general-frontend-design-orchestrator/agent.md` | `.codex/agents/general-frontend-design-orchestrator/AGENT.md` |
| Orchestrator Skill | `.claude/skills/general-frontend-design-orchestrator/SKILL.md` | `.codex/skills/general-frontend-design-orchestrator/SKILL.md` |
| README Template | `.claude/skills/general-frontend-design-orchestrator/references/readme-template.md` | `.codex/skills/general-frontend-design-orchestrator/references/readme-template.md` |
| Subagent Agent | `.claude/agents/general-frontend-design-subagent/agent.md` | `.codex/agents/general-frontend-design-subagent/AGENT.md` |
| Subagent Skill | `.claude/skills/general-frontend-design-subagent/SKILL.md` | `.codex/skills/general-frontend-design-subagent/SKILL.md` |
| Library Catalog | `.claude/skills/general-frontend-design-subagent/references/library-catalog.json` | `.codex/skills/general-frontend-design-subagent/references/library-catalog.json` |
| Validation Script | `.claude/skills/general-frontend-design-subagent/scripts/validate-visuals-playwright.mjs` | `.codex/skills/general-frontend-design-subagent/scripts/validate-visuals-playwright.mjs` |

## Comparison with Production Agent

| Aspect | General Agent | Production Agent |
|--------|--------------|-----------------|
| Purpose | Explore many visual directions | Build one production frontend |
| Passes | Multiple (2-8 per style) | Single build |
| Data | Generic mock | Schema-shaped with confidence levels |
| Discovery | None (reads spec only) | Full repository search |
| Components | Monolithic HTML | Boundary-marked for extraction |
| Iteration | Not supported | Delta-based iteration |
