# Savepoint Workflow

## Purpose

Savepoint branches create reproducible milestone snapshots from the current commit state.
They are immutable reference points that preserve a known-good state of the codebase at
significant milestones without disturbing the working branch.

## Naming Convention

All savepoint branches follow the format:

```
savepoint-<number>-<descriptor>
```

### Normalization Rules

| Rule                         | Example                                           |
|------------------------------|---------------------------------------------------|
| Lowercase                    | `App Planning` becomes `app-planning`              |
| Hyphen-separated             | `app planning complete` becomes `app-planning-complete` |
| Remove invalid git ref chars | Colons, tildes, carets, etc. are stripped           |
| Remove spaces                | Replaced with hyphens                              |

### Examples

| User Request                                        | Branch Name                                          |
|-----------------------------------------------------|------------------------------------------------------|
| `savepoint 1 - app planning complete for phase 1`   | `savepoint-1-app-planning-complete-for-phase-1`      |
| `savepoint 2 - database schema finalized`           | `savepoint-2-database-schema-finalized`              |
| `savepoint 3 - UI components ready`                 | `savepoint-3-ui-components-ready`                    |

## 6-Step Workflow

```
  Step 1          Step 2          Step 3
  Confirm         Commit if       Create
  branch +        uncommitted     savepoint
  status          changes         branch
    |               |               |
    v               v               v
  +---------------+---------------+---------------+
  | Check current | Stage + commit| git branch    |
  | branch name   | any pending   | savepoint-N-  |
  | and working   | changes on    | descriptor    |
  | tree status   | current branch| from HEAD     |
  +---------------+---------------+---------------+
                                        |
  +---------------+---------------+---------------+
  | Push savepoint| Switch back   | Report branch |
  | to remote     | to original   | name + commit |
  | with upstream | working branch| hash to user  |
  +---------------+---------------+---------------+
    ^               ^               ^
    |               |               |
  Step 4          Step 5          Step 6
  Push            Return          Report
```

### Step 1: Confirm Branch and Status

```bash
git branch --show-current
git status
```

Record the current branch name for return in Step 5.

### Step 2: Commit Uncommitted Changes

If the working tree has uncommitted changes, commit them first on the current branch.
This ensures the savepoint captures the complete state.

### Step 3: Create Savepoint Branch

```bash
git branch savepoint-<number>-<descriptor>
```

The branch is created from the current `HEAD` commit.

### Step 4: Push to Remote

```bash
git push -u origin savepoint-<number>-<descriptor>
```

Push with upstream tracking so the savepoint exists on the remote.

### Step 5: Return to Working Branch

```bash
git checkout <original-branch>
```

Switch back to the branch you were on before creating the savepoint.

### Step 6: Report

Output the savepoint branch name and the source commit hash for the user's records.

## Guardrails

| Guardrail                                    | Rationale                                    |
|----------------------------------------------|----------------------------------------------|
| Never replace or rewrite existing history     | Savepoints are additive, never destructive   |
| Do not leave session on savepoint branch      | Always return to working branch (unless user asks) |
| Keep savepoint as a post-commit step          | Commit first, then branch                    |
| Never delete savepoint branches               | They serve as permanent reference points     |
| Use HTTPS remotes for pushing                 | Consistent with project remote policy        |

## When to Create Savepoints

Savepoints are appropriate at these milestones:

- **Phase completion** -- After finishing a major phase of work
- **Before risky changes** -- Before a large refactor or migration
- **Feature milestones** -- When a feature reaches a stable, testable state
- **Pre-deployment** -- Before deploying to staging or production
- **User request** -- Any time the user explicitly asks for a snapshot

## Relationship to Commits

Savepoints are not a replacement for commits. They serve different purposes:

```
  Commits          Savepoints
  -------          ----------
  Granular         Milestone-level
  Sequential       Branching
  On working       Separate branch
    branch
  History of       Reference
    changes          points
```

A savepoint is always created after a commit, never instead of one.
