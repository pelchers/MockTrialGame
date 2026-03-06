# Generation Workflow

## How a Generation Run Works

### Step 1: Orchestrator Reads Configuration

The orchestrator reads all reference files:
- `style-config.json` — Style families, pass variants, orchestration settings
- `layout-uniqueness-catalog.json` — 20 structural layout profiles
- `external-inspiration-catalog.json` — Per-pass external design references
- `product-context.md` — App-specific content requirements

### Step 2: Determine Pass Numbers

The orchestrator scans existing pass folders to determine the next pass numbers:
```
Existing: pass-1 through pass-6
passesPerStyle: 2
Next run: pass-7 and pass-8
```

`passesPerStyle` is a per-run count, not a total cap. Each subsequent run auto-increments.

### Step 3: Build Creative Briefs

For each (style, pass) combination, the orchestrator assembles a comprehensive creative brief containing:

| Component | Source | Purpose |
|-----------|--------|---------|
| Style definition & palette | `style-config.json` | Visual DNA and color palette |
| Typography overrides | `style-config.json` | Font selections |
| Uniqueness profile | `layout-uniqueness-catalog.json` | Structural layout architecture |
| Inspiration references | `external-inspiration-catalog.json` | Specific design references with takeaways |
| Product context | `product-context.md` | Real app data models, terminology, content |
| Content persona | `style-config.json` | Visual tone and metaphor |
| Interaction profile | `style-config.json` | All 13 interaction categories |
| View hints | `style-config.json` | Per-view component/layout directives |
| Anti-repeat list | `style-config.json` | Hard constraints from prior passes |
| Libraries catalog | `available-libraries.json` | Optional CDN libraries |
| Asset sources | `asset-sources.json` | Optional media sources |

### Step 4: Dispatch Subagents

Each creative brief is dispatched as an isolated Claude Code Task agent:
```
Task agent (subagent_type=general-purpose)
├── Receives: Complete creative brief
├── Generates: 10-view navigable app from scratch
└── Outputs: index.html, style.css, app.js, README.md, validation files
```

Up to 5 subagents run in parallel (configurable via `orchestration.concurrency`).

### Step 5: Subagent Generation

Each subagent independently:
1. Interprets the creative brief
2. Designs a unique layout following the assigned uniqueness profile
3. Writes all HTML/CSS/JS from scratch (no templates)
4. Populates content using product context terminology
5. Applies the content persona's visual tone
6. Implements all 13 interaction categories from the interaction profile
7. Creates all 10 required views with navigation between them
8. Writes validation metadata (handoff.json, inspiration-crossreference.json)

### Step 6: Playwright Screenshot Validation

After all subagents complete, the orchestrator runs the Playwright validation script:
```
node validate-concepts-playwright.mjs --concept-root .docs/planning/concepts
```

This captures:
- Desktop screenshots (1536x960) for all 10 views per pass
- Mobile screenshots (390x844) for all 10 views per pass
- Scroll segment screenshots for tall pages
- Uses smart waiting: `networkidle` + overlay dismissal + DOM stability check

### Step 7: Visual Quality Review

The orchestrator performs a mandatory quality review. Every pass must meet:

| Check | Requirement |
|-------|-------------|
| No Blank Pages | Every view has visible rendered content |
| Text Contrast | Min 4.5:1 body, 3:1 headings |
| Mobile Responsive | 390px usable, no horizontal scroll, 14px min text |
| Content Populated | 3+ content elements per view |
| Layout Integrity | No overlapping elements, proper spacing |
| Navigation Visible | Accessible on desktop and mobile |
| Visual Polish | Fonts load, CDN libs work, colors match style |

Failing passes get up to 2 fix cycles. Persistent failures are flagged in `validation/quality-issues.json`.

### Step 8: Uniqueness Validation

The orchestrator runs uniqueness checking across all passes:
- Pairwise structural similarity computed via Jaccard index on handoff.json properties
- Threshold: 0.55 (pairs exceeding this are flagged as too similar)
- Results written to `uniqueness-report.json`

### Step 9: Summary Index

The orchestrator produces:
- `_orchestration/<timestamp>/` logs for the run
- Updated `README.md` index of all concepts
- Validation report summarizing pass/fail status

## Invoking a Generation Run

The orchestrator is invoked by asking Claude Code to run a generation using the planning frontend design orchestrator. The system will:
1. Auto-detect existing passes and increment
2. Generate `passesPerStyle` new passes per primary style family
3. Run full validation pipeline
4. Commit results

## Output Per Pass

```
<style>/pass-<N>/
├── index.html                              # Complete 10-view SPA
├── style.css                               # Responsive stylesheet
├── app.js                                  # Navigation, interactions, library init
├── README.md                               # Design decisions, library usage
├── assets/                                 # (optional) downloaded media
└── validation/
    ├── handoff.json                        # Structural metadata for uniqueness
    ├── inspiration-crossreference.json     # Inspiration source mapping
    ├── desktop/
    │   ├── dashboard.png
    │   ├── dashboard_segment-1.png         # Scroll segments (if tall)
    │   ├── projects.png
    │   └── ... (all 10 views)
    └── mobile/
        ├── dashboard.png
        └── ... (all 10 views)
```
