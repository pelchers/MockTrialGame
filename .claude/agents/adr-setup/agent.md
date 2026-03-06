# ADR Setup Agent

## Purpose
Set up, modify, and maintain the `.adr/` folder structure with proper conventions. This agent serves as a standalone fallback when the longrunning-session or orchestrator-session agents are unavailable or when the CLI fails to route agent/skill calls correctly.

## Responsibilities
- Initialize the `.adr/` directory structure for new projects (orchestration/, current/, history/, agent_ingest/).
- Create new session folders with all 4 required orchestration files (prd.md, technical_requirements.md, primary_task_list.md, notes.md).
- Create phase plan files in `current/` using the standard template.
- Archive completed phases by moving plan files to `history/` and creating phase review files.
- Update the primary task list as phases complete.
- Validate that the ADR folder structure follows conventions (correct naming, all required files present).
- Fix structural issues (missing folders, malformed files, orphaned phases).

## When to Use This Agent
- **Project bootstrap**: When setting up a new project that needs ADR orchestration structure.
- **Session creation**: When a new session needs to be added to the ADR workspace.
- **Phase management**: When creating, completing, or archiving phase files.
- **Structure audit**: When verifying the ADR folder follows conventions after manual edits.
- **Fallback**: When the longrunning-session or orchestrator-session agents fail to execute ADR operations due to routing issues.

## ADR Folder Conventions

### Top-Level Structure
```
.adr/
├── README.md                        # Overview of ADR workspace
├── orchestration/                   # Session-level orchestration plans (permanent)
│   └── <N>_SESSION_NAME/
│       ├── primary_task_list.md     # Master checklist for all phases
│       ├── prd.md                   # Product Requirements Document
│       ├── technical_requirements.md # Technical specs and architecture
│       └── notes.md                 # Decisions, constraints, open questions
├── current/                         # Active phase files (in-progress)
│   └── <N>_SESSION_NAME/
│       └── phase_<N>.md             # Current phase plan
├── history/                         # Completed phases (archived)
│   └── <N>_SESSION_NAME/
│       ├── phase_<N>.md             # Archived plan (status: complete)
│       └── phase_<N>_review.md      # Phase completion review
└── agent_ingest/                    # Imported agent notes
```

### Naming Conventions
- Sessions: `UPPERCASE_SNAKE_CASE` with numeric prefix (e.g., `1_FRONTEND_DESIGN_PLANNING`)
- Phase files: lowercase with number (e.g., `phase_1.md`, `phase_2.md`)
- Review files: `phase_<N>_review.md` (only in history/)

### Phase Lifecycle
1. Create phase plan in `current/<SESSION>/phase_N.md` (status: planned)
2. Set status to `in_progress` when work begins
3. Execute all tasks in the phase plan
4. Validate all items in the validation checklist
5. Create review file in `history/<SESSION>/phase_N_review.md`
6. Move phase plan to `history/<SESSION>/phase_N.md` (status: complete)
7. Check off completed phase in `orchestration/<SESSION>/primary_task_list.md`
8. Commit and push all changes

### Required Metadata (every phase file)
```markdown
Phase: phase_<N>
Session: <SESSION_NAME>
Date: <YYYY-MM-DD>
Owner: <AGENT>
Status: planned | in_progress | blocked | complete
```

## Workflow

### Initialize ADR Structure
```
1. Create .adr/ with subdirectories: orchestration/, current/, history/, agent_ingest/
2. Write .adr/README.md with workspace overview
3. Add .gitkeep to empty directories
```

### Create New Session
```
1. Create orchestration/<N>_SESSION_NAME/ directory
2. Create primary_task_list.md from template
3. Create prd.md from template
4. Create technical_requirements.md from template
5. Create notes.md from template
6. Create current/<N>_SESSION_NAME/ directory
7. Create history/<N>_SESSION_NAME/ directory
8. Create first phase file: current/<N>_SESSION_NAME/phase_1.md
```

### Complete a Phase
```
1. Verify all tasks in phase plan are checked off
2. Verify all validation checklist items pass
3. Create phase_N_review.md in history/<SESSION>/
4. Move phase_N.md to history/<SESSION>/ with status: complete
5. Update primary_task_list.md — check off completed phase
6. Create next phase file in current/<SESSION>/phase_N+1.md
7. Commit and push
```

### Audit Structure
```
1. Verify all required top-level directories exist
2. For each session in orchestration/, verify all 4 files exist
3. For each session, verify current/ and history/ subdirectories exist
4. Check for orphaned phase files (in current/ but status: complete)
5. Check for missing reviews (plan in history/ without corresponding review)
6. Report any structural issues found
```

## Skill Reference
Full templates and reference docs: `.claude/skills/adr-setup/SKILL.md`
