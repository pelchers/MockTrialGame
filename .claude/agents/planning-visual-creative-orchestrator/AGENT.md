# Planning Visual Creative Orchestrator

Orchestrates visual/creative concept generation across three domains (data-vis, animation, graphic-design), dispatching isolated subagent jobs for each style and pass, then enforcing visual validation.

## How It Works in Claude Code
This orchestrator dispatches each (domain, style, pass) job as a **Claude Code Task agent** that generates visual concepts from scratch using its own creative judgment and the specified libraries.

## Required Inputs
- Style config: `.claude/skills/planning-visual-creative-orchestrator/references/style-config.json`
- Library catalog: `.claude/skills/visual-creative-subagent/references/library-catalog.json`
- Output root: `.docs/design/concepts`

## Three Domains

### Data Visualization (`data-vis`)
Styles are **chart/visualization types**: bar-chart, line-chart, treemap, network-graph, scatter-plot, sankey, radar, force-directed, sunburst, choropleth, etc.
Each pass renders the same mock dataset in a different visual treatment using the specified library.

### Animation (`animation`)
Styles are **motion techniques**: particle-systems, kinetic-typography, morphing-shapes, spring-physics, parallax-layers, wave-motion, orbit-dynamics, nature-scene, etc.
Each pass creates a different animated scene using the specified technique and library.

### Graphic Design (`graphic-design`)
Styles are **visual art approaches**: generative-geometry, bauhaus, isometric, globe-3d, landscape-scene, abstract-expressionist, minimalist-vector, retro-pixel, etc.
Each pass renders a different static or interactive visual composition.

## Mandatory Orchestration Rules
1. Read the style config to get domain families, styles per domain, and passes per style.
2. For each `(domain, style, pass)` combination, dispatch a separate Claude Code Task agent (subagent_type=general-purpose) with a comprehensive prompt containing:
   - The domain, style definition, palette, and creative direction
   - The library directive (which CDN library to use)
   - Mock data (for data-vis) or scene description (for animation/graphic-design)
   - Anti-repeat constraints from prior passes
   - The output directory path
   - Explicit instruction to generate ALL files from scratch
3. Each pass must produce a self-contained HTML page that renders in a browser.
4. Each pass MUST be visually distinct — different color treatment, different layout, different interaction approach.
5. After each subagent completes, run the Playwright screenshot capture script:
   ```bash
   node .claude/skills/visual-creative-subagent/scripts/validate-visuals-playwright.mjs --pass-dir <passDir>
   ```
6. After the Playwright script runs, verify screenshots exist: check for `validation/desktop/showcase.png` and `validation/report.playwright.json`. If either is missing, re-run. A pass without screenshots is INCOMPLETE.
7. Emit a summary index after generation.

## Output Structure
```
.docs/design/concepts/
  data-vis/
    <chart-type>/pass-<n>/
      index.html, style.css, app.js, README.md
      validation/desktop/showcase.png
      validation/mobile/showcase.png
      validation/report.playwright.json
      validation/handoff.json
  animation/
    <animation-style>/pass-<n>/
      (same structure)
  graphic-design/
    <design-style>/pass-<n>/
      (same structure)
```

## Validation Contract
- Each pass must have: `index.html`, `style.css`, `app.js`, `README.md`
- Each pass must have `validation/handoff.json` with domain/style metadata
- Each pass must have `validation/desktop/showcase.png`, `validation/mobile/showcase.png`, and `validation/report.playwright.json` — missing screenshots = INCOMPLETE
- Run the screenshot script: `node .claude/skills/visual-creative-subagent/scripts/validate-visuals-playwright.mjs --pass-dir <passDir>`

## IMPORTANT: New Generations vs Edits

When the user asks for NEW generations:
- Scan existing pass folders per style to find the highest pass number
- Create NEW pass folders starting from the next number
- Each generation run produces `passesPerStyle` new passes (default: 2)
- Existing passes are preserved as-is

When the user asks for EDITS:
- Modify the specific pass folder they reference
- Re-run Playwright screenshots after editing

## Mock Data for Data Visualization
The orchestrator provides realistic mock data to each data-vis subagent. Example datasets:
- **Project metrics**: {name, tasks_total, tasks_done, ideas_count, collaborators}
- **Timeline data**: {date, new_ideas, completed_tasks, active_users}
- **Category breakdown**: {category, count, percentage}
- **Network relationships**: {nodes: [{id, label, group}], edges: [{source, target, weight}]}

The data must align with the IDEA-MANAGEMENT product context (projects, ideas, kanban cards, etc.).
