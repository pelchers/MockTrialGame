---
name: production-frontend-orchestrator
description: Orchestrate production-quality frontend generation by performing comprehensive repository discovery, building a production spec from app docs/user stories/schemas, and dispatching the production subagent with a chosen design direction.
agent: .claude/agents/production-frontend-orchestrator/agent.md
---

# Production Frontend Orchestrator

## Purpose

Generate a production-quality frontend prototype from your application's actual requirements. Unlike the general/exploration agent which creates many divergent concepts, this orchestrator creates one convergent, fully functional frontend that matches your app's real data models, user stories, and interactivity requirements.

## Invocation

The user invokes this skill with a source mode and optional parameters:

### Mode 1: Style Transfer
```
Source mode: style-transfer
Source URL: <url of website to extract design from>
Modifications: <optional changes>
Output dir: <optional, defaults to .docs/production/frontend/>
```

### Mode 2: Template Basis
```
Source mode: template-basis
Template dir: <path to existing concept pass>
Modifications: <optional changes>
Output dir: <optional, defaults to .docs/production/frontend/>
```

### Mode 3: Custom Direction
```
Source mode: custom-direction
Design direction: <written description of desired visual direction>
Modifications: <optional changes>
Output dir: <optional, defaults to .docs/production/frontend/>
```

### Iteration Mode (any source mode)
```
Previous output dir: <path to previous production output>
Delta instructions: <what to change>
```

## Workflow

### Step 1: Comprehensive Repository Discovery

Search the ENTIRE repository for application context. This is the critical differentiator from the general agent — you must find everything.

**Documentation Discovery:**
- Search `.docs/` and `docs/` recursively for all `.md` and `.json` files
- Search `.adr/` and `adr/` for architecture decision records
- Read every file that appears to contain: requirements, features, specifications, data models, API docs, route structure, UI specs

**User Story Discovery:**
- Search all directories for user story files (various naming conventions)
- Search for acceptance criteria patterns (Given/When/Then, As a/I want/So that)
- Compile a complete user story inventory

**Schema Discovery (Multi-Source Inference Pipeline):**

Run a layered schema inference process. Each layer adds confidence. Fields discovered at higher layers override lower ones.

**Layer 1 — Formal Schemas** (confidence: `schema`):
- Search for Convex schemas (`convex/schema.ts`, `convex/schema.js`)
- Search for Prisma schemas (`prisma/schema.prisma`, `schema.prisma`)
- Search for TypeScript type/interface definitions (`types/*.ts`, `interfaces/*.ts`, `*.d.ts`)
- Search for Zod validation schemas (`*.schema.ts`, `*Schema.ts`, `schemas/*.ts`)
- Search for JSON Schema files (`*.schema.json`)
- Use exact field names, types, and relationships as-is

**Layer 2 — Code-Derived Schemas** (confidence: `code-derived`):
- Search for destructuring patterns: `const { title, description, status } = project`
  ```
  Grep: "const \\{.*\\} = " in **/*.ts, **/*.tsx, **/*.js
  ```
- Search for component prop types: `{ project }: { project: Project }`
  ```
  Grep: "interface.*Props|type.*Props" in **/*.ts, **/*.tsx
  ```
- Search for form field names: `name="project.title"` or `register("title")`
  ```
  Grep: "name=\"|register\\(" in **/*.tsx, **/*.html
  ```
- Search for seed/fixture/factory files that create mock records:
  ```
  Glob: **/seed*.ts, **/fixture*.ts, **/factory*.ts, **/mock*.ts
  ```
- Search for database migration files:
  ```
  Glob: **/migrations/**/*.ts, **/migrations/**/*.sql
  ```

**Layer 3 — UI-Derived Schemas** (confidence: `ui-derived`):
- Search docs for table column descriptions (imply entity fields)
- Search docs for form field lists in UI specs or wireframes
- Search docs for filter/sort options (imply sortable/filterable fields)
- Search docs for dashboard stat descriptions ("total projects" implies Project entity with count query)
- Search user stories for field references ("user enters project title" implies Project.title)

**Layer 4 — Domain Convention Inference** (confidence: `convention`):
For common entities (User, Project, Task, Comment, etc.), apply standard conventions:
- `id: string` (primary key)
- `createdAt: datetime`, `updatedAt: datetime` (timestamps)
- `ownerId: string` or `userId: string` (ownership)
- `title: string`, `name: string` (display name)
- `description: string` (long text)
- `status: enum` (state machine)
Mark these as `[CONVENTION]` — the subagent knows they're likely but unconfirmed.

**Layer 5 — Pure Speculation** (confidence: `speculated`):
Only if layers 1-4 produced nothing for an entity that the app clearly needs.
Mark these as `[SPECULATED]` with a note explaining the reasoning.

After running all layers, write `schema-inference-report.json`:
```json
{
  "entities": [
    {
      "name": "Project",
      "fields": [
        { "name": "id", "type": "string", "confidence": "schema", "source": "convex/schema.ts:15" },
        { "name": "title", "type": "string", "confidence": "schema", "source": "convex/schema.ts:16" },
        { "name": "assigneeId", "type": "string", "confidence": "code-derived", "source": "components/ProjectCard.tsx:8 (destructured)" },
        { "name": "dueDate", "type": "datetime", "confidence": "ui-derived", "source": ".docs/features/projects.md (table columns)" },
        { "name": "updatedAt", "type": "datetime", "confidence": "convention", "source": "standard timestamp field" }
      ],
      "relationships": [
        { "field": "assigneeId", "target": "User.id", "confidence": "code-derived" }
      ]
    }
  ],
  "summary": {
    "totalEntities": 0,
    "fieldsByConfidence": { "schema": 0, "code-derived": 0, "ui-derived": 0, "convention": 0, "speculated": 0 },
    "entitiesWithNoFormalSchema": ["<names>"]
  }
}
```

