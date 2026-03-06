# Frontend Planning System

Multi-style frontend concept generation system that produces fully navigable HTML/CSS/JS app mockups across distinct visual style families. Each concept is a complete 10-view application frontend generated from scratch by AI agents.

## System Purpose

Before building the real app, this system generates diverse frontend concept mockups that:
- Explore radically different visual directions for the same app
- Use real product terminology and data models (not arbitrary themed content)
- Are fully navigable single-page apps viewable in any browser
- Include automated screenshot validation for quality assurance

## Quick Links

| Document | Description |
|----------|-------------|
| [Architecture](architecture.md) | Orchestrator + subagent system design |
| [Style Families](style-families.md) | All visual style families and their variants |
| [Generation Workflow](generation-workflow.md) | Step-by-step how a generation run works |
| [Configuration Reference](configuration-reference.md) | All config files and their schemas |
| [Validation System](validation-system.md) | Screenshots, quality checks, uniqueness |

## Key Numbers

- **5 primary style families**: Brutalist, Mid-Century Modern, Retro 50s, Liquid, Slate
- **6 secondary style families**: Aurora Glass, Signal Brutalist, Industrial Terminal, Ledger Editorial, Playful Clay
- **2 passes per style per run**: Each run generates 10 new concepts (5 styles x 2)
- **10 views per pass**: Dashboard, Projects, Project Workspace, Kanban, Whiteboard, Schema Planner, Directory Tree, Ideas, AI Chat, Settings
- **4 required files per pass**: index.html, style.css, app.js, README.md
- **2 validation files per pass**: handoff.json, inspiration-crossreference.json

## Directory Layout

```
.claude/
  agents/
    planning-frontend-design-orchestrator/AGENT.md
    frontend-design-subagent/AGENT.md
  skills/
    planning-frontend-design-orchestrator/
      SKILL.md
      references/
        style-config.json              # Master style definitions
        layout-uniqueness-catalog.json  # 20 structural layout profiles
    frontend-design-subagent/
      SKILL.md
      references/
        product-context.md              # App PRD content layer
        external-inspiration-catalog.json
        available-libraries.json
        asset-sources.json
      scripts/
        validate-concepts-playwright.mjs
  system_docs/
    frontend_planning/                  # (this documentation)

.docs/planning/concepts/               # Generated output
  <style>/pass-<N>/
    index.html
    style.css
    app.js
    README.md
    validation/
      handoff.json
      inspiration-crossreference.json
      desktop/<view>.png
      mobile/<view>.png
```

## Two-Layer Content System

The system separates **what content says** from **how it looks**:

1. **Product Context** (`product-context.md`) - Immutable layer defining real app terminology, data models, view content requirements, and sample data. Every pass uses the same product vocabulary.

2. **Content Persona** (per-pass in `style-config.json`) - Visual tone and metaphor that shapes how the design feels. Each pass has a unique persona within its style family.

Example: If the app is an idea management platform and the persona is "brutalist warehouse":
- The kanban board still says "Backlog / In Progress / Review / Done" (from product context)
- The cards still reference real projects like "Wavz.fm Music Platform" (from product context)
- But the UI uses corrugated steel textures, barcode labels, and stencil fonts (from persona)
