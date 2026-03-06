---
name: production-frontend-subagent
description: Generate a production-quality frontend from a PRODUCTION-SPEC.md with full interactivity, real data shapes, user story coverage, component boundaries, and a transfer manifest for framework migration.
agent: .claude/agents/production-frontend-subagent/agent.md
---

# Production Frontend Subagent

## Inputs (via Task Agent Prompt)
- `productionSpecPath` — Path to the orchestrator-generated PRODUCTION-SPEC.md
- `outputDir` — Directory to write output files
- `skillPath` — Path to this SKILL.md for workflow reference
- `libraryPath` — Path to library-catalog.json
- `validationScript` — Path to Playwright validation script
- `mode` — `fresh` or `iterate`
- `previousOutputDir` — (iterate mode only) Path to previous output

## Hard Requirements

### Read the PRODUCTION-SPEC.md First
The orchestrator has performed comprehensive repository discovery and written a complete production specification. Read it COMPLETELY before doing anything else. It defines your pages, data models, design system, user stories, and interactivity requirements.

### Frontend-Only — But Production-Shaped
Generate only HTML, CSS, and JS. All data is mock, all interactions are frontend-simulated. But unlike exploration passes, mock data MUST match real schema shapes, interactions MUST cover user stories, and components MUST have extraction boundaries for framework migration.

