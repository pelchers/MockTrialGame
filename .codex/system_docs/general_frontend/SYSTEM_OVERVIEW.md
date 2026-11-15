# System Overview: General Frontend Design

## What It Is

The General Frontend Design system generates multiple divergent frontend concept passes for design exploration across one or more target surfaces. Each pass is a complete standalone HTML/CSS/JS prototype with its own visual identity, layout, and interaction design, rendered with surface-appropriate shell chrome. It supports 4 surfaces (website, VS Code extension, mobile app, browser extension) and discovers views dynamically from project planning files. It is used for aesthetic direction discovery before committing to a production frontend.

## Surface Types

| Surface | Description | Shell Chrome |
|---------|-------------|-------------|
| `website` | Standard web application | Browser chrome |
| `vscode-extension` | VS Code extension UI | IDE chrome mockup (sidebar, activity bar, status bar) |
| `mobile-app` | Native mobile application | System bars + bottom nav |
| `browser-extension` | Browser extension popup/sidebar | Popup/sidebar chrome |

## Component Map

```
.claude/
├── agents/general-frontend-design-orchestrator/agent.md   # Orchestrator agent
├── agents/general-frontend-design-subagent/agent.md       # Subagent (one per pass)
└── skills/
    ├── general-frontend-design-orchestrator/
    │   ├── SKILL.md                                        # Orchestrator procedures
    │   └── references/readme-template.md                  # Pass spec template
    └── general-frontend-design-subagent/
        ├── SKILL.md                                        # Subagent generation rules
        ├── references/library-catalog.json                # CDN library sources
        └── scripts/validate-visuals-playwright.mjs        # Playwright validator

.docs/planning/concepts/<surface>/<style>/pass-<n>/        # Output directory (surface in path)
```

## When to Use vs Alternatives

| Need | Use general_frontend | Alternative |
|------|---------------------|-------------|
| Explore multiple visual directions before choosing | Yes | Pick one and iterate |
| Generate views of a style family for a specific surface | Yes | Hand-code one prototype |
| Compare brutalist vs liquid side by side | Yes | N/A |
| See how one design direction looks across website + mobile + extension | Yes (multi-surface correlation) | Generate separately |
| Build the production frontend | No — use production_frontend | general_frontend is exploration only |
| Single one-page prototype | Yes (1-pass mode) | Direct HTML prototype |

## Integration with Other Systems

| System | Integration |
|--------|-------------|
| **production_frontend** | General frontend concepts feed into production spec; chosen concept is the source of truth |
| **agnostic_verification** | Templates and scripts should be verified before distribution |
| **claude_codex_sync** | Orchestrator and subagent agents sync to .codex/ automatically |
| **chat_history** | Each generation run is logged; run summary in AGENT REPORT |
| **project planning files** | `.docs/`, `.adr/`, `.appdocs/`, `.ideas/` are scanned for dynamic view discovery |

## Style Families (Default)

| Style | Identity |
|-------|----------|
| Brutalist | Raw concrete geometry, exposed structure, anti-decoration |
| Mid-Century Modern | Organic curves, warm wood tones, Eames-era furniture logic |
| Retro 50s | Chrome diners, atomic age patterns, pastel palette, googie |
| Liquid | Fluid motion, sliding transitions, morphing shapes |
| Slate | Dark stone textures, muted earth tones, carved/etched UI |

## General vs Production Agent

| Aspect | General | Production |
|--------|---------|------------|
| Purpose | Explore many visual directions across surfaces | Build one production frontend |
| Surfaces | Multi-surface (website, vscode-extension, mobile-app, browser-extension) | Single target |
| Output | Multiple HTML prototypes per surface | Boundary-marked components |
| Views | Dynamically discovered from planning files | Schema-shaped with confidence levels |
| Data | Generic mock data | Schema-shaped with confidence levels |
| Iteration | Not supported | Delta-based |
| Validation | Playwright screenshots (surface-specific viewports) | Full E2E |

## Design Decisions

**Why dispatch up to 4 subagents in parallel?**
Concept passes are independent by design. Parallel dispatch reduces wall-clock time from O(N) to O(N/4). Each subagent gets a fresh context with no shared state.

**Why dynamic view discovery instead of a hardcoded view list?**
Projects evolve. Hardcoded view lists drift from the actual project scope. Scanning `.docs/`, `.adr/`, `.appdocs/`, and `.ideas/` ensures concept passes always reflect the current feature set. The view count varies per project.

**Why multi-surface support?**
Many products span multiple platforms. Generating concepts for website, VS Code extension, mobile app, and browser extension in one run — with correlated visual identity — lets reviewers evaluate cross-platform coherence early.

**Why `primary/secondary` instead of `desktop/mobile` for screenshots?**
Each surface has different viewport semantics. A VS Code extension's "primary" viewport is IDE-sized (1280x800), not desktop-sized. Generic labels avoid confusion.

**Why directed reference discovery instead of provided URLs?**
Subagents with specific URLs converge on the same references. Thematic search hints produce diverse references, which produces diverse designs. The inspiration crossreference.json documents what was actually used.

## Constraints

- Background images are optional — never forced into every pass
- Plain HTML/CSS/JS only — no frameworks, no build tools required to view
- Each pass covers all views discovered from project planning files (count varies per project)
- Views are discovered dynamically from `.docs/`, `.adr/`, `.appdocs/`, `.ideas/` — never hardcoded
- Subagent cannot mark complete until Playwright screenshots are captured at surface-appropriate viewports
- Surface-specific shell chrome is required (VS Code IDE chrome, mobile system bars, browser extension popup chrome, etc.)
- Every pass includes a review Mode switcher with a role picker per signed-in mode and mock sign-in
  and sign-out; passes open signed out and `?mode=<id>&role=<id>` starts any view in any state
  (skipped only for a single-mode product)
- Validation fails a pass whose switcher covers a control, whose modes or roles do not open from the
  URL, or whose sign-in or sign-out does not work (`modeChecks`, run with `--strict`)
