# Component Reconciliation System

## Problem

When generating a large production frontend (10+ pages, 30+ components), the subagent can miss components, forget to map data sources, or produce incomplete props lists in the transfer manifest. This makes the manifest unreliable for framework migration.

## Solution: Pre-Registration + Post-Generation Reconciliation

A two-phase verification system that catches gaps before they reach the final output.

## Phase 1: Pre-Registration (Phase 2.5 in workflow)

Before writing any HTML, the subagent creates a component registry from the production spec.

```
PRODUCTION-SPEC.md → component-registry.json
```

Every section defined in the spec gets a pre-registered entry:
- Component name
- Expected props (with types)
- Data source (query/mutation)
- User stories covered
- Status: `pending`

This serves as a **generation checklist**. As each component is written in HTML, its status updates to `generated`.

## Phase 2: Reconciliation (Phase 3.5 in workflow)

After all HTML files are written, the subagent runs a 5-step reconciliation:

### Step 1 — Extract from HTML
Parse all HTML files for `<!-- [COMPONENT: ...] -->` boundary comments.
Build an "actual" component inventory.

### Step 2 — Diff Against Registry
```
Expected (from registry)  vs  Actual (from HTML)
─────────────────────────     ────────────────────
HeroSection: pending     →    HeroSection: found     ✓ Match
ProjectGrid: pending     →    ProjectGrid: found     ✓ Match
FilterBar: pending       →    (not found)            ✗ Gap
(not registered)         →    BreadcrumbNav: found   + Addition
```

- **Gaps**: Components expected but not generated — must be added
- **Additions**: Components generated but not pre-registered — must be documented
- **Mismatches**: Props or data sources differ between registry and HTML — must be reconciled

### Step 3 — Verify Data Model References
For every `[DATA: getProjects()]` comment:
- Check that `getProjects` exists in the mock data store in app.js
- Check that the returned data shape matches the schema from the production spec
- Flag orphaned data references

### Step 4 — Verify User Story Coverage
For every user story in the spec:
- Check that at least one component claims coverage
- Check that the claiming component's page has the necessary interactive elements
- Flag uncovered stories

### Step 5 — Write Report
Output: `validation/component-reconciliation.json`

```json
{
  "timestamp": "2026-02-28T12:00:00Z",
  "totalExpected": 35,
  "totalGenerated": 37,
  "totalMatched": 33,
  "gaps": [
    { "component": "FilterBar", "page": "projects.html", "reason": "not generated" }
  ],
  "additions": [
    { "component": "BreadcrumbNav", "page": "*.html", "reason": "navigation component added during generation" }
  ],
  "propMismatches": [],
  "dataMismatches": [],
  "userStoryCoverage": {
    "total": 15,
    "covered": 15,
    "uncovered": [],
    "percentage": "100%"
  }
}
```

## Completion Requirement

The reconciliation must show:
- **0 gaps** (all expected components generated)
- **100% user story coverage** (all stories mapped to components)
- **0 data mismatches** (all `[DATA: ...]` references have mock data)

If any of these fail, the subagent must fix the issues before proceeding to Playwright validation.

## How This Improves Transfer Manifest Completeness

Without reconciliation:
```
Spec says 35 components → Subagent writes HTML → Manually writes manifest → Misses 3 components
```

With reconciliation:
```
Spec says 35 components → Pre-register 35 → Write HTML → Reconcile → Catch 2 gaps → Fix → Manifest matches 100%
```

The reconciliation step acts as an automated integrity check between what was planned and what was generated.