### Every User Story Must Be Testable
If the spec includes user stories, every story must be implementable through visible UI interactions. A user should be able to walk through the story steps in the browser and see the expected results (even if data doesn't persist).

### Component Boundaries Are Mandatory
Every logical component must be wrapped in HTML comments that specify:
- Component name (matching the transfer manifest)
- Expected props (with types)
- Data source (query/mutation name)

This enables automated extraction to React/Next.js components.

## Quality Standards

### 1. Responsive Design
- Desktop: 1536px viewport (primary design target)
- Laptop: 1280px
- Tablet: 1024px and 768px
- Mobile: 480px and 390px
- No horizontal overflow at any breakpoint
- Touch-friendly tap targets (44px minimum) on mobile
- Mobile navigation must be fully functional

### 2. Typography
- Google Fonts loaded via `<link>` in `<head>`
- Maximum 3 font families
- Clear visual hierarchy: display > h1 > h2 > h3 > body > caption
- Line height 1.4-1.8 for body text
- 16px minimum body font size
- 4.5:1 minimum contrast ratio for body text

### 3. Color System
- ALL colors as CSS custom properties in `:root`
- Minimum 11 colors: primary, secondary, accent, background, surface, text, text-muted, border, success, warning, error
- Dark/light theme via `[data-theme="dark"]` on `<html>`
- Theme preference saved to localStorage
- `prefers-color-scheme` media query respected for initial theme

### 4. Animation & Interaction
- Every clickable element: visible hover, focus, and active states
- Form inputs: focus indicator (glow, underline expand, or border color change)
- Transitions: 150-300ms ease for micro-interactions
- Page load: subtle fade-in or slide-up for main content
- Loading states: skeleton screens or shimmer effects (simulated with setTimeout)
- Error states: red border + error message for form validation
- Empty states: illustration or message when lists are empty
- Respect `prefers-reduced-motion`

### 5. Code Quality
- Semantic HTML5 (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<nav>`)
- Zero inline styles in HTML — everything in `style.css`
- Zero inline scripts in HTML — everything in `app.js` (except CDN `<script>` tags)
- CSS custom properties for ALL theming
- BEM-like or utility class naming convention
- Comments marking section boundaries in all three files
- Component boundary comments in HTML (see agent.md for format)

### 6. State Management
- Centralized mock data store in app.js
- State objects that mirror the target state management shape (e.g., Zustand slices)
- State changes trigger UI updates (re-render affected components)
- Example pattern:
```javascript
const store = {
  projects: { items: [...], filter: 'all', loading: false },
  auth: { user: {...}, isAuthenticated: true },
  ui: { theme: 'light', sidebarOpen: true, activeModal: null }
};
```

### 7. Form Validation
- Client-side validation matching rules from the spec
- Real-time validation feedback (on blur or on input)
- Error messages adjacent to the invalid field
- Submit button disabled until form is valid (or shows errors on submit)
- Success feedback after submission (toast, redirect, or inline message)

### 8. Data Fidelity
- Mock data matches schema shapes exactly (field names, types, nesting)
- Realistic domain-appropriate values (not lorem ipsum)
- Consistent relationships between entities
- Appropriate record counts (enough to demonstrate lists, pagination, filtering)
- Dates properly formatted and realistic
- Speculated fields marked with `data-speculated="true"` attribute

### 9. Performance
- Maximum 5 CDN library imports
- Images via CSS gradients, SVG inline, or canvas — no external image URLs
- Lazy-load heavy libraries (Three.js, etc.) — don't block initial render
- Total JS payload under 2MB (CDN libraries combined)

### 10. Accessibility
- Keyboard navigable (Tab, Shift+Tab, Enter, Escape)
- Visible focus rings on all interactive elements
- ARIA labels on icon-only buttons
- Skip-to-content link
- Form labels associated with inputs
- Role attributes where semantic HTML isn't sufficient
- Screen reader-friendly error announcements

## CDN Libraries

Reference: `.claude/skills/production-frontend-subagent/references/library-catalog.json`

Rules:
- Pick 0-5 libraries based on production needs
- ALWAYS verify CDN URLs return 200 before using them
- Three.js: Use v0.160.0 specifically (v0.170.0+ dropped UMD builds)
- Prefer GSAP for complex animations, CSS transitions for simple ones
- Chart.js or D3.js only if the app requires data visualization
- SortableJS only if the app requires drag-and-drop

## Mandatory Workflow (8 Phases)

### Phase 1: Read Spec & Plan
1. Read PRODUCTION-SPEC.md completely
2. Inventory: pages, components per page, data models, user stories
3. Plan component hierarchy for each page
4. Plan state management approach
5. Plan mock data generation (realistic values)
6. If iterate mode: read previous output, identify delta changes

### Phase 2: Pre-validate CDN URLs
For each CDN URL you plan to use, verify it returns 200.
If any fail, find alternatives from the library catalog.

### Phase 2.5: Build Component Registry (Pre-Registration)

Before writing any HTML, create an internal component registry from the production spec. This ensures nothing gets missed during generation.

For every page in the spec, pre-register every section/component:
```json
// Internal planning document — component-registry.json
{
  "pages": [
    {
      "file": "index.html",
      "route": "/",
      "expectedComponents": [
        {
          "name": "HeroSection",
          "props": ["title: string", "subtitle: string"],
          "dataSource": "static",
          "userStories": [],
          "status": "pending"
        },
        {
          "name": "ProjectGrid",
          "props": ["projects: Project[]", "onFilter: function"],
          "dataSource": "getProjects()",
          "userStories": ["US-001", "US-002"],
          "status": "pending"
        }
      ]
    }
  ],
  "totalExpectedComponents": 0,
  "totalUserStories": 0
}
```

This registry serves as a checklist during generation. As you write each component in HTML, update its status to `"generated"`. After generation, any component still `"pending"` is a gap that must be addressed.

### Phase 3: Generate
Write all output files. For iterate mode, modify only what the delta requires.

**HTML files**: One per page/route in the spec
- Consistent `<head>` with meta, fonts, CDN links
- Consistent navigation on every page
- Component boundary comments on every logical section
- Current page indicator in navigation
- Semantic HTML5 structure

**style.css**: Complete production stylesheet
- `:root` with all design tokens
- `[data-theme="dark"]` overrides
- Component styles in BEM-like naming
- Responsive breakpoints
- Print styles where applicable
- State classes: `.is-loading`, `.is-error`, `.is-empty`, `.is-active`, `.is-disabled`

**app.js**: Complete production JavaScript
- Mock data store (matching schema shapes)
- Component initialization functions
- Navigation and routing logic
- Form validation handlers
- Filter/sort/search functionality
- Theme toggle with persistence
- Mobile nav toggle
- Modal/dialog management
- Toast/notification system
- Loading state simulation
- Keyboard shortcut handlers (if specified)
- Page-specific initialization (called based on current page)

**validation/transfer-manifest.json**: Complete transfer manifest
- Every page mapped to target framework route
- Every component mapped with props and data sources
- Every data model documented with field types
- Every user story mapped to components and pages
- CDN dependencies mapped to npm packages
- Design tokens mapped to Tailwind config
- Iteration history (if applicable)

**validation/user-story-checklist.json**: User story coverage
- Every story from the spec with implementation status
- Test steps for each story
- Component and page mapping

**validation/handoff.json**: Design handoff (compatible with general agent schema)

**README.md**: Production build documentation
- How to run (just open index.html)
- Page inventory
- Design system summary
- User story coverage
- Transfer instructions
- Iteration history

### Phase 3.5: Component Reconciliation

After writing all HTML files, run a reconciliation pass to ensure transfer manifest completeness:

**Step 1 — Extract components from HTML:**
Scan every HTML file for `<!-- [COMPONENT: ...] -->` boundary comments. Build an "actual" component list with:
- Component name
- Page/file it appears in
- Props declared in the `[PROPS: ...]` comment
- Data source declared in the `[DATA: ...]` comment

**Step 2 — Compare against registry:**
Diff the pre-registered component registry (Phase 2.5) against the actual extracted components:
- **In registry but NOT in HTML** = Gap. Must be added or explicitly marked as "deferred" with reason.
- **In HTML but NOT in registry** = New component discovered during generation. Add to registry with status `"added-during-generation"`.
- **In both but props/data mismatch** = Update the transfer manifest to match what was actually generated.

**Step 3 — Verify data model references:**
For every `[DATA: ...]` comment:
- Verify the referenced query/mutation name appears in the mock data store in app.js
- Verify the data shape returned matches the schema from the production spec
- Flag any `[DATA: ...]` references that don't have corresponding mock data

**Step 4 — Verify user story coverage:**
For every user story in the spec:
- Verify at least one component lists it in its `userStories` mapping
- Verify the component's page has the necessary interactive elements (buttons, forms, etc.)
- Flag uncovered stories

**Step 5 — Write reconciliation report:**
Write `validation/component-reconciliation.json`:
```json
{
  "timestamp": "<ISO>",
  "totalExpected": 0,
  "totalGenerated": 0,
  "totalMatched": 0,
  "gaps": [
    { "component": "Name", "page": "file.html", "reason": "not generated" }
  ],
  "additions": [
    { "component": "Name", "page": "file.html", "reason": "discovered during generation" }
  ],
  "propMismatches": [
    { "component": "Name", "expected": "...", "actual": "..." }
  ],
  "dataMismatches": [
    { "component": "Name", "declaredSource": "...", "mockDataExists": true }
  ],
  "userStoryCoverage": {
    "total": 0,
    "covered": 0,
    "uncovered": ["US-XXX"],
    "percentage": "100%"
  }
}
```

If gaps or uncovered stories are found, fix them before proceeding to Phase 4.

### Phase 4: Self-Review Checklist
Before Playwright, verify:
- [ ] Every page from the spec has an HTML file
- [ ] Every page has working navigation to all other pages
- [ ] Every user story has a component with boundary comments
- [ ] Every form has validation with error messages
- [ ] Every interactive element has hover + focus + active states
- [ ] Mock data matches schema shapes (field names and confidence levels from spec)
- [ ] Dark/light theme toggle works
- [ ] Mobile navigation works
- [ ] No inline styles or scripts
- [ ] Component boundaries are marked on all sections
- [ ] Component reconciliation has 0 gaps and 100% user story coverage
- [ ] Transfer manifest matches reconciliation report

### Phase 5: Validate with Playwright
Run:
```bash
node "<skillPath>/scripts/validate-production-playwright.mjs" --pass-dir "<outputDir>"
```
Captures 4 screenshots per page: desktop full + viewport, mobile full + viewport.
For multi-page sites, captures at minimum the primary page (index.html).

### Phase 6: Review Screenshots
Read viewport screenshots and verify production quality:
- Layout matches the design system
- All sections render with correct styling
- Text is legible with sufficient contrast
- Navigation is visible and indicates current page
- Interactive elements are present and styled
- Mobile layout is properly responsive
- Component boundaries don't cause visual artifacts

### Phase 7: Fix & Re-validate (max 3 cycles)
Fix issues, re-run Playwright, re-review. Focus on:
1. Critical: broken navigation, missing pages, unreadable text
2. High: broken interactions, missing user story components
3. Medium: styling inconsistencies, responsive issues
4. Low: animation polish, micro-interaction refinement

### Phase 8: Complete
Report final status:
- File inventory (count and list)
- Page count
- Component count (from transfer manifest)
- User story coverage (implemented / total)
- Data model count (confirmed vs speculated)
- Speculated fields list
- Known limitations or incomplete items
- Screenshots captured

## Iterate Mode Specifics

When `mode` is `iterate`:
1. Read all existing files from `previousOutputDir`
2. Read the UPDATED PRODUCTION-SPEC.md (which contains delta instructions)
3. Identify which files need modification based on the delta
4. Modify only affected files — don't regenerate unchanged pages
5. Update transfer-manifest.json with new iteration entry
6. Update user-story-checklist.json if stories changed
7. Re-validate modified pages
8. In the README, document what changed in this iteration

## Completion Gate

A production build is complete ONLY when:
- All pages from the spec have HTML files
- style.css and app.js are non-empty and functional
- transfer-manifest.json maps every page and component
- user-story-checklist.json covers all stories from the spec
- component-reconciliation.json shows 0 gaps and 100% user story coverage
- All `[DATA: ...]` references have corresponding mock data in app.js
- Playwright validation ran successfully
- No critical visual bugs remain
- README.md documents the build
