# System Overview: General Frontend Design

## What It Is

The General Frontend Design system generates multiple divergent frontend concept passes for design exploration. Each pass is a complete standalone HTML/CSS/JS prototype with its own visual identity, layout, and interaction design. It is used for aesthetic direction discovery before committing to a production frontend.

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

.docs/planning/concepts/<style>/pass-<n>/                  # Output directory
```

## When to Use vs Alternatives

| Need | Use general_frontend | Alternative |
|------|---------------------|-------------|
| Explore multiple visual directions before choosing | Yes | Pick one and iterate |
| Generate 10+ views of a style family | Yes | Hand-code one prototype |
| Compare brutalist vs liquid side by side | Yes | N/A |
| Build the production frontend | No — use production_frontend | general_frontend is exploration only |
| Single one-page prototype | Yes (1-pass mode) | Direct HTML prototype |

## Integration with Other Systems

| System | Integration |
|--------|-------------|
| **production_frontend** | General frontend concepts feed into production spec; chosen concept is the source of truth |
| **agnostic_verification** | Templates and scripts should be verified before distribution |
| **claude_codex_sync** | Orchestrator and subagent agents sync to .codex/ automatically |
| **chat_history** | Each generation run is logged; run summary in AGENT REPORT |

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
| Purpose | Explore many visual directions | Build one production frontend |
| Output | Multiple HTML prototypes | Boundary-marked components |
| Data | Generic mock data | Schema-shaped with confidence levels |
| Iteration | Not supported | Delta-based |
| Validation | Playwright screenshots | Full E2E |

## Design Decisions

**Why dispatch up to 4 subagents in parallel?**
Concept passes are independent by design. Parallel dispatch reduces wall-clock time from O(N) to O(N/4). Each subagent gets a fresh context with no shared state.

**Why require 20 files per pass?**
The 20-file list is the minimum spec for a complete, reviewable prototype. Missing files (screenshots, handoff.json) indicate an incomplete run that cannot be fairly evaluated.

**Why directed reference discovery instead of provided URLs?**
Subagents with specific URLs converge on the same references. Thematic search hints produce diverse references, which produces diverse designs. The inspiration crossreference.json documents what was actually used.

## Constraints

- Background images are optional — never forced into every pass
- Plain HTML/CSS/JS only — no frameworks, no build tools required to view
- Each pass covers all app views defined in the config (default: 10)
- Subagent cannot mark complete until Playwright screenshots are captured
- Every pass includes a review Mode switcher with a role picker per signed-in mode and mock sign-in
  and sign-out; passes open signed out and `?mode=<id>&role=<id>` starts any view in any state
  (skipped only for a single-mode product)
- Validation fails a pass whose switcher covers a control, whose modes or roles do not open from the
  URL, or whose sign-in or sign-out does not work (`modeChecks`, run with `--strict`)
