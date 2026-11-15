---
name: general-frontend-design-orchestrator
description: Orchestrate adaptive, multi-surface frontend concept generation across user-defined styles, surfaces, and passes, dispatching isolated Claude Code Task agents per pass with comprehensive README specs.
agent: .claude/agents/general-frontend-design-orchestrator/agent.md
---

# General-Purpose Frontend Design Orchestrator

## Config Sources
- **User prompt**: Surfaces, styles, passes per style, page structure, references, asset inclusions
- **Project docs**: `.docs/`, `.adr/`, `.appdocs/`, `.ideas/` — PRD, tech requirements, user stories, IA, wireframes, feature specs
- **Existing concepts**: `.docs/design/concepts/`, `.docs/planning/concepts/` — prior generation output
- **Library catalog**: `.claude/skills/general-frontend-design-subagent/references/library-catalog.json`
- **README template**: `.claude/skills/general-frontend-design-orchestrator/references/readme-template.md`

## Workflow

### Step 0: Context Discovery
1. Read the user's prompt to extract:
   - **Surface(s)** to target (`website`, `vscode-extension`, `mobile-app`, `browser-extension`)
   - Style group names and descriptions
   - Number of passes per style (default: 2)
   - Page structure preferences (single-page, multi-page, hybrid) — overridden by surface constraints
   - Specific reference URLs or local asset paths
   - Application context / what the designs are for
2. Scan **all** project planning sources for view/feature discovery:
   - `.docs/` recursively: `**/*prd*`, `**/*requirement*`, `**/*spec*`, `**/*user-stor*`, `**/*persona*`, `**/*sitemap*`, `**/*ia*`, `**/*architecture*`, `**/planning/**`
   - `.adr/` — architecture decision records, session plans, feature breakdowns
   - `.appdocs/` — application-specific docs (subscriptions, workflows, etc.)
   - `.ideas/` — idea planning folders with feature specs
3. Scan `.docs/design/concepts/` for existing design assets (globes, illustrations, charts)
4. Scan `.docs/planning/concepts/` for existing frontend concept passes

### Step 0.5: Dynamic View Discovery
**CRITICAL: Never hardcode a view list.** Views are discovered from the project's own documentation.

1. From the planning files found in Step 0, extract every screen, panel, view, dialog, and workflow the application requires
2. Build a **master feature/view set** — the complete list of what the app does
3. For each requested surface, **adapt the master set**:
   - **Website**: Full feature set as pages/sections — dashboard, editor, projects, collaboration, settings, landing, auth, etc.
   - **VS Code Extension**: Map to webview panels, sidebar views, tree views, settings pages — only features that make sense inside an IDE
   - **Mobile App**: Map to tab screens with bottom nav — consolidate dense desktop views into mobile-appropriate screens
   - **Browser Extension**: Map to popup/sidebar/overlay — only quick-access features (capture, preview, send-to-workspace)
4. Write the surface-specific view list into each pass's README spec
5. If no planning files exist or views can't be determined, **ask the user** — do not guess or fall back to defaults

### Step 0.6: Modes, Roles and Mock Sign-in (default)
Every pass gets a review Mode switcher with a role picker and mock sign-in and sign-out (contract:
`.claude/skills/general-frontend-design-subagent/references/mode-switcher.md`). Work out the modes
once per run, from the same planning files, and write them into every README spec:

1. List every kind of person who uses the product (actors in user stories, personas, PRD roles, auth
   docs) and split each by sign-in state. Example from a dealership platform: Prospect (our marketing
   site), Dealer signed out, Dealer signed in, Shopper signed out, Shopper signed in, Platform admin.
2. For each signed-in mode, list the roles that change what the person sees or can do, with the
   docs' own role names. Example: Dealer signed in -> Owner, Manager, Salesperson, Detailer,
   Photographer. Note what each role sees first and what it cannot see (an Owner sees money and
   settings; a Detailer sees their detail jobs and no car costs).
