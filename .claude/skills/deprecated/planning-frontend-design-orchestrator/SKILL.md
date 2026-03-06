---
name: planning-frontend-design-orchestrator
description: Orchestrate frontend concept generation across 5 style families with up to 4 passes each, dispatching isolated Claude Code Task agents per pass with deliberate interaction design, optional media assets, and CDN libraries, then running uniqueness and visual validation.
---

# Planning Frontend Design Orchestrator

Use this skill to run multi-style frontend concept ideation with strict pass isolation and maximum variety.

## Config Source
- `.claude/skills/planning-frontend-design-orchestrator/references/style-config.json`

## Reference Catalogs
- `references/layout-uniqueness-catalog.json` - 20 structural layout profiles
- `references/style-config.json` - Style families with per-pass overrides
- `.claude/skills/frontend-design-subagent/references/available-libraries.json` - CDN library catalog
- `.claude/skills/frontend-design-subagent/references/asset-sources.json` - Approved media download sources
- `.claude/skills/frontend-design-subagent/references/external-inspiration-catalog.json` - Per-pass specific inspiration URLs
- `.claude/skills/frontend-design-subagent/references/product-context.md` - Product data models, terminology, and content vocabulary

## Workflow
1. Read the style config to get all style families and their pass definitions.
2. Read the uniqueness catalog, inspiration catalog, library catalog, and asset sources.
3. For each `(style, pass)` job, build a comprehensive creative brief that includes:
   a. Select a uniqueness profile (ensuring no two passes share the same profile).
   b. Apply per-pass `paletteOverrides` and `typographyOverrides` from the config.
   c. Include the pass's `interactionProfile` with all category selections and prompts.
   d. Include the pass's `contentPersona` for visual/tonal flavor.
   e. Include the **product context** from `references/product-context.md` — this defines all mock content (data models, terminology, view content, sample data). Content persona controls HOW it looks; product context controls WHAT it says.
   f. Include the pass's `viewHints` for per-view component directives.
   g. Include the pass's `antiRepeat` list as hard constraints.
   h. Include the specific inspiration references (not generic Awwwards categories).
   i. Include the available libraries catalog so the agent can choose 0-5 libraries.
   j. Include the asset sources catalog so the agent can optionally download media.
   k. Include the Professional Quality Standards checklist (see subagent SKILL.md).
   l. Dispatch as a Claude Code `Task` agent with `subagent_type=general-purpose`.
4. The Task agent generates ALL files from scratch (no template scripts).
5. After each pass completes, run `scripts/validate-concepts-playwright.mjs --style <style> --pass <n>` to capture desktop + mobile screenshots.
6. **Visual Quality Review** (REQUIRED — see details below).
7. After all passes complete, run `scripts/validate-design-uniqueness.mjs` for pairwise checks.
8. Write summary index for review.

## Visual Quality Review (Step 6)

After Playwright screenshots are captured for each pass, the orchestrator MUST visually inspect the screenshots and validate design quality. This is not optional — a pass that generates files and screenshots but has quality defects is NOT complete.

### How to Review
For each pass, use the Read tool to view at least 4 screenshots covering different views and both viewports:
1. `validation/desktop/dashboard.png` — Primary view, desktop
2. `validation/mobile/dashboard.png` — Primary view, mobile
3. `validation/desktop/kanban.png` — Complex layout view, desktop
4. `validation/mobile/settings.png` — Form-heavy view, mobile

### Quality Checklist (all must pass)
| Check | What to Look For | FAIL Criteria |
|-------|-----------------|---------------|
| **No Blank Pages** | Every view must have visible, rendered content | A view is entirely white, entirely black, or shows only a nav bar with no content area |
| **Text Contrast** | All text must be readable against its background | Light text on light background, dark text on dark background, text obscured by background images/patterns |
| **Mobile Responsive** | Mobile views must be usable, not just shrunk desktop | Content overflowing viewport, horizontal scroll required, text too small to read (<12px effective), nav completely broken or invisible |
| **Content Populated** | Views must have real themed content, not empty shells | A view shows only headings with no cards/items/data below them, placeholder text like "Content here" |
| **Layout Integrity** | No broken layouts or overlapping elements | Elements stacked on top of each other unreadably, sidebar covering main content, footer overlapping content |
| **Navigation Visible** | User can see how to navigate between views | No nav visible on desktop, no hamburger/menu accessible on mobile, nav items cut off or invisible |
| **Visual Polish** | Design should look intentional, not broken | Missing fonts falling back to Times New Roman, broken CSS showing unstyled HTML, images showing as broken icons |

