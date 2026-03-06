# Configuration Reference

## File Locations

All configuration files live under `.claude/skills/` (and are mirrored in `.codex/skills/`).

| File | Path | Purpose |
|------|------|---------|
| Style Config | `planning-frontend-design-orchestrator/references/style-config.json` | Master style definitions |
| Uniqueness Catalog | `planning-frontend-design-orchestrator/references/layout-uniqueness-catalog.json` | 20 layout profiles |
| Inspiration Catalog | `frontend-design-subagent/references/external-inspiration-catalog.json` | Per-pass design references |
| Product Context | `frontend-design-subagent/references/product-context.md` | App PRD content layer |
| Libraries Catalog | `frontend-design-subagent/references/available-libraries.json` | Optional CDN libraries |
| Asset Sources | `frontend-design-subagent/references/asset-sources.json` | Optional media sources |
| Playwright Script | `frontend-design-subagent/scripts/validate-concepts-playwright.mjs` | Screenshot validation |

---

## style-config.json

The master configuration file. Defines all style families, their pass variants, and orchestration settings.

### Top-Level Fields

```json
{
  "version": 2,
  "outputRoot": ".docs/planning/concepts",
  "inspirationCatalogPath": "...",
  "uniquenessCatalogPath": "...",
  "librariesCatalogPath": "...",
  "assetSourcesPath": "...",
  "orchestration": { ... },
  "passesPerStyle": 2,
  "productContextRef": "...",
  "requiredViews": [ ... ],
  "styles": [ ... ]
}
```

### orchestration Object

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `concurrency` | number | 5 | Max parallel subagents |
| `validationSubfolder` | string | "validation" | Subfolder name for validation artifacts |
| `requireValidation` | boolean | true | Require handoff.json + inspiration-crossreference.json |
| `requireExternalInspiration` | boolean | true | Require inspiration catalog references |
| `requireDownloadedMedia` | boolean | false | Require downloaded background images |
| `allowOptionalMedia` | boolean | true | Allow optional media downloads |
| `requireUniqueProfilesPerRun` | boolean | true | No two passes share same uniqueness profile |
| `forceAnimationLibraries` | boolean | false | Force GSAP/Three.js (off = style-dependent) |
| `uniquenessThreshold` | number | 0.55 | Max pairwise Jaccard similarity |
| `requirePlaywrightScreenshots` | boolean | true | Non-negotiable screenshot capture |

### passesPerStyle

Number of passes generated **per run**, not a total cap. The orchestrator scans existing folders and auto-increments. Set to 2 means each run produces 10 concepts (5 styles x 2).

### requiredViews

Array of 10 view IDs that every pass must implement:
```json
["dashboard", "projects", "project-workspace", "kanban", "whiteboard",
 "schema-planner", "directory-tree", "ideas", "ai-chat", "settings"]
```

### styles Array — Pass Variant Schema

Each pass variant within a style contains:

```json
{
  "pass": 1,
  "variantSeed": "concrete-slab-monolith",
  "direction": "Creative direction text...",
  "paletteOverrides": {
    "bg": "#e8e0d0",
    "text": "#1a1a1a",
    "surface": "#f5f0e6",
    "accent": "#ff3b00",
    "accent2": "#0038ff",
    "border": "#1a1a1a"
  },
  "typographyOverrides": {
    "heading": "Font Name",
    "body": "Font Name",
    "mono": "Font Name"
  },
  "contentPersona": "Visual tone description...",
  "interactionProfile": {
    "buttonHover": { "selection": "...", "prompt": "..." },
    "buttonClick": { ... },
    "cardHover": { ... },
    "pageTransition": { ... },
    "scrollReveal": { ... },
    "navItemHover": { ... },
    "navItemActive": { ... },
    "inputFocus": { ... },
    "toggleSwitch": { ... },
    "tooltips": { ... },
    "loadingState": { ... },
    "idleAmbient": { ... },
    "microFeedback": { ... }
  },
  "viewHints": {
    "dashboard": "Component/layout directive...",
    "projects": "...",
    ...
  },
  "antiRepeat": ["explicit", "ban", "list"]
}
```

---

## layout-uniqueness-catalog.json

Contains 20 structurally distinct layout profiles. Each profile defines:

| Field | Description |
|-------|-------------|
| `id` | Profile identifier (e.g., "monolith-left-rail") |
| `shellMode` | Layout container architecture |
| `navPattern` | Navigation interaction pattern |
| `contentFlow` | How content blocks are arranged |
| `scrollMode` | Scroll behavior and triggering |
| `alignment` | Horizontal alignment strategy |
| `heroTreatment` | Hero section approach |
| `motionLanguage` | Motion/animation vocabulary |
| `density` | Spacing density (compact/balanced/spacious) |
| `componentTone` | Hard or soft component styling |

The orchestrator assigns a different profile to each pass to ensure structural uniqueness.

---

## external-inspiration-catalog.json

Keyed by `styleId/pass-N`, each entry is an array of external design references:

```json
{
  "brutalist/pass-1": [
    {
      "name": "Reference Title",
      "url": "https://specific-url.com",
      "traits": ["visual trait 1", "visual trait 2"],
      "takeaway": "ONE specific design element to extract and apply"
    }
  ]
}
```

Each pass gets 2-6 specific references. Traits describe observable characteristics. The takeaway is a single actionable instruction.

---

## product-context.md

Markdown file defining the app's real content vocabulary. Contains:
- App description and purpose
- Mandatory terminology (what terms to use/avoid)
- Data model schemas (Project, Idea, KanbanCard, etc.)
- View-specific content requirements (what each view must show)
- Sample data (real project names, task examples, etc.)

This file is immutable across passes — every pass uses the same product vocabulary regardless of visual style.

---

## validate-concepts-playwright.mjs

Headless Chromium screenshot capture script. Features:
- Smart waiting: `networkidle` + loading overlay force-dismiss + MutationObserver DOM stability
- Desktop (1536x960) and mobile (390x844) viewports
- Scroll-segment capture for tall pages
- Automatic navigation via `data-view` attributes with hamburger menu fallback
- Outputs PNG screenshots to `validation/desktop/` and `validation/mobile/`

CLI usage:
```bash
node validate-concepts-playwright.mjs \
  --concept-root .docs/planning/concepts \
  --config .claude/skills/planning-frontend-design-orchestrator/references/style-config.json \
  --style brutalist \
  --pass 1
```
