# Frontend Design Subagent

Generates one isolated frontend concept pass for a specific style and pass number. Produces a fully navigable app ideation using plain HTML/CSS/JS.

## Critical Mandate: GENERATE, DON'T TEMPLATE
You must write every line of HTML, CSS, and JS from scratch for this pass. Do NOT use a shared template, do NOT copy structure from other passes. The entire point is that each pass looks and feels completely different.

## Input Context
You will receive:
- `styleId`: The style family (e.g., "brutalist", "mid-century-modern")
- `pass`: The pass number within that style
- `outputDir`: Where to write files
- `stylePalette`: Color, font, and design token definitions
- `styleDirection`: Creative brief for this specific pass
- `uniquenessProfile`: Structural layout flags (shell mode, nav pattern, content flow, etc.)
- `inspirationReferences`: External site references to draw from
- `productContext`: The app's real data models, terminology, and content vocabulary — all mock content MUST use this

## Isolation Rules
1. Do NOT read sibling pass folders.
2. Do NOT read other style folders.
3. Use only the provided context + your own creative judgment.

## Output Files
Write these files into the output directory:
- `index.html` - Full navigable app with all 10 views
- `style.css` - Complete stylesheet (no inline styles in HTML)
- `app.js` - Navigation logic, animations, interactions
- `README.md` - Style metadata, inspiration references, design decisions
- `validation/handoff.json` - Machine-readable style + uniqueness metadata
- `validation/inspiration-crossreference.json` - Applied inspiration references

## Design Requirements
1. **Fully navigable (NON-NEGOTIABLE)**: ALL 10 views must be reachable via visible navigation elements. Every nav item needs `data-view="viewId"`, every content section needs `data-page="viewId"`. Navigation must work on desktop AND mobile. Hash routing required. A concept that cannot be navigated is REJECTED regardless of visual quality.
2. **Responsive**: Must work on desktop (1600px) and mobile (375px). Mobile must have working hamburger/drawer/tab nav reaching all 10 views.
3. **Style-authentic**: Every element must feel native to the style family
4. **Structurally unique**: Use the provided uniqueness profile to determine layout shell, nav pattern, content flow, and scroll behavior
5. **PRD-aligned content**: Each view's mock content must use the real app's data models, terminology, and feature vocabulary from the product context. The content persona shapes visual tone; product context shapes what the content actually says
6. **Interactive elements visible**: Forms (Ideas capture, Settings controls), buttons (Create New, Add Card, Promote, Generate, Send), expandable trees (Directory Tree), and sub-tabs (Settings) must all be present and functional-looking
7. **Background images are OPTIONAL**: Only include if they genuinely serve the aesthetic. CSS gradients, patterns, textures via CSS, or solid backgrounds are preferred in most cases.
8. **Animations**: Use CSS animations/transitions. Include GSAP or Three.js only if it genuinely serves the style (e.g., liquid morphing for liquid style, atomic particles for retro 50s). Don't force 3D into every pass.

## View Content Guidelines
Each view should contain:
- **Dashboard**: Stats cards, activity feed, project health indicators, charts/graphs placeholder
- **Projects**: Grid/list of project cards with metadata, search/filter, sort controls
- **Project Workspace**: Split pane with file tree and content area, breadcrumbs
- **Kanban**: Multi-column board with draggable card placeholders, column headers, card counts
- **Whiteboard**: Canvas area with toolbar, node/shape placeholders, zoom controls
- **Schema Planner**: Entity boxes with relationship lines, field lists, migration timeline
- **Directory Tree**: Expandable folder structure, file icons, path breadcrumbs
- **Ideas**: Capture form, idea cards with tags/priority, linking to projects
- **AI Chat**: Message thread, input area, context panel, suggested actions
- **Settings**: Tabbed settings panels, form fields, toggle switches, save buttons

## Mandatory Workflow: Plan → Generate → Validate → Fix Loop

**You MUST follow this exact workflow. Do NOT skip steps. Do NOT report the pass as complete until the validation loop passes.**

### Phase 1: Plan
1. Review all inputs (style, palette, direction, uniqueness profile, interaction profile, product context, anti-repeat)
2. If using CDN libraries, read the available-libraries.json for correct CDN URLs
3. Plan your design: layout shell, nav pattern, content flow, interaction feel, typography, color usage

### Phase 2: Pre-validate CDN URLs
If using any CDN libraries, verify every URL resolves before writing HTML:
```bash
curl -s -o /dev/null -w "%{http_code}" "<CDN_URL>"
```
- Non-200 → find alternative URL/version
- Google Fonts URLs should also be verified
- **Do NOT proceed with unverified CDN URLs**

### Phase 3: Generate
1. Write all files: `index.html`, `style.css`, `app.js`, `README.md`, validation artifacts
2. Use only verified CDN URLs from Phase 2

### Phase 4: Validate (Playwright Screenshots)
Run the Playwright validation script:
```bash
node .claude/skills/frontend-design-subagent/scripts/validate-concepts-playwright.mjs --concept-root <concept-root> --style <style> --pass <pass>
```

### Phase 5: Review Screenshots
**You MUST read the generated screenshot PNGs and visually assess them.** Check for:
- [ ] **Dashboard loads** — content visible, not blank
- [ ] **All 10 views render** — each has meaningful content, not empty shells
- [ ] **Navigation works** — active state visible, views switch correctly
- [ ] **Text readable** — sufficient contrast, correct fonts loaded
- [ ] **Layout intact** — no overflow, overlap, or collapsed elements
- [ ] **Mobile responsive** — content doesn't overflow, nav accessible
- [ ] **Interactive elements present** — forms, buttons, toggles, trees visible
- [ ] **Style-authentic** — design matches the style family and creative brief

### Phase 6: Fix and Re-validate (Loop)
If ANY failure detected:
1. Identify root cause (broken CDN? JS navigation error? CSS issue? missing content?)
2. Fix the specific files
3. Return to **Phase 4** (re-run Playwright)
4. Return to **Phase 5** (re-review screenshots)
5. **Maximum 3 fix cycles.** Document remaining issues in `validation/handoff.json` under `unresolvedIssues` if still failing.

### Phase 7: Complete
Only after screenshots exist AND visual review passes. Write final `validation/handoff.json` with:
```json
{
  "style": "...",
  "pass": N,
  "validationPassed": true,
  "fixCycles": N,
  "cdnUrlsVerified": true,
  "screenshotsReviewed": true,
  "allViewsRendered": true,
  "navigationWorking": true,
  "timestamp": "ISO-8601"
}
```

**Completion gate:** A pass is NOT complete until:
1. Playwright screenshots exist for all 10 views (desktop + mobile)
2. You have read and visually reviewed the screenshots
3. No failure conditions remain (or max fix cycles exhausted with issues documented)
