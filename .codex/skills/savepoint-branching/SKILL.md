---
name: savepoint-branching
description: Create and push savepoint branches on user request after a commit is complete. Use when the user asks for a savepoint branch, snapshot branch, or milestone branch and then return to the previous working branch.
---

# Savepoint Branching

Create reproducible savepoint branches from current commit state.

## Naming Convention

- Required format: `savepoint-<number>-<descriptor>`.
- Normalize user-provided names to lowercase hyphen-case.
- Remove invalid git ref characters and spaces.
- Example:
- User request: `savepoint 1 - app planning complete for phase 1`
- Branch name: `savepoint-1-app-planning-complete-for-phase-1`

## Workflow

1. Confirm current branch name and working tree status.
2. If there are uncommitted changes, commit first on current branch.
3. Create savepoint branch from current `HEAD`.
4. Push savepoint branch to remote with upstream.
5. Switch back to original working branch.
6. Report savepoint branch name and source commit hash.

## Guardrails

- Never replace or rewrite existing branch history for savepoints.
- Do not leave session checked out on savepoint branch unless user asks.
- Keep savepoint creation as a post-commit step.
