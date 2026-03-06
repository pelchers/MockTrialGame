# Architecture

## System Components

The frontend planning system uses a two-tier agent architecture:

```
┌─────────────────────────────────────────┐
│  Planning Frontend Design Orchestrator  │
│  (Coordinator / Dispatcher)             │
├─────────────────────────────────────────┤
│  Reads configs & catalogs               │
│  Builds creative briefs per pass        │
│  Dispatches parallel subagents          │
│  Runs validation after generation       │
│  Produces summary index                 │
└───────┬──────┬──────┬──────┬──────┬─────┘
        │      │      │      │      │
        ▼      ▼      ▼      ▼      ▼
   ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐
   │Sub 1││Sub 2││Sub 3││Sub 4││Sub 5│  (parallel)
   └─────┘└─────┘└─────┘└─────┘└─────┘
   Each generates one (style, pass) concept
```

### Orchestrator

**Location**: `.claude/agents/planning-frontend-design-orchestrator/AGENT.md` + `.claude/skills/planning-frontend-design-orchestrator/SKILL.md`

**Responsibilities**:
1. Read `style-config.json` to identify styles and pass counts
2. Read `layout-uniqueness-catalog.json` for structural profiles
3. Read `external-inspiration-catalog.json` for per-pass references
4. Read `product-context.md` for app-specific content requirements
5. Build a comprehensive creative brief for each (style, pass) combination
6. Dispatch each pass as an isolated Claude Code Task agent
7. Run Playwright screenshot validation on completed passes
8. Perform visual quality review (mandatory gate)
9. Run uniqueness validation across all passes
10. Write orchestration logs and summary index

**Concurrency**: Up to 5 subagents dispatched in parallel (configurable).

### Subagent

**Location**: `.claude/agents/frontend-design-subagent/AGENT.md` + `.claude/skills/frontend-design-subagent/SKILL.md`

**Responsibilities**:
1. Receive creative brief from orchestrator
2. Generate a complete 10-view navigable app from scratch
3. Apply the assigned uniqueness profile, palette, typography, interactions
4. Use product context for all mock content (labels, data, terminology)
5. Use content persona for visual tone and metaphor
6. Produce all required output files

**Isolation Rules**:
- Must NOT read sibling pass folders
- Must NOT read other style folders
- Works only from the provided creative brief + own creative judgment

## Key Design Decisions

### Template-Free Generation
Each pass is written from scratch by the AI agent. There are no HTML templates, no CSS starter files, no boilerplate scripts. This eliminates the "template sameness" problem where all passes look like variations of the same base.

### Agent-Driven Uniqueness
Uniqueness is not achieved by rotating CSS class names or swapping color tokens. Instead, each pass receives a structurally different creative brief:
- Different layout architecture (from uniqueness catalog)
- Different typography choices
- Different interaction profiles
- Different view-level component directives
- Explicit anti-repeat constraints banning elements from prior passes

### Separation of Content Layers
Product context (what the app IS) and content persona (how the design FEELS) are independent inputs. This means:
- All passes use the same real app terminology
- Each pass has a unique visual personality
- Changing the product spec doesn't require changing any style definitions
- Adding a new style doesn't require re-reading the PRD

### Parallel Dispatch
Subagents run in parallel (up to concurrency limit) because they are fully isolated. No subagent needs output from another subagent.

## File Flow

```
INPUT FILES:
  style-config.json ─────────────┐
  layout-uniqueness-catalog.json ─┤
  external-inspiration-catalog.json ┤──→ ORCHESTRATOR ──→ Creative Brief
  product-context.md ─────────────┤
  available-libraries.json ───────┤
  asset-sources.json ─────────────┘

CREATIVE BRIEF ──→ SUBAGENT ──→ OUTPUT FILES:
                                   index.html
                                   style.css
                                   app.js
                                   README.md
                                   validation/handoff.json
                                   validation/inspiration-crossreference.json

OUTPUT FILES ──→ PLAYWRIGHT VALIDATOR ──→ Screenshots:
                                           validation/desktop/<view>.png
                                           validation/mobile/<view>.png
```