3. For each mode, name its entry view, its sign-in view (signed-in modes) and the mode it signs out
   to; for each role, its home view.
4. Keep only the modes that apply on each surface (a phone app may drop the marketing prospect mode).
5. If the product has one kind of user and no sign-in, write "Single mode: no switcher" instead.
6. Every view a mode or role can reach must be in the view list: the switcher makes dead ends easy to
   find, so plan a mocked page, dialog or sheet for every link and button.
7. The table describes the product, not the style, so every pass in a run gets the same table.

### Step 1: Generate Style + Surface Configuration
Based on the user's prompt, create an in-memory configuration:
```json
{
  "surfaces": ["website", "vscode-extension", "mobile-app"],
  "passesPerStyle": 2,
  "styles": [
    {
      "id": "<slug>",
      "name": "<display name>",
      "description": "<aesthetic direction>",
      "surfaceAdaptations": {
        "website": { "density": "medium", "fontSizeFloor": "16px", "interactionModel": "hover+click" },
        "vscode-extension": { "density": "high", "fontSizeFloor": "13px", "interactionModel": "click-only", "themeBase": "dark" },
        "mobile-app": { "density": "low", "fontSizeFloor": "16px", "interactionModel": "touch", "tapTargetMin": "44px" },
        "browser-extension": { "density": "high", "fontSizeFloor": "13px", "interactionModel": "click-only" }
      }
    }
  ],
  "correlationGroups": [
    {
      "id": "<style>-<passNumber>",
      "style": "<style slug>",
      "passNumber": 1,
      "sharedIdentity": {
        "colorPalette": ["#hex1", "#hex2"],
        "typographyFamily": "<font pairing>",
        "visualMotifs": ["<motif1>", "<motif2>"],
        "brandElements": ["<element1>"],
        "iconStyle": "<style>"
      },
      "surfaces": ["website", "vscode-extension", "mobile-app"]
    }
  ],
  "viewsByPurface": {
    "website": ["<dynamically discovered views>"],
    "vscode-extension": ["<dynamically discovered views>"],
    "mobile-app": ["<dynamically discovered views>"]
  },
  "applicationContext": { }
}
```

### Step 2: Assign Core Uniqueness Flags
For each pass within a style group **on the same surface**, assign structurally divergent core flags:

| Flag | Purpose | Example Values |
|------|---------|---------------|
| `layoutArchetype` | Overall page skeleton | `sidebar-driven`, `top-bar-centered`, `full-bleed-immersive`, `split-pane`, `dashboard-grid`, `magazine-editorial` |
| `navigationModel` | How users navigate | `persistent-left-rail`, `sticky-top-bar`, `hamburger-drawer`, `bottom-tabs`, `breadcrumb-trail`, `floating-fab-menu` |
| `informationDensity` | Content spacing | `high-data-dense`, `medium-balanced`, `low-whitespace-generous` |
| `animationPhilosophy` | Motion approach | `subtle-micro-interactions`, `scroll-reveal-parallax`, `hover-expand-transform`, `continuous-ambient`, `page-transition-choreography` |
| `colorTemperature` | Palette application | `cool-dominant`, `warm-dominant`, `monochromatic`, `high-contrast-complementary`, `analogous-gradient` |

**Anti-convergence rule**: No two passes of the same style on the same surface may share the same value for ANY of these five flags.

**Surface-aware flag selection**: Some flags are more natural for certain surfaces:
- VS Code: `sidebar-driven` and `persistent-left-rail` are native; `full-bleed-immersive` is unusual
- Mobile: `bottom-tabs` and `hamburger-drawer` are native; `persistent-left-rail` rarely fits
- Browser extension: `dashboard-grid` rarely fits a 400x600 popup

### Step 3: Write README Specs
For each `(surface, style, pass)` combination, write a README spec to the output directory:
`.docs/planning/concepts/<surface>/<style>/pass-<n>/README.md`

Follow the template at `.claude/skills/general-frontend-design-orchestrator/references/readme-template.md`.

