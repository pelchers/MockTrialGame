# Production Frontend Orchestrator

Orchestrates the generation of a production-quality frontend from application documentation, user stories, and a chosen design direction. Performs comprehensive repository discovery, builds a production spec, and dispatches the production subagent.

## Critical Mandate: COMPREHENSIVE DISCOVERY BEFORE DISPATCH

You must thoroughly search the repository for ALL relevant application documentation before generating a production spec or dispatching the subagent. The subagent cannot search — it only sees what you give it.

## Input Parameters

You will receive via the user prompt or Task agent prompt:

### Required
- `sourceMode`: One of `style-transfer`, `template-basis`, or `custom-direction`

### Source-Mode-Specific
- **style-transfer**: `sourceUrl` — URL of website to extract design patterns from
- **template-basis**: `templateDir` — Path to an existing concept pass folder (e.g., `.docs/design/concepts/portfolio/2020s/pass-5/`)
- **custom-direction**: `designDirection` — Written description of desired visual direction

### Optional
- `modifications` — User-specified changes to apply on top of the source (e.g., "keep dark theme but use sidebar nav", "make cards rounded", "change primary color to blue")
- `previousOutputDir` — Path to a previous production output for iteration mode
- `deltaInstructions` — What to change from the previous output (required when `previousOutputDir` is set)
- `outputDir` — Where to write output files (default: `.docs/production/frontend/`)
- `targetFramework` — Target framework for transfer notes (default: inferred from repo)

## Phase 1: Repository Discovery

Search the repository comprehensively for application context. Do NOT assume fixed paths — search broadly.

### 1.1 Application Documentation
Search `.docs/` and any `docs/` directories recursively for:
- Product requirements documents (PRD, requirements, specs)
- Feature specifications
- Data model documentation
- API documentation
- Route/page structure documentation
- UI/UX specifications
- Wireframes or design docs

```
Glob: .docs/**/*.md, docs/**/*.md, .docs/**/*.json, docs/**/*.json
Grep: "requirement|feature|specification|data model|schema|route|endpoint|API"
```

### 1.2 Architecture Decision Records
Search `.adr/` and `adr/` directories for:
- Technology decisions
- Architecture patterns
- Design system decisions
- Component structure decisions

```
Glob: .adr/**/*.md, adr/**/*.md
```

### 1.3 User Stories
Search broadly for user story files:
```
Glob: **/*user-stor*.md, **/*user_stor*.md, **/*userstor*.md
Glob: .docs/**/stories/**/*.md, docs/**/stories/**/*.md
Glob: **/*acceptance*.md, **/*scenario*.md
Grep: "As a .* I want|Given .* When .* Then|user story|acceptance criteria"
```

### 1.4 Data Models & Schemas
Search for existing schema definitions:
```
Glob: **/schema.ts, **/schema.js, **/schema.prisma, **/convex/schema.ts
Glob: **/*.schema.ts, **/*.model.ts, **/models/**/*.ts
Glob: **/types/**/*.ts, **/interfaces/**/*.ts
Grep: "defineSchema|defineTable|model |interface |type .*= \\{"
```

### 1.5 API Contracts
Search for API/backend function definitions:
```
Glob: **/api/**/*.ts, **/convex/**/*.ts, **/functions/**/*.ts
Glob: **/routes/**/*.ts, **/pages/api/**/*.ts, **/app/api/**/*.ts
Grep: "query\\(|mutation\\(|action\\(|export.*GET|export.*POST"
```

### 1.6 Existing Frontend Structure
Search for existing components, routes, and configuration:
```
Glob: **/components/**/*.tsx, **/components/**/*.jsx
Glob: **/app/**/page.tsx, **/app/**/layout.tsx, **/pages/**/*.tsx
Glob: tailwind.config.*, **/theme.ts, **/theme.js
Glob: package.json, tsconfig.json
```

### 1.7 Validation & Testing
Search for test files that reveal expected behavior:
```
Glob: **/*.test.ts, **/*.spec.ts, **/*.e2e.ts
Glob: **/playwright/**/*.ts, **/__tests__/**/*.ts
```

### 1.8 Existing Design Concepts
If using template-basis mode, read the template pass:
```
Read: <templateDir>/handoff.json
Read: <templateDir>/style.css
Read: <templateDir>/README.md
Read: <templateDir>/app.js (first 100 lines for structure)
Read: <templateDir>/index.html (first 100 lines for structure)
```

## Phase 2: Design Source Processing

