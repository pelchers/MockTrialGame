# General Frontend Design System

System documentation for the general-purpose frontend concept generation agents and skills.

## Purpose

Generates multiple divergent frontend concept passes across user-defined styles and surfaces. Each pass is a complete, standalone HTML/CSS/JS prototype with its own visual identity, layout, and interaction design. Supports multiple target surfaces (website, VS Code extension, mobile app, browser extension) with surface-appropriate shell chrome, viewports, and structural conventions. Used for design exploration and aesthetic direction discovery.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│   General Frontend Design Orchestrator               │
│   (Style Parser / Surface Router / Spec Writer /     │
│    View Discovery / Dispatcher)                      │
├──────────────────────────────────────────────────────┤
│  Parses user prompt for styles + surfaces + passes   │
│  Discovers views from project planning files         │
│  Builds README spec per pass with surface context    │
│  Enforces anti-convergence (unique flags)            │
│  Groups correlated passes across surfaces            │
│  Dispatches parallel subagents (up to 4)             │
│  Runs post-generation validation                     │
└──────┬──────┬──────┬──────┬──────────────────────────┘
       │      │      │      │
       ▼      ▼      ▼      ▼
  ┌──────┐┌──────┐┌──────┐┌──────┐
  │Sub 1 ││Sub 2 ││Sub 3 ││Sub 4 │  (parallel)
  └──────┘└──────┘└──────┘└──────┘
  Each generates one concept pass for a specific surface
```

## Surface Types

| Surface | Shell Chrome | Primary Viewport | Secondary Viewport |
|---------|-------------|-----------------|-------------------|
| `website` | Standard browser chrome | 1440×900 (desktop) | 390×844 (mobile) |
| `vscode-extension` | IDE chrome mockup (sidebar, activity bar, status bar) | 1280×800 (IDE) | 800×600 (compact) |
| `mobile-app` | System bars + bottom nav | 390×844 (phone) | 768×1024 (tablet) |
| `browser-extension` | Popup/sidebar chrome | 400×600 (popup) | 320×500 (sidebar) |

## Key Concepts

### Multi-Surface Support

The system generates concepts for 4 target surfaces. Each surface dictates the shell chrome surrounding the UI, the viewport dimensions used for Playwright validation, and structural conventions (e.g., a VS Code extension renders inside an IDE panel, not a full browser window). The orchestrator routes surface information to each subagent via the README spec.

### Dynamic View Discovery

Views are discovered from project planning files (`.docs/`, `.adr/`, `.appdocs/`, `.ideas/`), never hardcoded. The orchestrator scans these directories for view definitions, feature lists, and user stories, then assembles the view set dynamically. This ensures concept passes always reflect the current project scope.

### Cross-Surface Correlation Groups

When generating concepts for multiple surfaces in one run, correlated passes across surfaces share visual identity (palette, typography, motifs) while diverging structurally to fit each surface's constraints. This lets reviewers see how a single design direction translates across platforms.

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

### Review Mode Switcher, Role Picker and Mock Sign-in (default)

Every pass can be seen as each kind of user without a backend. The orchestrator works out the modes
(every kind of user, signed out and signed in) and the roles inside each signed-in mode from the
planning files, and writes one table into every README spec. Example from a dealership app: "Dealer
signed in" with the roles Owner, Manager, Salesperson, Detailer and Photographer. The subagent
builds a small "Mode" control (default bottom-right, never covering content), a role select for each
signed-in mode, and mock sign-in, sign-up and sign-out that work the normal way. Passes open signed
out, and `?mode=<id>&role=<id>` starts any view in any state. The validation script checks it all and
writes `modeChecks` into `validation/report.playwright.json` plus one screenshot per mode and role in
`validation/modes/`. Contract: `.claude/skills/general-frontend-design-subagent/references/mode-switcher.md`.

## Workflow

1. User provides style(s), surface(s), and number of passes
2. Orchestrator discovers views from project planning files (`.docs/`, `.adr/`, `.appdocs/`, `.ideas/`)
3. Orchestrator writes README spec per pass with unique core flags and surface context
4. Orchestrator groups correlated passes across surfaces (shared visual identity)
5. Orchestrator dispatches subagents (up to 4 in parallel per batch)
6. Each subagent: plans → validates CDNs → generates with surface-appropriate chrome → validates with Playwright (surface-specific viewports) → reviews → fixes → completes
7. Orchestrator validates all passes have required files
8. Summary index written

## Output Per Pass

- HTML pages (count determined by dynamic view discovery)
- `style.css` (shared)
- `app.js` (shared)
- `README.md` (updated with subagent flags)
- `validation/handoff.json`
- `validation/inspiration-crossreference.json`
- `validation/report.playwright.json`
- `validation/primary/showcase.png` + `showcase-viewport.png`
- `validation/secondary/showcase.png` + `showcase-viewport.png`

Output path includes the surface:
```
.docs/planning/concepts/<surface>/<style>/pass-<n>/
```

Screenshot directories use `primary/` and `secondary/` (surface-dependent viewports) instead of `desktop/` and `mobile/`.

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
| Purpose | Explore many visual directions across surfaces | Build one production frontend |
| Surfaces | Multi-surface (website, vscode-extension, mobile-app, browser-extension) | Single target surface |
| Passes | Multiple (2-8 per style per surface) | Single build |
| Views | Dynamically discovered from planning files | Schema-shaped with confidence levels |
| Discovery | Scans `.docs/`, `.adr/`, `.appdocs/`, `.ideas/` for views | Full repository search |
| Components | Monolithic HTML with surface-appropriate chrome | Boundary-marked for extraction |
| Iteration | Not supported | Delta-based iteration |
