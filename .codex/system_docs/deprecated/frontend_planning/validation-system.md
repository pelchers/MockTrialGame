# Validation System

## Overview

The validation system ensures every generated concept pass meets quality, completeness, and uniqueness standards. It operates in three stages:

1. **Playwright Screenshot Capture** — Automated headless browser screenshots
2. **Visual Quality Review** — Mandatory quality gate checklist
3. **Uniqueness Validation** — Cross-pass structural similarity checking

---

## Stage 1: Playwright Screenshot Capture

### Script Location
`.claude/skills/frontend-design-subagent/scripts/validate-concepts-playwright.mjs`

### What It Does
Opens each pass's `index.html` in headless Chromium, navigates through all 10 views, and captures screenshots at two viewport sizes.

### Viewports

| Name | Width | Height | Scale | Notes |
|------|-------|--------|-------|-------|
| Desktop | 1536 | 960 | 1x | Standard laptop resolution |
| Mobile | 390 | 844 | 2x | iPhone 14-equivalent |

### Smart Waiting System

The script uses a three-phase waiting strategy to ensure pages are fully rendered before capture:

1. **Network Idle**: `waitUntil: "networkidle"` — Waits for no network requests for 500ms
2. **Overlay Dismissal**: JavaScript injection that force-hides common loading overlays:
   - Selectors: `#loading-overlay`, `.splash-screen`, `.preloader`, `[data-loading-overlay]`, etc.
   - Removes body classes: `loading`, `is-loading`, `no-scroll`, `overflow-hidden`
3. **DOM Stability**: MutationObserver that waits until the DOM stops mutating for 500ms (capped at 4s max)

### Navigation Strategy

For each of the 10 required views:
1. Try clicking `[data-view='<viewId>']` element directly
2. If not visible, try opening hamburger/mobile menu first, then click
3. If still not found, use JavaScript fallback: toggle `data-page` display + update `location.hash`

### Scroll Segment Capture

For pages taller than the viewport, the script captures scroll segments:
- Divides page height by viewport height
- Scrolls to each segment position
- Captures a non-fullPage screenshot per segment
- Names: `<view>_segment-1.png`, `<view>_segment-2.png`, etc.

### Output Structure
```
validation/
├── desktop/
│   ├── dashboard.png              # Full-page screenshot
│   ├── dashboard_segment-1.png    # Scroll segment (if tall)
│   ├── dashboard_segment-2.png
│   ├── projects.png
│   ├── kanban.png
│   └── ... (all 10 views)
└── mobile/
    ├── dashboard.png
    ├── dashboard_segment-1.png
    └── ... (all 10 views)
```

---

## Stage 2: Visual Quality Review

### Purpose
A mandatory gate that verifies each pass meets professional quality standards. This is NOT optional — every pass must be reviewed.

### Checklist

| # | Check | Requirement | How to Verify |
|---|-------|-------------|---------------|
| 1 | No Blank Pages | Every view has visible rendered content | Review all desktop screenshots |
| 2 | Text Contrast | Min 4.5:1 for body text, 3:1 for headings | Check palette against background |
| 3 | Mobile Responsive | 390px width usable, no horizontal scroll, 14px min text | Review all mobile screenshots |
| 4 | Content Populated | 3+ content elements per view, not empty shells | Verify data in screenshots |
| 5 | Layout Integrity | No overlapping elements, proper vertical spacing | Visual inspection |
| 6 | Navigation Visible | Nav accessible on desktop and mobile | Check all viewport screenshots |
| 7 | Visual Polish | Fonts load, CDN libs work, colors match style intent | Compare to creative brief |

### Failure Handling

- **First failure**: Orchestrator dispatches fix cycle with specific issues noted
- **Second failure**: One more fix cycle attempted
- **Third failure**: Pass flagged for manual review, issues logged to `validation/quality-issues.json`

---

## Stage 3: Uniqueness Validation

### Purpose
Ensures no two passes are too structurally similar. Catches cases where different visual skins are applied to the same underlying layout.

### Method
- Reads `validation/handoff.json` from each pass
- Computes pairwise Jaccard similarity on structural properties (shell mode, nav pattern, content flow, etc.)
- Flags pairs exceeding the threshold

### Threshold
`uniquenessThreshold: 0.55` (configurable in `style-config.json`)

Pairs with similarity > 55% are flagged as potentially too similar and may need regeneration.

### handoff.json Schema

Each pass must produce a `validation/handoff.json` with structural metadata:

```json
{
  "styleId": "brutalist",
  "pass": 7,
  "variantSeed": "concrete-slab-monolith",
  "uniquenessProfile": "monolith-left-rail",
  "shellMode": "fixed-left-rail",
  "navPattern": "stacked-labels",
  "contentFlow": "single-column",
  "scrollMode": "native-vertical",
  "density": "compact",
  "componentTone": "hard",
  "typographyStack": ["Oswald", "IBM Plex Mono", "JetBrains Mono"],
  "paletteSignature": ["#e8e0d0", "#1a1a1a", "#ff3b00"],
  "librariesUsed": ["gsap"],
  "viewsImplemented": ["dashboard", "projects", ...],
  "backgroundImageUsed": false
}
```

### inspiration-crossreference.json

Maps each inspiration reference to how it was applied:

```json
{
  "references": [
    {
      "name": "Brutalist Websites Directory",
      "url": "https://brutalistwebsites.com",
      "appliedTo": "Overall layout structure",
      "howApplied": "Used stacked-slab feed pattern with hard 1px rule separators"
    }
  ]
}
```

---

## Running Validation Manually

### Screenshot capture only:
```bash
node .claude/skills/frontend-design-subagent/scripts/validate-concepts-playwright.mjs \
  --concept-root .docs/planning/concepts
```

### Filter to specific style/pass:
```bash
node .claude/skills/frontend-design-subagent/scripts/validate-concepts-playwright.mjs \
  --concept-root .docs/planning/concepts \
  --style brutalist \
  --pass 7
```

### Prerequisites
- Node.js 18+
- Playwright installed: `pnpm add -D playwright`
- Chromium browser: `npx playwright install chromium`
