# Validation Pipeline

## Overview

Every visual creative pass must go through a mandatory validation pipeline before it
is considered complete. The subagent itself (not the orchestrator) owns the full
validation lifecycle, including running Playwright, reviewing screenshots, and fixing
issues in a loop.

## Pipeline Architecture

```
  Phase 1       Phase 2        Phase 3       Phase 4
  Plan          Pre-validate   Generate      Validate
                CDN URLs                     (Playwright)
    |               |              |              |
    v               v              v              v
  +-------------+-------------+-------------+-------------+
  | Review all  | curl each   | Write HTML, | Run         |
  | inputs,     | CDN URL,    | CSS, JS,    | validate-   |
  | read lib    | check for   | README,     | visuals-    |
  | catalog,    | HTTP 200,   | handoff.json| playwright  |
  | plan design | find alts   | using only  | .mjs script |
  |             | if non-200  | verified    |             |
  |             |             | URLs        |             |
  +-------------+-------------+-------------+-------------+
                                                  |
  +-------------+-------------+-------------+     |
  | Write final | Fix root    | Read PNGs,  |<----+
  | handoff.json| cause, re-  | assess for  |
  | with status | run Phase 4,| failure     |
  | fields      | re-review   | conditions  |
  +-------------+-------------+-------------+
    ^               ^              ^
    |               |              |
  Phase 7       Phase 6        Phase 5
  Complete      Fix Loop       Review
                (max 3)        Screenshots
```

## Phase Details

### Phase 1: Plan

- Review all inputs: domain, style, palette, creative brief, library directive, anti-repeat
- Read `library-catalog.json` to get correct CDN URLs
- Plan design approach based on the creative direction

### Phase 2: Pre-validate CDN URLs

Before writing any HTML, verify every CDN URL resolves:

```bash
curl -s -o /dev/null -w "%{http_code}" "https://cdn.example.com/lib@version/lib.min.js"
```

- **Non-200 response**: Find an alternative URL or version from the catalog or CDN provider.
- **Check `note` fields** in `library-catalog.json` for version-specific issues
  (e.g., UMD vs ESM builds, renamed globals, deprecated APIs).
- Do NOT proceed with unverified CDN URLs.

### Phase 3: Generate

Write all output files using only verified CDN URLs:
- `index.html` -- Complete HTML with CDN library tags and showcase structure
- `style.css` -- Full CSS with responsive breakpoints
- `app.js` -- Library initialization, rendering, animation, interaction logic
- `README.md` -- Concept overview, library usage, technique description
- `validation/handoff.json` -- Domain/style/library metadata (initial version)

### Phase 4: Validate (Playwright)

Run the Playwright validation script:

```bash
node .codex/skills/visual-creative-subagent/scripts/validate-visuals-playwright.mjs \
  --pass-dir <outputDir>
```

This script captures screenshots at two viewport sizes and produces a structured report.

### Phase 5: Review Screenshots

The subagent reads the generated PNG files and visually assesses them. Failure conditions:

| Condition                | Meaning                                              |
|--------------------------|------------------------------------------------------|
| Blank/black canvas       | Library failed to load or JS error crashed rendering |
| Missing primary content  | Visualization/animation/graphic not visible          |
| Text unreadable          | Poor contrast, wrong font, text overlap              |
| Layout broken            | Overflow, misalignment, elements off-screen          |
| Controls missing         | Play/pause, regenerate, filters not rendered         |
| Mobile broken            | Overflow, tiny text, off-screen elements on 390px    |

### Phase 6: Fix and Re-validate (Loop)

If any failure condition is detected:

1. Identify the root cause in the source files.
2. Fix the issue (update HTML, CSS, or JS).
3. Re-run Phase 4 (Playwright validation).
4. Re-run Phase 5 (screenshot review).

Maximum of **3 fix cycles**. If issues remain after 3 cycles, document them in
`validation/handoff.json` under the `unresolvedIssues` field.

### Phase 7: Complete

Only after screenshots exist on disk AND the visual review passes. Write the final
`validation/handoff.json` with these fields:

```json
{
  "domain": "animation",
  "styleId": "particle-systems",
  "pass": 2,
  "library": "p5.js",
  "validationPassed": true,
  "fixCycles": 1,
  "cdnUrlsVerified": true,
  "screenshotsReviewed": true,
  "unresolvedIssues": []
}
```

## Required Screenshots Per Pass

| File                                          | Viewport      | Notes                    |
|-----------------------------------------------|---------------|--------------------------|
| `validation/desktop/showcase.png`             | 1536 x 960    | Full-page screenshot     |
| `validation/desktop/showcase-viewport.png`    | 1536 x 960    | Viewport-only screenshot |
| `validation/mobile/showcase.png`              | 390 x 844, 2x | Full-page screenshot     |
| `validation/mobile/showcase-viewport.png`     | 390 x 844, 2x | Viewport-only screenshot |
| `validation/report.playwright.json`           | --             | Structured report        |

## Completion Gate

A pass is **NOT complete** until all of the following are true:

1. Playwright screenshots exist on disk (all 4 PNG files + report).
2. The subagent has visually reviewed the screenshots.
3. No failure conditions remain (or remaining issues are documented after 3 fix cycles).
4. The final `validation/handoff.json` is written with all status fields.

## Orchestrator Verification

After the subagent completes, the orchestrator independently verifies:

- `validation/desktop/showcase.png` exists
- `validation/mobile/showcase.png` exists
- `validation/report.playwright.json` exists

If any are missing, the pass is marked INCOMPLETE and may be re-dispatched.

## Quality Standards Checklist

| Standard                | Requirement                                              |
|-------------------------|----------------------------------------------------------|
| No blank canvas         | Visible content renders immediately on page load         |
| Responsive              | Works on desktop (1536px) and mobile (390px)             |
| Performance             | Smooth rendering, no memory leaks, no console errors     |
| Polish                  | Professional presentation, consistent spacing, clean type|
| Working interactivity   | All controls and hover states function correctly         |
| Library loaded           | CDN script loads successfully (verified URLs from catalog)|
| Palette applied          | Colors match the provided palette, not library defaults  |
