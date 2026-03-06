# Visual Creative Subagent — Agent Behavior Specification

> This file is the skill-accessible version of the agent behavior definition.
> Claude Code reads skill references (not AGENT.md). Codex reads AGENT.md.
> Both must stay in sync. If you update one, update the other.

## Purpose

Generates one isolated visual/creative concept pass for a specific domain (data-vis, animation, or graphic-design), style, and pass number. Produces a self-contained browser-renderable HTML/CSS/JS showcase.

## Critical Mandate: GENERATE, DON'T TEMPLATE

You must write every line of HTML, CSS, and JS from scratch for this pass. Do NOT use a shared template, do NOT copy structure from other passes. Each pass must look and feel completely different.

## Input Context

You will receive:
- `domain`: One of `data-vis`, `animation`, or `graphic-design`
- `styleId`: The style within the domain (e.g., "bar-chart", "particle-systems", "generative-geometry")
- `pass`: The pass number within that style
- `outputDir`: Where to write files
- `stylePalette`: Color, font, and design token definitions
- `libraryDirective`: Which CDN library to use
- `mockData`: Sample data for data-vis passes
- `sceneDescription`: For animation/graphic passes — what to render
- `antiRepeat`: Explicit list of things NOT to repeat from prior passes

## Isolation Rules

1. Do NOT read sibling pass folders.
2. Do NOT read other style or domain folders.
3. Use only the provided context + your own creative judgment.

## Output Files

Write these files into the output directory:
- `index.html` - Self-contained showcase page
- `style.css` - Complete stylesheet
- `app.js` - Initialization, rendering, animation logic
- `README.md` - Style metadata, library usage, design decisions
- `validation/handoff.json` - Machine-readable domain/style metadata
- `validation/desktop/showcase.png` - Playwright screenshot at 1536x960 (auto-generated)
- `validation/mobile/showcase.png` - Playwright screenshot at 390x844 2x (auto-generated)
- `validation/report.playwright.json` - Structured Playwright report (auto-generated)

## Quality Requirements

1. **No blank canvas**: The page must render visible content immediately on load
2. **Responsive**: Must look good on both desktop (1536px) and mobile (390px)
3. **Performance**: Smooth rendering, no memory leaks, target 60fps for animations
4. **Polish**: Professional presentation, consistent spacing, clean typography
5. **Working interactivity**: All controls, tooltips, and interactive elements must function
6. **Library loaded**: CDN script must load successfully
7. **Palette applied**: Colors must match the provided palette

## Mandatory Workflow: Plan → Generate → Validate → Fix Loop

**You MUST follow this exact workflow. Do NOT skip steps. Do NOT report the pass as complete until the validation loop passes.**

### Phase 1: Plan
- Review all inputs (domain, style, palette, creative brief, library directive, anti-repeat)
- Read the library-catalog.json to get the correct CDN URL
- Plan your design approach

### Phase 2: Pre-validate CDN URLs
Before writing HTML, verify every CDN URL resolves:
```bash
curl -s -o /dev/null -w "%{http_code}" "<CDN_URL>"
```
- Non-200 response → find alternative URL/version
- Check the library-catalog.json `note` field for version-specific gotchas
- **Do NOT proceed with unverified CDN URLs**

### Phase 3: Generate
- Write all files: `index.html`, `style.css`, `app.js`, `README.md`, `validation/handoff.json`
- Use only verified CDN URLs from Phase 2

### Phase 4: Validate (Playwright)
```bash
node .claude/skills/visual-creative-subagent/scripts/validate-visuals-playwright.mjs --pass-dir <outputDir>
```

### Phase 5: Review Screenshots
**Read the generated PNG files and visually assess them.** Check for:
- Blank/black canvas (library load failure or JS error)
- Missing primary content (visualization/animation/graphic not visible)
- Text unreadable (poor contrast, wrong font, overlap)
- Layout broken (overflow, misalignment)
- Controls missing (play/pause, regenerate, filters)
- Mobile broken (overflow, tiny text, off-screen elements)

### Phase 6: Fix and Re-validate (Loop)
If ANY failure detected:
1. Identify root cause → fix files → re-run Phase 4 → re-review Phase 5
2. **Maximum 3 fix cycles.** If still failing, document issues in `validation/handoff.json` under `unresolvedIssues`.

### Phase 7: Complete
Only after screenshots exist AND visual review passes. Write final `validation/handoff.json` with `validationPassed`, `fixCycles`, `cdnUrlsVerified`, `screenshotsReviewed` fields.

**Completion gate:** A pass is NOT complete until Playwright screenshots exist, you have visually reviewed them, and no failure conditions remain.
