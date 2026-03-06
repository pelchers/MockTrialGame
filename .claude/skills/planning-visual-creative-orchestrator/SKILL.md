---
name: planning-visual-creative-orchestrator
description: Orchestrate visual/creative concept generation across 3 domains (data-vis, animation, graphic-design) with multiple styles per domain, dispatching isolated Claude Code Task agents per pass, then running Playwright visual validation.
---

# Planning Visual Creative Orchestrator

Use this skill to run multi-domain visual/creative concept generation with strict pass isolation and maximum variety.

## Config Source
- `.claude/skills/planning-visual-creative-orchestrator/references/style-config.json`

## Reference Catalogs
- `references/style-config.json` - Domain families, styles, passes, mock datasets
- `.claude/skills/visual-creative-subagent/references/library-catalog.json` - CDN library catalog

## Workflow
1. Read the style config to get all domains, styles per domain, and pass definitions.
2. Read the library catalog for CDN URLs and version info.
3. For each `(domain, style, pass)` job, build a comprehensive creative brief that includes:
   a. The domain type and style definition
   b. The palette for this specific pass
   c. The creative direction and scene description
   d. The library directive (which CDN library to use, with exact CDN URL from catalog)
   e. Mock data (for data-vis) from the `mockDatasets` section of style-config
   f. Anti-repeat constraints from prior passes
   g. The output directory path
   h. The quality standards from the subagent SKILL.md
   i. Dispatch as a Claude Code `Task` agent with `subagent_type=general-purpose`.
4. The Task agent generates ALL files from scratch.
5. After each pass completes, run the Playwright validation script:
   ```bash
   node .claude/skills/visual-creative-subagent/scripts/validate-visuals-playwright.mjs --pass-dir <passDir>
   ```
6. Verify screenshots exist (`validation/desktop/showcase.png` + `validation/report.playwright.json`).
7. After all passes complete, write summary index for review.

## Output Structure
```
.docs/design/concepts/
  data-vis/
    <chart-type>/pass-<n>/
      index.html, style.css, app.js, README.md
      validation/
        desktop/showcase.png
        mobile/showcase.png
        report.playwright.json
        handoff.json
  animation/
    <animation-style>/pass-<n>/
      (same structure)
  graphic-design/
    <design-style>/pass-<n>/
      (same structure)
```

## IMPORTANT: New Generations vs Edits

When the user asks for NEW generations:
- Scan existing pass folders per style to find the highest pass number
- Create NEW pass folders starting from the next number
- Each generation run produces `passesPerStyle` new passes (default: 2)
- Existing passes are preserved as-is

When the user asks for EDITS:
- Modify the specific pass folder they reference
- Re-run Playwright screenshots after editing

## Per-Pass Variety System

Each pass variant in the style config includes:
- **palette**: Different colors per pass, same style DNA
- **direction**: Different creative brief per pass
- **library**: May use different library per pass within the same style
- **antiRepeat**: Explicit ban list from prior passes
- **sceneDescription**: Detailed scene specification for animation/graphic passes

## Required Artifacts Per Pass
- `<domain>/<style>/pass-<n>/index.html` - Complete HTML with CDN tags
- `<domain>/<style>/pass-<n>/style.css` - Full CSS with responsive breakpoints
- `<domain>/<style>/pass-<n>/app.js` - Rendering, animation, interaction logic
- `<domain>/<style>/pass-<n>/README.md` - Concept docs, library usage
- `<domain>/<style>/pass-<n>/validation/handoff.json` - Domain/style metadata

## Required Visual Validation Artifacts
- `<domain>/<style>/pass-<n>/validation/desktop/showcase.png` — Screenshot at 1536x960
- `<domain>/<style>/pass-<n>/validation/mobile/showcase.png` — Screenshot at 390x844, 2x scale
- `<domain>/<style>/pass-<n>/validation/report.playwright.json` — Structured report

A pass is NOT considered complete until screenshots exist.

## Scripts
- `.claude/skills/visual-creative-subagent/scripts/validate-visuals-playwright.mjs` - Desktop + mobile screenshot capture

## Notes
- Libraries are domain/style-dependent, chosen by the orchestrator per the style config
- The subagent uses the exact CDN URL from the library catalog — no guessing
- Mock data for data-vis comes from the `mockDatasets` section of style-config.json
- `passesPerStyle` in config determines how many NEW passes to generate per run
