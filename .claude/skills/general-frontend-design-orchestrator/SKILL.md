---
name: general-frontend-design-orchestrator
description: Orchestrate adaptive frontend concept generation across user-defined styles and passes, dispatching isolated Claude Code Task agents per pass with comprehensive README specs.
agent: .claude/agents/general-frontend-design-orchestrator/agent.md
---

# General-Purpose Frontend Design Orchestrator

## Config Sources
- **User prompt**: Styles, passes per style, page structure, references, asset inclusions
- **Project docs**: `.docs/` — PRD, tech requirements, user stories, IA, wireframes
- **Existing concepts**: `.docs/design/concepts/` — prior generation output (globes, data-vis, etc.)
- **Library catalog**: `.claude/skills/general-frontend-design-subagent/references/library-catalog.json`
- **README template**: `.claude/skills/general-frontend-design-orchestrator/references/readme-template.md`

## Workflow

### Step 0: Context Discovery
1. Read the user's prompt to extract:
   - Style group names and descriptions
   - Number of passes per style (default: 2)
   - Page structure preferences (single-page, multi-page, hybrid)
   - Specific reference URLs or local asset paths
   - Application context / what the designs are for
2. Scan `.docs/` recursively for project documentation:
   - `**/*prd*`, `**/*requirement*`, `**/*spec*` — product/technical requirements
   - `**/*user-stor*`, `**/*persona*` — user stories and personas
   - `**/*sitemap*`, `**/*ia*`, `**/*architecture*` — information architecture
   - `**/repo-goals.md`, `**/planning/**` — project goals and planning docs
3. Scan `.docs/design/concepts/` for existing design assets (globes, illustrations, charts)
4. Scan `.docs/planning/concepts/` for existing frontend concept passes
5. Synthesize into a unified understanding:
   - What pages/sections the concepts need
   - What the target application does
   - What local assets are available for inclusion
   - What aesthetic direction the user wants

### Step 1: Generate Style Configuration
Based on the user's prompt, create an in-memory style configuration:
```json
{
  "conceptType": "<derived from prompt: websites, dashboards, portfolios, etc.>",
  "passesPerStyle": "<user-specified or default 2>",
  "pageStructure": "<single-page | multi-page | hybrid>",
  "styles": [
    {
      "id": "<slug>",
      "name": "<display name>",
      "description": "<aesthetic direction>",
      "passes": [
        {
          "pass": 1,
          "coreFlags": { ... },
          "referenceDirection": "<search direction hint>",
          "localInclusions": [ ... ]
        }
      ]
    }
  ],
  "applicationContext": { ... }
}
```

### Step 2: Assign Core Uniqueness Flags
For each pass within a style group, assign structurally divergent core flags:

| Flag | Purpose | Example Values |
|------|---------|---------------|
| `layoutArchetype` | Overall page skeleton | `sidebar-driven`, `top-bar-centered`, `full-bleed-immersive`, `split-pane`, `dashboard-grid`, `magazine-editorial` |
| `navigationModel` | How users navigate | `persistent-left-rail`, `sticky-top-bar`, `hamburger-drawer`, `bottom-tabs`, `breadcrumb-trail`, `floating-fab-menu` |
| `informationDensity` | Content spacing | `high-data-dense`, `medium-balanced`, `low-whitespace-generous` |
| `animationPhilosophy` | Motion approach | `subtle-micro-interactions`, `scroll-reveal-parallax`, `hover-expand-transform`, `continuous-ambient`, `page-transition-choreography` |
| `colorTemperature` | Palette application | `cool-dominant`, `warm-dominant`, `monochromatic`, `high-contrast-complementary`, `analogous-gradient` |

**Anti-convergence rule**: No two passes in the same style group may share the same value for ANY of these five flags.

### Step 3: Write README Specs
For each `(style, pass)` combination, write a README spec to the output directory:
`<outputRoot>/<style>/pass-<n>/README.md`

Follow the template at `.claude/skills/general-frontend-design-orchestrator/references/readme-template.md`.

### Step 4: Dispatch Subagents
For each pass, dispatch a Claude Code Task agent:
```
Task(
  subagent_type = "general-purpose",
  prompt = <comprehensive prompt including:
    - Full subagent skill instructions from SKILL.md
    - Path to the README spec
    - Output directory path
    - Library catalog path
    - Validation script path
    - Instruction to follow the 7-phase workflow
  >
)
```

Dispatch up to 4 subagents in parallel per batch. Wait for batch completion before dispatching the next batch.

### Step 5: Post-Generation Validation
After all subagents complete, verify each pass directory contains:
- [ ] `index.html` (and additional pages if multi-page)
- [ ] `style.css`
- [ ] `app.js`
- [ ] `README.md` (updated by subagent with uniqueness flags)
- [ ] `validation/handoff.json`
- [ ] `validation/report.playwright.json`
- [ ] `validation/desktop/showcase-viewport.png`
- [ ] `validation/mobile/showcase-viewport.png`

### Step 6: Summary Index
Write a summary table to the output root showing:
- Pass directory, style group, concept name
- Globe/asset source (if applicable)
- Validation status (pass/fail/manual-review)
- Key uniqueness flags

## Output Structure
```
.docs/design/concepts/<concept-type>/
├── <style-1>/
│   ├── pass-1/
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── app.js
│   │   ├── README.md
│   │   └── validation/
│   │       ├── handoff.json
│   │       ├── inspiration-crossreference.json
│   │       ├── report.playwright.json
│   │       ├── desktop/
│   │       └── mobile/
│   └── pass-2/
│       └── ...
├── <style-2>/
│   └── ...
└── summary-index.md
```

## New Generations vs Edits
- If the output directory already contains files, read them first
- If the user requests variants of existing passes, create new pass directories (e.g., `pass-1-v2`)
- Never overwrite existing passes without explicit user confirmation
- Variant passes should reference the original pass in their README spec

## Per-Pass Variety System

The orchestrator ensures variety through these mechanisms:

1. **Core flags**: Structural divergence (different skeletons)
2. **Reference directions**: Each subagent searches different design territories
3. **Local inclusion distribution**: Different passes get different local assets
4. **Content persona variance**: Each pass can have a different content voice (formal vs casual vs technical)
5. **Technology variance**: Different passes can use different animation libraries

## Scripts
- Playwright validation: `.claude/skills/general-frontend-design-subagent/scripts/validate-visuals-playwright.mjs`
  (Reuses the visual-creative-subagent's validation script if it exists, or create a new one)

## Notes
- The orchestrator acts as the quality gate — subagents handle creative execution
- If fewer than 2 styles are specified, suggest at least 2 to the user for comparative value
- If the user doesn't specify passes per style, default to 2
- The orchestrator should propose style groups if the user gives a vague aesthetic direction
