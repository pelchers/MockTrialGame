# Schema Inference Pipeline

## Problem

When generating a production frontend, the subagent needs accurate data model shapes to produce realistic mock data and correct component props. But formal schemas (Convex, Prisma, TypeScript) may not exist or may be incomplete.

## Solution: Multi-Source Inference

A 5-layer pipeline that progressively builds entity definitions from multiple evidence sources, each with an explicit confidence level.

```
Layer 1: Formal Schemas     ── highest confidence ──  "schema"
Layer 2: Code-Derived        ── high confidence ────  "code-derived"
Layer 3: UI-Derived           ── medium confidence ─  "ui-derived"
Layer 4: Domain Conventions   ── low confidence ────  "convention"
Layer 5: Pure Speculation     ── lowest confidence ─  "speculated"
```

## Layer Details

### Layer 1 — Formal Schemas (confidence: `schema`)

**Sources searched:**
- `convex/schema.ts`, `convex/schema.js`
- `prisma/schema.prisma`, `schema.prisma`
- `types/*.ts`, `interfaces/*.ts`, `*.d.ts`
- `*.schema.ts`, `*Schema.ts`, `schemas/*.ts`
- `*.schema.json`

**Extraction**: Direct field name, type, and relationship parsing.

### Layer 2 — Code-Derived Schemas (confidence: `code-derived`)

**Sources searched:**
- Destructuring patterns: `const { title, description } = project`
- Component prop types: `interface ProjectCardProps { project: Project }`
- Form field names: `name="project.title"`, `register("title")`
- Seed/fixture/factory files
- Database migration files

**Extraction**: Infer entity name from variable context, field names from destructured properties, types from TypeScript annotations.

### Layer 3 — UI-Derived Schemas (confidence: `ui-derived`)

**Sources searched:**
- Table column descriptions in docs/wireframes
- Form field lists in UI specs
- Filter/sort option lists
- Dashboard stat descriptions
- User story field references

**Extraction**: Column names become field names, filter options imply enum types, stat queries imply aggregation fields.

### Layer 4 — Domain Convention Inference (confidence: `convention`)

**Applied to**: Common entity names (User, Project, Task, Comment, Team, etc.)

**Standard fields applied:**
| Field | Type | Rationale |
|-------|------|-----------|
| id | string | Primary key (universal) |
| createdAt | datetime | Creation timestamp |
| updatedAt | datetime | Modification timestamp |
| ownerId / userId | string | Ownership relationship |
| title / name | string | Display name |
| description | string | Long text content |
| status | enum | State machine |

### Layer 5 — Pure Speculation (confidence: `speculated`)

**Used only when**: Layers 1-4 produce zero evidence for an entity the app clearly needs.

**Requirement**: Must include reasoning for why the entity/field is believed to exist.

## Confidence Resolution

When multiple layers provide conflicting information for the same field:
- Higher-confidence layer always wins
- Contradiction is noted in the schema-inference-report.json
- Both values are preserved for review

## Output: schema-inference-report.json

Written by the orchestrator alongside PRODUCTION-SPEC.md:

```json
{
  "entities": [
    {
      "name": "Project",
      "fields": [
        { "name": "id", "type": "string", "confidence": "schema", "source": "convex/schema.ts:15" },
        { "name": "title", "type": "string", "confidence": "schema", "source": "convex/schema.ts:16" },
        { "name": "assigneeId", "type": "string", "confidence": "code-derived", "source": "components/ProjectCard.tsx:8" },
        { "name": "dueDate", "type": "datetime", "confidence": "ui-derived", "source": ".docs/features/projects.md" },
        { "name": "updatedAt", "type": "datetime", "confidence": "convention", "source": "standard timestamp" }
      ],
      "relationships": [
        { "field": "assigneeId", "target": "User.id", "confidence": "code-derived" }
      ]
    }
  ],
  "summary": {
    "totalEntities": 5,
    "fieldsByConfidence": { "schema": 12, "code-derived": 8, "ui-derived": 4, "convention": 10, "speculated": 2 },
    "entitiesWithNoFormalSchema": ["Notification", "Activity"]
  }
}
```

## How the Subagent Uses Schema Confidence

- `schema` and `code-derived` fields: Used directly in mock data, no markup needed
- `ui-derived` fields: Used in mock data, noted in transfer manifest
- `convention` fields: Used in mock data, marked with `data-speculated="true"` in HTML
- `speculated` fields: Used in mock data with `data-speculated="true"`, flagged in transfer manifest for review
