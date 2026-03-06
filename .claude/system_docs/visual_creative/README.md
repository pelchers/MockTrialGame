# Visual Creative Concept System

## Purpose

The visual creative system generates self-contained HTML showcase pages across three
creative domains: data visualization, animation, and graphic design. An orchestrator
dispatches isolated subagent jobs for each (domain, style, pass) combination, and each
subagent produces a browser-renderable page with CDN-loaded libraries and Playwright
validation screenshots.

## Domains

| Domain            | Focus                                        | Primary Libraries           |
|-------------------|----------------------------------------------|-----------------------------|
| `data-vis`        | Interactive charts, dashboards, statistics   | D3.js, Chart.js, ECharts, Vega-Lite |
| `animation`       | Motion graphics, physics, animated scenes    | GSAP, p5.js, Anime.js, Matter.js    |
| `graphic-design`  | Generative art, 3D renders, illustrations    | Three.js, p5.js, Paper.js, PixiJS   |

## Skill and Agent Locations

| Component                    | Path                                                                    |
|------------------------------|-------------------------------------------------------------------------|
| Orchestrator skill           | `.claude/skills/planning-visual-creative-orchestrator/SKILL.md`         |
| Orchestrator agent           | `.claude/agents/planning-visual-creative-orchestrator/AGENT.md`         |
| Orchestrator behavior ref    | `.claude/skills/planning-visual-creative-orchestrator/references/agent-behavior.md` |
| Style config                 | `.claude/skills/planning-visual-creative-orchestrator/references/style-config.json` |
| Subagent skill               | `.claude/skills/visual-creative-subagent/SKILL.md`                      |
| Subagent agent               | `.claude/agents/visual-creative-subagent/AGENT.md`                      |
| Subagent behavior ref        | `.claude/skills/visual-creative-subagent/references/agent-behavior.md`  |
| Library catalog              | `.claude/skills/visual-creative-subagent/references/library-catalog.json` |
| Playwright validation script | `.claude/skills/visual-creative-subagent/scripts/validate-visuals-playwright.mjs` |

## Output Structure

```
.docs/design/concepts/
  data-vis/
    <chart-type>/
      pass-<n>/
        index.html
        style.css
        app.js
        README.md
        validation/
          handoff.json
          desktop/showcase.png
          mobile/showcase.png
          report.playwright.json
  animation/
    <animation-style>/
      pass-<n>/
        (same file structure)
  graphic-design/
    <design-style>/
      pass-<n>/
        (same file structure)
```

## Generation Workflow

1. Orchestrator reads `style-config.json` for domains, styles, and pass definitions.
2. Orchestrator reads `library-catalog.json` for CDN URLs and version info.
3. For each `(domain, style, pass)` job, orchestrator builds a creative brief.
4. Orchestrator dispatches a Claude Code Task agent with the brief.
5. Subagent generates all files from scratch (no shared templates).
6. Subagent runs Playwright validation and reviews its own screenshots.
7. Orchestrator verifies screenshots exist.
8. After all passes, orchestrator writes a summary index.

## Key Rules

- Each pass produces **2 new passes per style** (configurable via `passesPerStyle`).
- New generations scan existing folders to find the highest pass number and increment.
- Existing passes are never overwritten during new generation runs.
- Edits to existing passes re-run Playwright screenshots after modification.

## Related Documentation

- [Domain Families](./domain-families.md) -- Styles, libraries, and mock datasets per domain
- [Validation Pipeline](./validation-pipeline.md) -- Playwright validation and self-correction loop
