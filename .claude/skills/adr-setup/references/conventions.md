# ADR Conventions Reference

## Overview
The ADR (Architecture Decision Record) workspace provides structured, phase-based project orchestration. It enforces a lifecycle of planning, execution, validation, review, and archival for every unit of work.

## Folder Hierarchy

```
.adr/
├── README.md                              # Workspace overview + session index
├── orchestration/                         # PERMANENT session-level documents
│   └── <N>_SESSION_NAME/
│       ├── primary_task_list.md           # Master checklist for all phases
│       ├── prd.md                         # Product Requirements Document
│       ├── technical_requirements.md      # Technical constraints + architecture
│       └── notes.md                       # Decisions, constraints, open questions
├── current/                               # ACTIVE phase files (in-progress work)
│   └── <N>_SESSION_NAME/
│       ├── phase_<N>.md                   # Current phase plan
│       └── orchestrator-prompt.md         # (Optional) Large orchestrator prompts
├── history/                               # ARCHIVED completed phases
│   └── <N>_SESSION_NAME/
│       ├── phase_<N>.md                   # Archived plan (status: complete)
│       └── phase_<N>_review.md            # Phase completion review
└── agent_ingest/                          # Imported agent notes (bootstrap/migration)
    └── .gitkeep
```

## Naming Conventions

### Sessions
- Format: `<N>_UPPERCASE_SNAKE_CASE`
- The numeric prefix determines execution order
- Examples: `1_FRONTEND_DESIGN_PLANNING`, `2_PROJECT_SETUP_AND_BACKEND`
- Sessions may run in parallel if independent

### Phase Files
- Plan: `phase_<N>.md` (e.g., `phase_1.md`, `phase_2.md`)
- Review: `phase_<N>_review.md` (e.g., `phase_1_review.md`)
- Reviews ONLY exist in `history/`, never in `current/`

### Orchestration Files
- Always lowercase snake_case: `primary_task_list.md`, `prd.md`, `technical_requirements.md`, `notes.md`
- These are permanent — they stay in `orchestration/` and are updated in place, never moved

## Phase Lifecycle

### Status Progression
```
planned --> in_progress --> complete
                |
                +--> blocked --> in_progress --> complete
```

### 10-Step Workflow
1. Ensure session folders exist in `orchestration/`, `current/`, `history/`
2. Create or update the 4 orchestration files
3. Create phase plan in `current/<SESSION>/phase_N.md` (status: planned)
4. Set status to `in_progress` when work begins
5. Execute all tasks listed in the phase plan
6. Validate every item in the validation checklist
7. Create review in `history/<SESSION>/phase_N_review.md`
8. Move plan to `history/<SESSION>/phase_N.md` with status: `complete`
9. Check off completed phase in `primary_task_list.md`
10. Commit and push, then create next phase plan

### Phase Plan Required Metadata
```markdown
Phase: phase_<N>
Session: <SESSION_NAME>
Date: <YYYY-MM-DD>
Owner: <AGENT>
Status: planned | in_progress | blocked | complete
```

### Phase Plan Required Sections
1. **Objectives** — Brief goals for this phase
2. **Task checklist** — Checkboxes for all work items
3. **Deliverables** — Artifacts produced
4. **Validation checklist** — Standard 7-item checklist
5. **Risks / blockers** — Known issues + mitigations
6. **Notes** — Implementation context

### Standard Validation Checklist
```markdown
- [ ] All tasks complete
- [ ] Sources captured with citations
- [ ] Media references verified
- [ ] Docs match sitemap placements
- [ ] Phase file ready to move to history
- [ ] Phase review file created in history
- [ ] Changes committed and pushed
```

## Orchestration File Conventions

### primary_task_list.md
- Groups tasks by phase (Phase 1, Phase 2, etc.)
- Each phase section lists deliverables as checkboxes
- Updated as phases complete (check off finished items)
- Serves as the overall session roadmap

### prd.md
- Session-specific (not project-level) Product Requirements Document
- Required sections: Summary, Goals, Non-goals, Target Users, Content/Functional/UX/Technical Requirements, Risks/Assumptions, Open Questions
- Defines scope boundaries for the session

### technical_requirements.md
- Deep technical specifications
- Required sections: Stack/Runtime, Content Pipeline, Data/Storage, Security/Compliance, Performance, Testing/Validation, Deployment
- Includes constraints like file size limits, API specs, library versions

### notes.md
- Structured decision log
- Format: Decisions (D1, D2, ...), Constraints (C1, C2, ...), Open Questions (Q1, Q2, ...), References
- Each decision includes rationale and impact
- Open questions are resolved during phase execution and moved to Decisions

## Phase Review Conventions

### Required Sections
1. **File tree** — Directory listing of files changed/created
2. **Overview** — Summary of what was accomplished
3. **Technical breakdown** — Implementation details
4. **Validations completed** — What was verified
5. **Notes** — Lessons learned, follow-up items

### When to Create
- After ALL tasks in the phase plan are complete
- Before moving the phase plan to history
- Must be committed in the same batch as the plan archival

## Commit Conventions
- Per-phase commits: `ADR Session N Phase M: <description>`
- Include session and phase reference for traceability
- Commit after EACH phase (not batched to session end)

## Subagent Handoff (Orchestrator Pattern)
When using the orchestrator-session skill:
1. Orchestrator writes `next_phase.json` to `.claude/orchestration/queue/`
2. Orchestrator poke hook spawns a new Claude exec session
3. Subagent executes the phase and returns a structured "poke" report
4. Orchestrator processes the poke and prepares the next phase

### Poke Report Contents
- Summary of completed work
- Files changed (tree snippet)
- Validation results (checklist)
- Commit + push confirmation
- Next-phase readiness assessment

## Integration with Other Systems
- **longrunning-session skill**: Single-agent sessions following the same phase lifecycle
- **orchestrator-session skill**: Multi-agent sessions with subagent handoffs
- **research-docs-session skill**: Research-focused variant of longrunning-session
- **ingesting-agent-history skill**: Creates summaries in `agent_ingest/` after context clears
- **chat-history-convention skill**: Logs user messages for session continuity