### Style Transfer Mode
1. Use WebFetch to load the source URL
2. Extract observable design patterns:
   - Color palette (primary, secondary, accent, background, text)
   - Typography (font families, sizes, weights, hierarchy)
   - Layout structure (grid system, spacing rhythm, content width)
   - Navigation pattern (sidebar, top-bar, tabs, etc.)
   - Card/panel design (border-radius, shadows, borders)
   - Animation patterns (transitions, reveals, hover effects)
   - Information density (compact vs spacious)
3. Document extracted patterns in the production spec

### Template Basis Mode
1. Read the template pass's handoff.json for design tokens
2. Read style.css for the complete design system
3. Read README.md for the design language description
4. Extract all CSS custom properties as the base design system
5. Note the layout archetype, nav model, and interaction patterns
6. Apply user modifications on top of the extracted system

### Custom Direction Mode
1. Use WebSearch to find 2-3 reference sites matching the direction
2. Extract common patterns across references
3. Build a design system from the direction description + references

## Phase 3: Production Spec Generation

Write a comprehensive production spec to `<outputDir>/PRODUCTION-SPEC.md` containing:

### 3.1 Application Overview
- App name and purpose (from docs)
- Target users (from user stories)
- Core functionality summary

### 3.2 Page/Route Structure
For each page/route discovered:
- Route path
- Page purpose
- Key sections/components
- Data requirements (what queries/data it needs)
- User interactions (from user stories)
- State management needs

Determine single-page vs multi-page based on:
- If the app has 1-3 simple views: single-page with sections
- If the app has distinct functional areas (dashboard, settings, etc.): multi-page
- If the user explicitly requests one or the other: follow user direction

### 3.3 Data Model Specification
For each data entity:
- Field names and types
- Relationships between entities
- If schema exists: use exact field names and types
- If schema doesn't exist: speculate based on docs and mark with `[SPECULATED]`
- Mock data generation rules (realistic values, appropriate counts)

### 3.4 User Story Mapping
For each user story found:
- Story ID/title
- Acceptance criteria
- Which page/component implements it
- Required interactions (click, drag, type, navigate)
- Expected state changes
- Validation rules

### 3.5 Design System
From the chosen source mode:
- Complete color palette with CSS custom property names
- Typography scale (font families, sizes, weights, line-heights)
- Spacing system
- Border-radius scale
- Shadow system
- Layout grid specification
- Navigation pattern
- Animation/transition specifications
- Component patterns (cards, buttons, forms, tables, etc.)

### 3.6 Interactivity Requirements
- Form validation rules (from Zod schemas or docs)
- State management patterns (tab switching, filtering, sorting, drag-and-drop)
- Real-time features (if applicable)
- Authentication flows (login, signup, protected routes)
- Error states and loading states

### 3.7 Modifications
If user provided modifications, list each one explicitly with how it changes the base design.

### 3.8 Iteration Context (if applicable)
If `previousOutputDir` is set:
- What was built previously (read prior handoff.json/transfer manifest)
- What the user wants changed (deltaInstructions)
- What should be preserved from the previous version

### 3.9 Transfer Intent
- Target framework and architecture
- Component mapping strategy
- State management mapping
- Data fetching mapping
- Auth integration mapping

## Phase 4: Dispatch Subagent

Dispatch a single Task agent with `subagent_type=general-purpose`:

```
Provide to the subagent:
- productionSpecPath: <outputDir>/PRODUCTION-SPEC.md
- outputDir: <outputDir>
- skillPath: .claude/skills/production-frontend-subagent
- libraryPath: .claude/skills/production-frontend-subagent/references/library-catalog.json
- validationScript: .claude/skills/production-frontend-subagent/scripts/validate-production-playwright.mjs
- mode: "fresh" or "iterate"
- previousOutputDir: (if iterating)
```

## Phase 5: Post-Dispatch Validation

After the subagent completes:
1. Verify all expected files exist
2. Verify transfer manifest is complete
3. Verify user story coverage (each story has a mapped component)
4. Report completion status with file inventory

## Iteration Support

When `previousOutputDir` is provided:
1. Read the previous output's transfer manifest and PRODUCTION-SPEC.md
2. Parse `deltaInstructions` into specific changes
3. Generate an updated PRODUCTION-SPEC.md that preserves unchanged elements and specifies deltas
4. Dispatch subagent in `iterate` mode with both the original and delta context
5. The subagent will modify the previous output rather than regenerating from scratch

## Output Files (Orchestrator)

The orchestrator writes:
- `<outputDir>/PRODUCTION-SPEC.md` — Complete production specification
- `<outputDir>/discovery-report.json` — What was found during repository discovery
