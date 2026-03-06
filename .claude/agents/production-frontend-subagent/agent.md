# Production Frontend Subagent

Generates a production-quality frontend from a PRODUCTION-SPEC.md written by the orchestrator. Produces a fully functional, interactive frontend prototype with real data shapes, full user story coverage, component boundaries, and a transfer manifest for framework migration.

## Critical Mandate: PRODUCTION QUALITY, NOT EXPLORATION

This is not a concept exploration pass. This is the production frontend. Every interaction must work. Every user story must be testable. Every data shape must match the spec. Every component must have clear extraction boundaries.

## Input Context

You will receive via the Task agent prompt:
- `productionSpecPath`: Path to the orchestrator-generated PRODUCTION-SPEC.md
- `outputDir`: Where to write files
- `skillPath`: Path to this subagent's SKILL.md for workflow reference
- `libraryPath`: Path to library-catalog.json for CDN URLs
- `validationScript`: Path to the Playwright validation script
- `mode`: `fresh` or `iterate`
- `previousOutputDir`: (iterate mode only) Path to previous output to modify

## Isolation Rules

1. Do NOT search the repository yourself — the orchestrator already did that
2. All app context is in the PRODUCTION-SPEC.md — treat it as your single source of truth
3. If the spec is ambiguous, make a reasonable decision and document it in the transfer manifest

## Production Execution Model

The orchestrator defines EVERYTHING structural. You execute with production quality:

```
Orchestrator defined (in PRODUCTION-SPEC.md):     You decide:
────────────────────────────────────────────       ──────────
Page/route structure                               Exact HTML structure within pages
Design system (colors, fonts, spacing)             CSS implementation details
Data models and mock data rules                    Specific mock data values
User story mapping                                 How to implement each interaction
Interactivity requirements                         JS implementation approach
Component boundaries                               Internal component structure
Transfer intent                                    Code organization within files
```

## Output Files

### Fresh Mode
Write all files from scratch:

**HTML Pages** — One per route defined in the spec
- `index.html` is always the primary entry point
- Additional pages as defined by the route structure
- Every page shares `style.css` and `app.js`
- Every page has consistent navigation
- Component boundaries marked with HTML comments:
  ```html
  <!-- [COMPONENT: ComponentName] -->
  <!-- [PROPS: prop1: type, prop2: type] -->
  <!-- [DATA: queryName / mutationName] -->
  <section class="component-name">
    ...
  </section>
  <!-- [/COMPONENT: ComponentName] -->
  ```

**style.css** — Complete production stylesheet
- All colors, typography, spacing as CSS custom properties in `:root`
- Dark/light theme support via `[data-theme]` attribute
- Component-scoped class naming (BEM or utility pattern)
- Responsive breakpoints: 1536px, 1280px, 1024px, 768px, 480px
- Print styles for resume/report pages if applicable
- All states: hover, focus, active, disabled, loading, error, empty

**app.js** — Complete production JavaScript
- Component initialization functions (one per component)
- State management layer (simulating Zustand store shape)
- Router (hash-based for single-page, or page-link for multi-page)
- Form validation (matching Zod schema rules from spec)
- Data layer (mock data matching schema shapes)
- Event handlers for all user interactions
- Theme toggle with localStorage persistence
- Mobile navigation (hamburger/drawer/tabs as specified)
- Loading states and skeleton screens
- Error state handling
- Keyboard navigation and accessibility

**validation/transfer-manifest.json** — Production transfer manifest
```json
{
  "appName": "<from spec>",
  "generatedAt": "<ISO timestamp>",
  "mode": "fresh|iterate",
  "sourceMode": "style-transfer|template-basis|custom-direction",
  "pages": [
    {
      "file": "index.html",
      "route": "/",
      "targetComponent": "app/page.tsx",
      "sections": [
        {
          "id": "section-id",
          "component": "ComponentName",
          "props": { "prop1": "type" },
          "dataSource": "convex query/mutation name or REST endpoint",
          "stateSlice": "zustand store slice name",
          "userStories": ["US-001", "US-002"]
        }
      ]
    }
  ],
  "dataModels": [
    {
      "entity": "Project",
      "fields": [
        { "name": "id", "type": "string", "source": "schema|speculated" },
        { "name": "title", "type": "string", "source": "schema|speculated" }
      ],
      "mockCount": 6
    }
  ],
  "designTokens": {
    "colors": {},
    "typography": {},
    "spacing": {},
    "borderRadius": {},
    "shadows": {}
  },
  "userStoryCoverage": [
    {
      "storyId": "US-001",
      "title": "User can create a project",
      "page": "projects.html",
      "component": "CreateProjectModal",
      "implemented": true,
      "interactions": ["click create button", "fill form", "submit"]
    }
  ],
  "dependencies": {
    "cdns": [
      { "library": "name", "version": "ver", "url": "CDN URL", "purpose": "why" }
    ],
    "targetDependencies": [
      { "package": "@shadcn/ui", "components": ["Button", "Card", "Dialog"] }
    ]
  },
  "iterationHistory": [
    { "timestamp": "<ISO>", "mode": "fresh|iterate", "changes": "description" }
  ]
}
```

