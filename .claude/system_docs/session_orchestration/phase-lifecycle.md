# Phase Lifecycle

## Overview

Every phase in the session orchestration system follows a strict 10-step lifecycle.
Skipping steps or reordering them will leave the session in an inconsistent state.
The orchestrator enforces this sequence for every phase regardless of session variant.

## The 10-Step Phase Lifecycle

```
  Step 1   Step 2   Step 3   Step 4   Step 5
  Folder   Docs     Plan     Execute  Validate
    |        |        |        |        |
    v        v        v        v        v
  +---------+---------+---------+---------+---------+
  | Ensure  | Create/ | Write   | Execute | Validate|
  | session | update  | phase   | tasks   | every   |
  | folder  | PTL,PRD | plan in | in the  | item in |
  | exists  | tech,   | current/| phase   | the     |
  |         | notes   |         | file    | phase   |
  +---------+---------+---------+---------+---------+
                                                |
  +---------+---------+---------+---------+---------+
  | Create  | Move    | Check   | Commit  | Create  |
  | phase   | phase   | off in  | + push  | next    |
  | review  | to      | primary | all     | phase   |
  | file    | history | task    | changes | plan    |
  |         |         | list    |         |         |
  +---------+---------+---------+---------+---------+
    ^        ^        ^        ^        ^
    |        |        |        |        |
  Step 6   Step 7   Step 8   Step 9   Step 10
  Review   Archive  Checkoff Commit   Next Phase
```

### Step 1: Ensure Session Folder

Verify the session folder exists under `orchestration/current/history`. If missing,
create it along with the required directory structure.

### Step 2: Create or Update Session Documents

Create or refresh the four core documents:
- `primary_task_list.md` -- master phase checklist
- `prd.md` -- product requirements
- `technical_requirements.md` -- architecture and constraints
- `notes.md` -- decisions, open questions, running log

### Step 3: Write Phase Plan

Create `phase_<N>.md` in the `current/` directory. The plan must include:
- Numbered task list with clear acceptance criteria
- Validation steps for each deliverable
- Expected output files and locations

### Step 4: Execute Tasks

Work through every task in the phase plan sequentially. Each task should produce
a testable deliverable.

### Step 5: Validate Every Item

Run validation against every item listed in the phase file. Validation can include:
- Automated tests (Playwright, unit tests)
- File existence checks
- Manual review of generated output
- Build verification

### Step 6: Create Phase Review

Write `phase_<N>_review.md` to the `history/` directory containing:
- File tree snapshot of all changed/created files
- Technical summary of work completed
- Any issues encountered and their resolutions

### Step 7: Move Phase to History

Move the completed `phase_<N>.md` from `current/` to `history/`. This signals
the phase is done and prevents re-execution.

### Step 8: Check Off in Primary Task List

Mark the completed phase in `primary_task_list.md` as done. This provides
the orchestrator a single source of truth for session progress.

### Step 9: Commit and Push

Stage all phase-related changes and commit with a descriptive message. Push
to the remote using HTTPS. Never skip this step -- each phase boundary is a
commit boundary.

### Step 10: Create Next Phase Plan

Before starting new work, create the next phase plan in `current/`. This
ensures the session always has a forward-looking plan ready.

## Validation Rules

| Rule                              | Enforcement                              |
|-----------------------------------|------------------------------------------|
| No skipping steps                 | Orchestrator checks step completion       |
| Phase plan before execution       | Step 3 must precede Step 4               |
| All items validated               | Step 5 covers every task in the plan     |
| Review before archival            | Step 6 must precede Step 7               |
| Commit after every phase          | Step 9 is mandatory, not optional        |
| Never force passing tests         | Investigate failures, document causes    |

## Testing Policy

The testing policy applies uniformly across all phases:

1. **Never force tests to pass.** If a test fails, investigate the root cause.
2. **Document failure causes** in the phase review file.
3. **Fix for production readiness** -- do not merge or advance with known failures.
4. **Re-run validation** after fixes to confirm resolution.

## File Output Summary

```
orchestration/
  current/
    phase_<N>.md            <-- Active phase plan (Step 3)
  history/
    phase_<N>.md            <-- Archived phase plan (Step 7)
    phase_<N>_review.md     <-- Phase review (Step 6)
  primary_task_list.md      <-- Master checklist (Steps 2, 8)
  prd.md                    <-- Product requirements (Step 2)
  technical_requirements.md <-- Technical notes (Step 2)
  notes.md                  <-- Running notes (Step 2)
```
