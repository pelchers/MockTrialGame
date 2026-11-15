# General Frontend Design — Usage Guide

## Quick Start

### Generate Concepts for a New Project
```
User: "Generate frontend concepts for a dashboard app with 5 style families, 2 passes each"
```
The orchestrator reads `style-config.json`, creates specs for each pass, and dispatches subagents.

### Generate Concepts for an Existing Project
```
User: "Generate brutalism and liquid style concepts for the campus app using the existing views"
```
The orchestrator reads existing page views from the config and generates concepts within those constraints.

## How It Works

### 1. Style Configuration
Styles are defined in `.claude/skills/planning-frontend-design-orchestrator/references/style-config.json`:
- Each style family has: name, description, color palette, typography, spacing rules
- Passes per style are configurable (`passesPerStyle`)
- Each pass must be wholly distinct in layout, typography, color, spacing, and interaction

### 2. Orchestrator Dispatches Subagents
The orchestrator creates one Claude Code Task agent per pass:
- Each subagent gets a comprehensive README spec
- Subagent works in isolation — no shared state between passes
- Each pass covers all app views (typically 10)

### 3. Subagent Generates a Complete Prototype
Each subagent produces:
- Plain HTML/CSS/JS files (no build tools needed)
- Responsive design (desktop + mobile)
- Interactive elements (hover states, transitions, mock data)
- Playwright validation screenshots

### 4. Output Structure
```
.docs/planning/concepts/<style>/pass-<n>/
├── index.html
├── style.css
├── app.js
├── screenshots/
│   ├── desktop-home.png
│   └── mobile-home.png
└── README.md
```

## Key Rules
- Background images are OPTIONAL — don't force them into every pass
- 2 passes per style by default (configurable)
- Each pass must be visually distinct from other passes of the same style
- Plain HTML/CSS/JS only — no frameworks, no build tools
- Each pass covers all app views defined in the config

## Style Families (Default)
1. **Brutalist** — Raw concrete geometry, exposed structure, anti-decoration
2. **Mid-Century Modern** — Organic curves, warm wood tones, Eames-era furniture logic
3. **Retro 50s** — Chrome diners, atomic age patterns, pastel palette
4. **Liquid** — Fluid motion, sliding transitions, morphing shapes
5. **Slate** — Dark stone textures, muted earth tones, carved/etched UI

## Components

| Component | Path | Purpose |
|---|---|---|
| Orchestrator Skill | `.claude/skills/planning-frontend-design-orchestrator/` | Style parsing, spec creation, subagent dispatch |
| Subagent Skill | `.claude/skills/general-frontend-design-subagent/` | Single pass generation with Playwright validation |
| Style Config | `.claude/skills/planning-frontend-design-orchestrator/references/style-config.json` | Style definitions and view list |
| Output | `.docs/planning/concepts/<style>/pass-<n>/` | Generated concept files |

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
