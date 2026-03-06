# Input Modes & Iteration

## Three Source Modes

The production orchestrator accepts three different design source modes:

### Mode 1: Style Transfer

**Input**: URL of an existing website to extract design patterns from.

**Process**:
1. WebFetch the source URL
2. Extract observable design tokens: colors, typography, layout, navigation, cards, animations, spacing
3. Build a design system specification from extracted patterns
4. Merge with the app's functional requirements from repository discovery

**Use case**: "Make our app look like Linear" or "Use the design language of Stripe's marketing site"

**Limitations**: Only extracts what's visible in the HTML/CSS. Dynamic interactions may not be fully captured.

### Mode 2: Template Basis

**Input**: Path to an existing concept pass folder (e.g., from the general frontend design agent).

**Process**:
1. Read the template's `handoff.json` for design tokens
2. Read `style.css` for the complete CSS custom property system
3. Read `README.md` for design language description
4. Extract layout archetype, navigation model, interaction patterns
5. Merge with the app's functional requirements

**Use case**: "Use the Dark Minimal concept from pass-5 as the basis for our production frontend" with optional modifications like "but make the sidebar collapsible"

**Advantages**: Highest fidelity input — you've already seen and approved the visual direction.

### Mode 3: Custom Direction

**Input**: Written description of desired visual direction.

**Process**:
1. WebSearch for 2-3 reference sites matching the description
2. Extract common design patterns across references
3. Build a design system from the direction + references
4. Merge with the app's functional requirements

**Use case**: "Clean dark theme with green accents, dense data layout, monospace headings"

## Modifications

All three modes accept an optional `modifications` parameter — specific changes to apply on top of the extracted/built design system.

Examples:
- "Keep the dark theme but use a sidebar instead of top nav"
- "Change primary color from purple to blue"
- "Make cards have more border-radius"
- "Use a different font for headings"

Modifications are explicit overrides that the orchestrator includes in PRODUCTION-SPEC.md.

## Iteration Support

### When to Iterate

After the first production build, you review the output in a browser. If changes are needed:

### How to Iterate

Provide:
- `previousOutputDir`: Path to the existing production output
- `deltaInstructions`: What to change

### What Happens

1. Orchestrator reads previous `PRODUCTION-SPEC.md` and `transfer-manifest.json`
2. Parses delta instructions into specific, actionable changes
3. Generates updated PRODUCTION-SPEC.md with `[DELTA]` markers on changed sections
4. Dispatches subagent in `iterate` mode
5. Subagent modifies only affected files (doesn't regenerate unchanged pages)
6. Transfer manifest updated with iteration history entry

### Iteration Scope

| Delta Type | Files Affected |
|-----------|---------------|
| Color change | style.css only |
| Layout change | Affected HTML pages + style.css |
| New component | Affected HTML page + app.js + style.css + manifest |
| Navigation change | All HTML pages + style.css + app.js |
| Data model change | app.js (mock data) + affected HTML pages + manifest |

### Iteration History

Each iteration is recorded in the transfer manifest:
```json
"iterationHistory": [
  { "timestamp": "2026-02-28T10:00:00Z", "mode": "fresh", "changes": "Initial generation" },
  { "timestamp": "2026-02-28T11:00:00Z", "mode": "iterate", "changes": "Changed sidebar to collapsible, added search to project page" }
]
```