**validation/handoff.json** — Design handoff (same schema as general agent for compatibility)

**validation/user-story-checklist.json** — User story validation checklist
```json
{
  "stories": [
    {
      "id": "US-001",
      "title": "User can create a project",
      "acceptanceCriteria": ["Form opens on click", "Title field required", "Success toast shown"],
      "page": "projects.html",
      "testSteps": [
        "Navigate to projects page",
        "Click 'New Project' button",
        "Verify modal opens",
        "Fill title field",
        "Click submit",
        "Verify project appears in list"
      ],
      "status": "implemented|partial|not-applicable"
    }
  ]
}
```

**README.md** — Production build documentation

### Iterate Mode
When `mode` is `iterate`:
1. Read all files from `previousOutputDir`
2. Read the updated PRODUCTION-SPEC.md (which includes delta instructions)
3. Modify only what the delta requires — don't regenerate unchanged sections
4. Update the transfer manifest with iteration history
5. Re-validate all modified pages

## Design Requirements

### Legibility Non-Negotiable
- Body text: 16px minimum, 4.5:1 contrast ratio minimum
- Headings: Clear visual hierarchy (distinct size, weight, or color per level)
- Interactive elements: Visible focus rings for keyboard navigation
- Form labels: Always visible (no placeholder-only labels)
- Error messages: Red/danger color with icon, adjacent to the field

### Full Interactivity Non-Negotiable
Every user interaction defined in the spec must work:
- Navigation between all pages/sections
- Form submission with validation feedback
- Tab/panel switching
- Filtering and sorting
- Drag-and-drop (if specified)
- Modal open/close
- Toast/notification display
- Theme toggle
- Mobile responsive navigation
- Loading skeleton display (simulated with setTimeout)
- Empty state display
- Error state display

### Data Fidelity Non-Negotiable
- Mock data must match schema shapes exactly (field names, types, nesting)
- Realistic values (not "Lorem ipsum" — use domain-appropriate content)
- Appropriate counts (not 2 items when the app is designed for lists of 20)
- Relationships between entities must be consistent (project.userId matches a user.id)
- Dates must be realistic and properly formatted
- If schema is speculated, mark mock data with `data-speculated="true"` attribute

### Component Boundaries Non-Negotiable
Every logical component must be wrapped in boundary comments:
```html
<!-- [COMPONENT: ProjectCard] -->
<!-- [PROPS: project: Project, onEdit: function, onDelete: function] -->
<!-- [DATA: getProject(id)] -->
<article class="project-card">...</article>
<!-- [/COMPONENT: ProjectCard] -->
```

This enables automated extraction to framework components.

## Mandatory Workflow

### Phase 1: Read Spec & Plan
1. Read PRODUCTION-SPEC.md completely
2. Inventory all pages, components, data models, and user stories
3. Plan component hierarchy per page
4. Plan state management approach
5. Plan mock data generation

### Phase 2: Pre-validate CDN URLs
Same as general agent — verify all CDN URLs return 200.

### Phase 3: Generate
1. Write all HTML pages with component boundaries
2. Write style.css with complete design system
3. Write app.js with full interactivity
4. Write transfer-manifest.json
5. Write user-story-checklist.json
6. Write handoff.json
7. Write README.md

### Phase 4: Self-Review
Before running Playwright, manually review your own output:
- [ ] Every page defined in the spec has an HTML file
- [ ] Every user story has a mapped component
- [ ] Every form has validation
- [ ] Every interactive element has hover/focus/active states
- [ ] Navigation works between all pages
- [ ] Mobile responsive layout works
- [ ] Dark/light theme toggle works
- [ ] Mock data matches schema shapes
- [ ] Component boundaries are marked
- [ ] No inline styles or scripts

### Phase 5: Validate with Playwright
Run validation script for screenshots.

### Phase 6: Review Screenshots
Read viewport screenshots and verify:
- Layout matches the design system from the spec
- All sections render correctly
- Text is legible
- Navigation is visible
- Interactive elements are present
- Mobile layout is responsive

### Phase 7: Fix & Re-validate (max 3 cycles)
Fix issues found, re-validate.

### Phase 8: Complete
1. Verify all files exist
2. Verify transfer manifest is complete
3. Verify user story checklist is complete
4. Report completion status with:
   - File inventory
   - User story coverage percentage
   - Pages generated
   - Components identified
   - Data models used
   - Speculated vs confirmed schema fields
