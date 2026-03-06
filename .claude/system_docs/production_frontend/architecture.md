# Production Frontend System — Architecture

## System Components

The production frontend system uses a two-tier agent architecture optimized for convergent, production-quality output rather than divergent exploration:

```
┌──────────────────────────────────────────────┐
│   Production Frontend Orchestrator           │
│   (Discovery / Spec Builder / Dispatcher)    │
├──────────────────────────────────────────────┤
│  Searches entire repo for app context        │
│  Runs multi-source schema inference          │
│  Extracts/builds design system               │
│  Writes PRODUCTION-SPEC.md                   │
│  Dispatches single production subagent       │
│  Validates completeness post-generation      │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  Production      │
         │  Subagent        │  (single focused build)
         ├─────────────────┤
         │  Pre-registers   │
         │  component       │
         │  registry        │
         │  Generates all   │
         │  HTML/CSS/JS     │
         │  Reconciles      │
         │  components      │
         │  Validates with  │
         │  Playwright      │
         └─────────────────┘
```

### Orchestrator

**Location**: `.claude/agents/production-frontend-orchestrator/agent.md` + `.claude/skills/production-frontend-orchestrator/SKILL.md`

**Responsibilities**:
1. Comprehensive repository discovery (docs, ADRs, schemas, user stories, tests)
2. Multi-source schema inference (5-layer pipeline)
3. Design system extraction/creation (3 input modes)
4. Production spec generation (PRODUCTION-SPEC.md)
5. Subagent dispatch and post-completion validation

### Subagent

**Location**: `.claude/agents/production-frontend-subagent/agent.md` + `.claude/skills/production-frontend-subagent/SKILL.md`

**Responsibilities**:
1. Component registry pre-registration
2. Production-quality HTML/CSS/JS generation
3. Component boundary marking for framework extraction
4. Component reconciliation (registry vs actual diff)
5. Transfer manifest and user story checklist authoring
6. Playwright visual validation

## Key Architectural Differences from General Agent

| Aspect | General Agent | Production Agent |
|--------|--------------|-----------------|
| Dispatch | Multiple parallel subagents (1 per pass) | Single subagent (1 production build) |
| Discovery | Reads README spec only | Searches entire repository |
| Data Models | Generic mock data | Schema-shaped with confidence levels |
| Components | Monolithic HTML | Boundary-marked for extraction |
| Validation | Screenshot-only | Screenshots + reconciliation + story coverage |
| Iteration | Not supported | Delta-based iteration with context preservation |
| Output | handoff.json | transfer-manifest.json + user-story-checklist.json + component-reconciliation.json + schema-inference-report.json |

## Data Flow

```
User Prompt
  │
  ├── sourceMode: style-transfer | template-basis | custom-direction
  ├── modifications (optional)
  ├── previousOutputDir (optional, for iteration)
  └── deltaInstructions (optional, for iteration)
  │
  ▼
Orchestrator Phase 1: Repository Discovery
  │
  ├── .docs/**/*.md, .adr/**/*.md
  ├── User stories (multiple naming conventions)
  ├── Schemas (Convex, Prisma, TypeScript, Zod)
  ├── Code patterns (destructuring, props, forms)
  ├── UI docs (tables, filters, dashboards)
  ├── Domain conventions (User, Project, Task)
  └── Tests (Playwright, Jest)
  │
  ▼
Orchestrator Phase 2: Design Source Processing
  │
  ├── Style Transfer: WebFetch → extract tokens
  ├── Template Basis: Read handoff.json + CSS vars
  └── Custom Direction: WebSearch → build system
  │
  ▼
Orchestrator Output:
  ├── PRODUCTION-SPEC.md
  ├── discovery-report.json
  └── schema-inference-report.json
  │
  ▼
Subagent Phases 1-8:
  ├── Phase 1: Read spec, plan
  ├── Phase 2: Validate CDN URLs
  ├── Phase 2.5: Build component registry
  ├── Phase 3: Generate HTML/CSS/JS
  ├── Phase 3.5: Component reconciliation
  ├── Phase 4: Self-review checklist
  ├── Phase 5: Playwright screenshots
  ├── Phase 6: Review screenshots
  ├── Phase 7: Fix & re-validate (max 3 cycles)
  └── Phase 8: Complete
  │
  ▼
Subagent Output:
  ├── HTML pages (1 per route)
  ├── style.css, app.js
  ├── validation/transfer-manifest.json
  ├── validation/user-story-checklist.json
  ├── validation/component-reconciliation.json
  ├── validation/handoff.json
  ├── validation/report.playwright.json
  ├── validation/desktop/*.png, validation/mobile/*.png
  └── README.md
```

## File Locations

| Component | Path |
|-----------|------|
| Orchestrator Agent | `.claude/agents/production-frontend-orchestrator/agent.md` |
| Orchestrator Skill | `.claude/skills/production-frontend-orchestrator/SKILL.md` |
| Spec Template | `.claude/skills/production-frontend-orchestrator/references/production-spec-template.md` |
| Subagent Agent | `.claude/agents/production-frontend-subagent/agent.md` |
| Subagent Skill | `.claude/skills/production-frontend-subagent/SKILL.md` |
| Library Catalog | `.claude/skills/production-frontend-subagent/references/library-catalog.json` |
| Validation Script | `.claude/skills/production-frontend-subagent/scripts/validate-production-playwright.mjs` |
| Default Output | `.docs/production/frontend/` |