Include in each spec:
- The surface type and its constraints
- The dynamically discovered view list for that surface
- The correlation group identity (shared palette, typography, motifs)
- Surface-specific adaptation rules (density, font size floor, interaction model)
- The "Modes, Roles and Mock Sign-in" table from Step 0.6

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
    - Surface type
    - Correlation group identity
    - Path to references/mode-switcher.md and the instruction to build the Mode switcher, role
      picker and mock sign-in from the README's table
    - Instruction to follow the 7-phase workflow and to run validation with --strict
  >
)
```

Dispatch up to 4 subagents in parallel per batch. Wait for batch completion before dispatching the next batch.

**Recommended batching**: Group by surface (all website passes, then all extension passes, then all mobile passes) to simplify correlation review.

### Step 5: Post-Generation Validation
After all subagents complete, verify each pass directory contains:
- [ ] `index.html` (and additional view files if multi-page)
- [ ] `style.css`
- [ ] `app.js`
- [ ] `README.md` (updated by subagent with uniqueness flags)
- [ ] `validation/handoff.json`
- [ ] `validation/report.playwright.json`
- [ ] `validation/primary/showcase-viewport.png` (surface-appropriate primary viewport)
- [ ] `validation/secondary/showcase-viewport.png` (surface-appropriate secondary viewport)
- [ ] `validation/report.playwright.json` has `modeChecks` with no failures: the switcher is on every
      view and covers nothing, every mode and role opens from `?mode=<id>&role=<id>`, the sign-in form
      signs in and sign-out signs out
- [ ] `validation/modes/` has one screenshot per mode and role (open a few and check the role
      differences the README describes)

### Step 6: Cross-Surface Correlation Review
For multi-surface runs, verify correlation groups:
- Correlated passes share visual identity (palette, typography, motifs)
- Each surface's views were derived from planning files (not duplicated from another surface)
- Surface-specific constraints were respected (VS Code chrome, mobile safe areas, etc.)

### Step 7: Summary Index
Write a summary table to the output root showing:
- Pass directory, surface, style group, concept name
- Correlation group ID
- View count per surface
- Asset/inclusion source (if applicable)
- Validation status (pass/fail/manual-review)
- Key uniqueness flags
- How to start a view as each mode and role (`?mode=<id>&role=<id>`)

## Output Structure
```
.docs/planning/concepts/
├── <surface-1>/
│   ├── <style-1>/
│   │   ├── pass-1/
│   │   │   ├── index.html (+ view .html files)
│   │   │   ├── style.css
│   │   │   ├── app.js
│   │   │   ├── README.md
│   │   │   └── validation/
│   │   │       ├── handoff.json
│   │   │       ├── inspiration-crossreference.json
│   │   │       ├── report.playwright.json
│   │   │       ├── primary/
│   │   │       └── secondary/
│   │   └── pass-2/
│   │       └── ...
│   └── <style-2>/
│       └── ...
├── <surface-2>/
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

1. **Core flags**: Structural divergence (different skeletons) — within same surface
2. **Reference directions**: Each subagent searches different design territories
3. **Local inclusion distribution**: Different passes get different local assets
4. **Content persona variance**: Each pass can have a different content voice (formal vs casual vs technical)
5. **Technology variance**: Different passes can use different animation libraries
6. **Surface adaptation**: Same style adapts density, interaction model, and navigation per surface

## Scripts
- Playwright validation: `.claude/skills/general-frontend-design-subagent/scripts/validate-visuals-playwright.mjs`

## Notes
- The orchestrator acts as the quality gate — subagents handle creative execution
- If fewer than 2 styles are specified, suggest at least 2 to the user for comparative value
- If the user doesn't specify passes per style, default to 2
- The orchestrator should propose style groups if the user gives a vague aesthetic direction
- Views are ALWAYS discovered from project planning files — never hardcoded
- When generating for multiple surfaces, batch by surface for cleaner workflow
- The Mode switcher, role picker and mock sign-in are on by default; the user can turn them off for
  a run, and a single-mode product skips them
