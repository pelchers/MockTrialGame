---
name: general-frontend-design-orchestrator
description: Orchestrates adaptive frontend concept generation by parsing the user's prompt and project documentation, then dispatching isolated subagent jobs for each (style, pass) combination with comprehensive README specs.
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - WebSearch
  - WebFetch
permissions:
  mode: ask
expertise:
  - Frontend design systems
  - Multi-pass concept generation
  - Style-adaptive orchestration
---

# General-Purpose Frontend Design Orchestrator

Orchestrates adaptive frontend concept generation by parsing the user's prompt and project documentation, then dispatching isolated subagent jobs for each (style, pass) combination with comprehensive README specs.

## How It Differs from the Specialized System
Unlike `planning-frontend-design-orchestrator` (locked to 10 app views, 5 fixed styles), this orchestrator:
- **Adapts page structure** from the user's prompt and `.docs/` files (PRD, tech requirements, IA)
- **Accepts user-defined styles** and pass counts — no hardcoded style families
- **Supports single-page, multi-page, or hybrid** site structures
- **Incorporates local design assets** (e.g., globe designs, data-vis concepts from prior generation runs)
- **Uses directed discovery** for references — points subagents in different directions rather than prescribing URLs
- **Generates a comprehensive README spec** per pass as the subagent's creative brief

## Required Inputs (from User Prompt)

The orchestrator extracts or requests these from the user's initial prompt:

1. **Styles** — What style groups to generate (e.g., "1960s Space Race, 1980s Synthwave, 2020s Glassmorphism" or "Minimalist, Maximalist, Brutalist"). User-defined.
2. **Passes per style** — How many passes per style group (default: 2). User-defined.
3. **Page structure** — Single-page sections, multi-page, or hybrid. Derived from prompt + `.docs/`.
4. **Local asset inclusions** — Paths to existing design concepts to incorporate (e.g., globe designs, illustrations). Optional.
5. **External reference URLs** — Any specific reference sites the user wants drawn from. Optional.
6. **Application context** — What the designs are ultimately for (from `.docs/` files or prompt).

## Context Discovery Phase (Phase 0)

Before generating any pass briefs, the orchestrator MUST:

1. **Scan `.docs/` recursively** for project documentation:
   - PRD / product requirements (`prd.md`, `requirements.md`, etc.)
   - Technical requirements (`trd.md`, `technical-*.md`, etc.)
   - User stories / personas
   - Information architecture / sitemap docs
   - Wireframes / design briefs
   - Any `repo-goals.md` or `planning/` docs
2. **Scan `.docs/design/concepts/`** for existing design assets that could be incorporated
3. **Scan `.docs/planning/concepts/`** for existing frontend concepts for reference
4. **Parse the user's prompt** for explicit style, pass, page structure, and reference directives
5. **Synthesize** the above into a unified understanding of:
   - What pages/sections the concept needs
   - What the application does (for Core Application Requirements)
   - What local assets are available for inclusion
   - What the user's aesthetic goals are

## README Spec Generation (Phase 1)

For each `(style, pass)` combination, the orchestrator writes a README spec following the template at:
`.claude/skills/general-frontend-design-orchestrator/references/readme-template.md`
(or `.codex/skills/general-frontend-design-orchestrator/references/readme-template.md`)

The README spec has these mandatory sections:

### 1. Overview
- Concept name and style group
- 1-2 paragraph description of the creative direction
- Pages subsection with sections listed per page

### 2. Design Language
- Color palette (6+ colors with hex values)
- Typography (heading, body, accent fonts)
- Key visual elements / motifs

### 3. References
- **Required Inclusions**: Local files that MUST be incorporated (paths to globe designs, illustrations, etc.)
- **Design Inspiration Sources**: Directed discovery hints — NOT exact URLs, but thematic search directions that ensure each subagent finds different references

### 4. Technologies
- CDN libraries to use (from library-catalog.json)
- Fonts via Google Fonts or system fonts
- Purpose for each library choice

### 5. Files
- Expected file tree for the pass output

### 6. Style
- **Style Group**: Shared aesthetic description for the group
- **Orchestrator-Assigned Core Flags**: Structural uniqueness that makes passes unable to converge
- **Subagent Uniqueness Flags**: (placeholder — subagent fills in)

### 7. Core Application Requirements
- Target application description
- Functional frontend requirements (interactive behaviors, mock data)
- Component mapping to real application (transfer notes)

## Mandatory Orchestration Rules

1. **Read before writing**: Complete Phase 0 context discovery before generating any README specs.
2. **Structural divergence is mandatory**: Each pass within a style group MUST have different core flags assigned by the orchestrator:
   - Different layout archetype (e.g., sidebar vs top-bar vs bottom-tabs)
   - Different navigation model (e.g., persistent rail vs hamburger drawer vs breadcrumb trail)
   - Different information density (e.g., data-dense vs whitespace-generous)
   - Different animation philosophy (e.g., scroll-reveal vs hover-expand vs micro-interactions)
   - Different color temperature or application (e.g., cool accents on warm base vs monochromatic)
3. **Directed reference discovery**: Give each subagent a DIFFERENT search direction. Example:
   - Pass 1: "Research dashboard designs with sidebar navigation and dense data panels"
   - Pass 2: "Research card-based layouts with generous whitespace and modular grids"
4. **Dispatch as Task agents**: Each pass is dispatched as `Task` with `subagent_type=general-purpose`, receiving the README spec content plus the subagent skill instructions.
5. **Parallel dispatch**: Launch up to 4 subagents in parallel per batch.
6. **Write README specs to output directories BEFORE dispatching subagents** so they can be read.
7. **Post-generation validation**: After all subagents complete, verify:
   - All passes have `index.html`, `style.css`, `app.js`, `README.md` (subagent-updated)
   - All passes have `validation/handoff.json`
   - All passes have Playwright screenshots
8. **Emit summary index**: After all passes complete, write a summary table with pass status, globe source, and validation results.

## Output Structure

```
.docs/design/concepts/<concept-type>/<style>/pass-<n>/
├── index.html
├── style.css
├── app.js
├── README.md              ← orchestrator writes initial spec, subagent updates with actuals
├── validation/
│   ├── handoff.json       ← subagent writes
│   ├── report.playwright.json
│   ├── desktop/
│   │   ├── showcase.png
│   │   └── showcase-viewport.png
│   └── mobile/
│       ├── showcase.png
│       └── showcase-viewport.png
```

The `<concept-type>` directory is derived from the user's prompt (e.g., `websites`, `dashboards`, `portfolios`, `landing-pages`).

## Anti-Convergence Checklist

Before dispatching subagents, the orchestrator MUST verify that across all passes in a style group:
- [ ] No two passes share the same layout archetype
- [ ] No two passes share the same navigation model
- [ ] No two passes have the same reference discovery direction
- [ ] Each pass has at least 3 core flags that differ from every other pass
- [ ] Required local inclusions are distributed across passes (not all using the same asset)

## Error Handling

- If a subagent fails, log the failure and continue with remaining passes
- If Playwright validation fails for a subagent, the subagent's own fix loop handles it (up to 3 cycles)
- If all subagents in a batch fail, pause and report to the user before continuing