### On Failure
If ANY check fails:
1. Identify the specific issue (which view, which viewport, what's wrong).
2. Read the pass's `index.html`, `style.css`, and/or `app.js` to diagnose the root cause.
3. Fix the code directly (edit the files in the pass folder).
4. Re-run Playwright screenshots for that pass.
5. Re-review the fixed screenshots.
6. Repeat up to 2 fix cycles. If still failing after 2 attempts, write the issues to `validation/quality-issues.json` and flag for manual review, but continue with other passes.

### Quality Report
After review, write `validation/quality-review.json` with this structure:
```json
{
  "passId": "brutalist/pass-3",
  "reviewedAt": "2026-02-15T...",
  "screenshotsReviewed": ["desktop/dashboard.png", "mobile/dashboard.png", "desktop/kanban.png", "mobile/settings.png"],
  "checks": {
    "noBlankPages": { "pass": true, "notes": "" },
    "textContrast": { "pass": true, "notes": "" },
    "mobileResponsive": { "pass": true, "notes": "" },
    "contentPopulated": { "pass": true, "notes": "" },
    "layoutIntegrity": { "pass": true, "notes": "" },
    "navigationVisible": { "pass": true, "notes": "" },
    "visualPolish": { "pass": true, "notes": "" }
  },
  "overallPass": true,
  "fixCycles": 0
}
```

## IMPORTANT: New Generations vs Edits

When the user asks for NEW generations:
- Scan existing pass folders per style to find the highest pass number
- Create NEW pass folders starting from the next number (e.g., if pass-1 and pass-2 exist, new passes are pass-3 and pass-4)
- Each generation run produces `passesPerStyle` new passes (default: 2) across all styles — the config defines how many per run, NOT the total cap
- Existing passes are preserved as-is
- New passes must be distinct from ALL existing passes (checked by uniqueness validation)

When the user asks for EDITS:
- Modify the specific pass folder they reference
- Re-run Playwright screenshots after editing

## Per-Pass Variety System

Each pass variant in the style config includes these differentiation tools:

### paletteOverrides
Different color palette per pass. Same style DNA, different color expression. A brutalist pass can be warm paper+red OR cool gray+electric blue — both are brutalist.

### typographyOverrides
Different font families per pass within the style's typographic family. Mid-century pass-1 might use Playfair Display, pass-3 might use Fraunces. Both are serif-warm but visually distinct.

### interactionProfile
Deliberate interaction design choices for every touchpoint — buttons, cards, page transitions, scroll reveals, hover states, toggles, tooltips, loading states, ambient motion, and micro-feedback. Each category can have multiple selections and an optional prompt guiding the feel. No two passes should share the same interaction profile.

### contentPersona
Visual tone and metaphor per pass. The persona shapes the design language (how text, components, and interactions FEEL) while the product context from `product-context.md` shapes the actual content displayed (labels, metrics, column names, sample data). Content must always align with the app's real PRD.

### viewHints
Per-view component/layout directives that force different patterns. Dashboard might use stat cards in one pass, radial charts in another. Kanban might use vertical columns in one, horizontal swimlanes in another.

### antiRepeat
Explicit ban list from prior passes. If pass-1 used a left-rail nav and stat cards, pass-2's antiRepeat says "DO NOT use: left-rail nav, stat cards".

## Required Artifacts Per Pass
- `<style>/pass-<n>/index.html` - Complete HTML with all 10 views
- `<style>/pass-<n>/style.css` - Full CSS with responsive breakpoints
- `<style>/pass-<n>/app.js` - Navigation, interactions, library init
- `<style>/pass-<n>/README.md` - Concept docs, library usage, design decisions
- `<style>/pass-<n>/validation/handoff.json` - Structural metadata
- `<style>/pass-<n>/validation/inspiration-crossreference.json` - Inspiration mapping

## Required Visual Validation Artifacts
- `<style>/pass-<n>/validation/desktop/<view>.png` — Full-page screenshot per view at 1536x960
- `<style>/pass-<n>/validation/desktop/<view>_segment-N.png` — Viewport-height scroll segments (auto-generated for tall pages)
- `<style>/pass-<n>/validation/mobile/<view>.png` — Full-page screenshot per view at 390x844, 2x scale
- `<style>/pass-<n>/validation/mobile/<view>_segment-N.png` — Viewport-height scroll segments (auto-generated for tall pages)
- `<style>/pass-<n>/validation/report.playwright.json` — Structured report with viewport info and screenshot/segment counts

A pass is NOT considered complete until all view screenshots exist. The total count is dynamic (minimum 20 full-page + additional scroll segments). Run the Playwright validation script after each pass finishes generating files.

## Optional Artifacts
- `<style>/pass-<n>/assets/*` - Downloaded media assets (SVGs, PNGs, Lottie JSON, video)

## Scripts
- `scripts/validate-concepts-playwright.mjs` - Desktop + mobile screenshot capture for every view
- `scripts/validate-design-uniqueness.mjs` - Pairwise pass uniqueness checking

## Notes
- Background images and media assets are OPTIONAL, not required
- CDN libraries are OPTIONAL — pure CSS is always valid
- Animation libraries are style-dependent, not mandated
- The agent picks libraries based on interaction profile fit, not by default
- Keep style config editable for easy iteration
- `passesPerStyle` in config determines how many NEW passes to generate per run (default: 2) — this is per-run, not a total cap
