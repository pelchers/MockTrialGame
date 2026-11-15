# General Frontend Design — Usage Guide

## Quick Start

### Generate Concepts for a Specific Surface
```
User: "Generate frontend concepts for a dashboard app on the website surface with 5 style families, 2 passes each"
```
The orchestrator discovers views from project planning files, reads `style-config.json`, creates specs for each pass targeting the `website` surface, and dispatches subagents.

### Generate Concepts Across Multiple Surfaces
```
User: "Generate brutalism and liquid concepts for both website and vscode-extension surfaces, 2 passes each"
```
The orchestrator creates correlated passes across surfaces — each correlation group shares palette, typography, and motifs while diverging structurally to fit each surface.

### Generate Concepts for an Existing Project
```
User: "Generate brutalism and liquid style concepts for the campus app on mobile-app surface using the existing views"
```
The orchestrator discovers views from project planning files (`.docs/`, `.adr/`, `.appdocs/`, `.ideas/`) and generates concepts within those constraints for the mobile-app surface with appropriate shell chrome.

### Generate for Browser Extension
```
User: "Generate slate style concepts for the browser-extension surface, 2 passes"
```
The subagent renders within popup/sidebar chrome at extension-appropriate viewports (400x600 popup, 320x500 sidebar).

## How It Works

### 1. Dynamic View Discovery
The orchestrator scans project planning files to discover views:
- `.docs/` — Planning docs, feature specs, view lists
- `.adr/` — Architecture decisions referencing views/features
- `.appdocs/` — App documentation, user stories, screen inventories
- `.ideas/` — Idea logs referencing proposed views

Views are never hardcoded. The discovered view set is included in each subagent's README spec. View count varies per project.

### 2. Style Configuration
Styles are defined in `.claude/skills/planning-frontend-design-orchestrator/references/style-config.json`:
- Each style family has: name, description, color palette, typography, spacing rules
- Passes per style are configurable (`passesPerStyle`)
- Each pass must be wholly distinct in layout, typography, color, spacing, and interaction

### 3. Surface Routing
The orchestrator routes the target surface to each subagent:
- **website** — Standard browser chrome, desktop + mobile viewports
- **vscode-extension** — IDE chrome mockup (sidebar, activity bar, status bar), IDE + compact viewports
- **mobile-app** — System bars + bottom nav, phone + tablet viewports
- **browser-extension** — Popup/sidebar chrome, popup + sidebar viewports

### 4. Cross-Surface Correlation
When generating for multiple surfaces in one run, correlated passes share visual identity:
- Shared: palette, typography, visual motifs
- Divergent: layout structure, navigation model, shell chrome treatment
- Correlation tracked in `handoff.json` under `correlationGroup`

### 5. Orchestrator Dispatches Subagents
The orchestrator creates one Claude Code Task agent per pass:
- Each subagent gets a comprehensive README spec with surface type and discovered views
- Subagent works in isolation — no shared state between passes
- Each pass covers all discovered views with surface-appropriate chrome

### 6. Subagent Generates a Complete Prototype
Each subagent produces:
- Plain HTML/CSS/JS files (no build tools needed)
- Surface-appropriate shell chrome and responsive design
- Interactive elements (hover states, transitions, mock data)
- Playwright validation screenshots at surface-specific viewports

### 7. Output Structure
```
.docs/planning/concepts/<surface>/<style>/pass-<n>/
├── index.html
├── [view].html × N          # One per discovered view
├── style.css
├── app.js
├── validation/
│   ├── primary/
│   │   └── showcase.png
│   └── secondary/
│       └── showcase.png
└── README.md
```

Screenshot directories use `primary/` and `secondary/` instead of `desktop/` and `mobile/` since viewport meaning varies by surface.

## Key Rules
- Background images are OPTIONAL — don't force them into every pass
- 2 passes per style by default (configurable)
- Each pass must be visually distinct from other passes of the same style
- Plain HTML/CSS/JS only — no frameworks, no build tools
- Views are discovered dynamically from project planning files — never hardcoded
- Each surface gets appropriate shell chrome (IDE chrome for VS Code, system bars for mobile, etc.)
- Correlated passes across surfaces share visual identity but diverge structurally
- Supported surfaces: `website`, `vscode-extension`, `mobile-app`, `browser-extension`

## Style Families (Default)
1. **Brutalist** — Raw concrete geometry, exposed structure, anti-decoration
2. **Mid-Century Modern** — Organic curves, warm wood tones, Eames-era furniture logic
3. **Retro 50s** — Chrome diners, atomic age patterns, pastel palette
4. **Liquid** — Fluid motion, sliding transitions, morphing shapes
5. **Slate** — Dark stone textures, muted earth tones, carved/etched UI

## Components

| Component | Path | Purpose |
|---|---|---|
| Orchestrator Skill | `.claude/skills/planning-frontend-design-orchestrator/` | Style parsing, surface routing, view discovery, spec creation, subagent dispatch |
| Subagent Skill | `.claude/skills/general-frontend-design-subagent/` | Single pass generation with surface-appropriate chrome and Playwright validation |
| Style Config | `.claude/skills/planning-frontend-design-orchestrator/references/style-config.json` | Style definitions |
| Output | `.docs/planning/concepts/<surface>/<style>/pass-<n>/` | Generated concept files (surface in path) |

## Review a Pass as Each Kind of User

Every pass has a "Mode" control (bottom-right by default) with the product's modes and, for each
signed-in mode, a role select. Passes open signed out, so you can also sign up or sign in through the
pass's own forms (any details work) and sign out again.

Start a view in a given state with URL parameters:
```
index.html?mode=prospect                         first visit, signed out
app-board.html?mode=dealer&role=detailer         signed in as a detailer
dealer-account.html?mode=shopper                 a signed-in shopper
```
Scripts can use `window.mockAuth.state()`, `signIn(mode, role)`, `signOut()` and `reset()`.

Run the validation script with `--strict` to fail on any switcher, role or sign-in problem:
```
node validate-visuals-playwright.mjs --pass-dir <pass dir> --surface website --strict
```
Results: `validation/report.playwright.json` (`modeChecks`) and `validation/modes/*.png`.