**Frontend Structure Discovery:**
- Search for existing components, pages, layouts
- Search for Tailwind config, theme files
- Search for package.json to understand dependencies
- Read route structure from app directory or pages directory

**Testing Discovery:**
- Search for Playwright tests, Jest tests
- These reveal expected behavior and can inform interactivity requirements

### Step 2: Design Source Processing

Based on source mode, extract or build the design system:

**Style Transfer:**
1. WebFetch the source URL
2. Extract: colors, typography, layout, nav, cards, animations, spacing
3. Document as a design system specification
4. Apply user modifications

**Template Basis:**
1. Read handoff.json, style.css, README.md from the template pass
2. Extract the complete CSS custom property system
3. Note layout archetype, nav model, interaction patterns
4. Apply user modifications

**Custom Direction:**
1. WebSearch for 2-3 references matching the direction
2. Extract common patterns
3. Build design system from direction + references
4. Apply user modifications

### Step 3: Production Spec Generation

Write `PRODUCTION-SPEC.md` to the output directory using the template at:
`.claude/skills/production-frontend-orchestrator/references/production-spec-template.md`

The spec must include ALL of the following:
1. Application overview
2. Complete page/route structure with data requirements per page
3. Data model specification (confirmed from schemas or speculated from docs)
4. User story mapping (every story mapped to a page + component)
5. Design system (from source mode processing)
6. Interactivity requirements (every form, filter, sort, drag, modal, etc.)
7. User modifications (if any)
8. Iteration context (if iterating)
9. Transfer intent (target framework mapping)

Also write `discovery-report.json`:
```json
{
  "timestamp": "<ISO>",
  "sourceMode": "<mode>",
  "documentsFound": {
    "requirements": ["<paths>"],
    "userStories": ["<paths>"],
    "schemas": ["<paths>"],
    "adr": ["<paths>"],
    "components": ["<paths>"],
    "tests": ["<paths>"],
    "config": ["<paths>"]
  },
  "dataModels": {
    "confirmed": ["<entity names with formal schemas>"],
    "codeDerived": ["<entity names inferred from code>"],
    "uiDerived": ["<entity names inferred from UI docs>"],
    "convention": ["<entity names using standard conventions>"],
    "speculated": ["<entity names with no evidence>"]
  },
  "schemaInferenceReport": "schema-inference-report.json",
  "userStoryCount": 0,
  "pageCount": 0,
  "componentCount": 0
}
```

Also write `schema-inference-report.json` (see Schema Discovery section above for format).

### Step 4: Determine Page Structure

Based on discovered app requirements:
- **Multi-page** (default for apps with distinct functional areas): Each major route gets its own HTML file
- **Single-page** (for simple apps or user directive): All sections in index.html with hash routing
- **Hybrid**: Main SPA with auxiliary pages (e.g., auth pages separate from dashboard)

The user can override this with explicit direction.

### Step 5: Dispatch Production Subagent

Dispatch a Task agent with `subagent_type=general-purpose`:

Provide in the prompt:
- Full path to PRODUCTION-SPEC.md
- Output directory path
- Skill path: `.claude/skills/production-frontend-subagent`
- Library catalog path: `.claude/skills/production-frontend-subagent/references/library-catalog.json`
- Validation script path: `.claude/skills/production-frontend-subagent/scripts/validate-production-playwright.mjs`
- Mode: `fresh` or `iterate`
- Previous output dir (if iterating)
- Summary of key requirements (page count, user story count, data model count)
- Explicit instruction to read the PRODUCTION-SPEC.md first

### Step 6: Post-Dispatch Validation

After subagent completes:
1. Verify all expected HTML files exist (one per page in the spec)
2. Verify style.css and app.js exist and are non-empty
3. Verify transfer-manifest.json exists with complete page/component mapping
4. Verify user-story-checklist.json exists with coverage for all discovered stories
5. Verify Playwright screenshots were captured
6. Report final status to user

## Iteration Workflow

When `previousOutputDir` is set:
1. Read the previous `PRODUCTION-SPEC.md` and `transfer-manifest.json`
2. Parse `deltaInstructions` into specific, actionable changes
3. Generate an updated PRODUCTION-SPEC.md that:
   - Preserves all unchanged specifications
   - Clearly marks what changed (with `[DELTA]` prefix)
   - Includes the full previous spec for context
4. Dispatch subagent in `iterate` mode
5. Subagent modifies existing files rather than regenerating everything

## Quality Gates

The orchestrator must verify before dispatching:
- [ ] At least 1 page/route identified
- [ ] Design system has minimum: 6 colors, 2 font families, spacing scale
- [ ] If user stories found: at least 50% mapped to pages
- [ ] If schemas found: all entities documented in data model spec
- [ ] Modifications (if any) are specific and actionable

## Error Handling

- If no documentation found: Warn user, ask for guidance on app requirements
- If source URL unreachable (style-transfer): Warn user, suggest alternatives
- If template dir doesn't exist (template-basis): Error with available pass paths
- If no user stories found: Continue without story mapping, note in discovery report
- If no formal schemas found (Layer 1 empty): Proceed through Layers 2-5, report confidence breakdown in schema-inference-report.json
- If all schema layers empty for an entity: Mark as `[SPECULATED]`, include reasoning in report, warn user in discovery report
- If schema inference finds contradictions between layers: Higher-confidence layer wins, note contradiction in report
