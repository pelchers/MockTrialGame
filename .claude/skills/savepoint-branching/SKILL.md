---
name: savepoint-branching
description: Create and push savepoint branches on user request after a commit is complete. Use when the user asks for a savepoint branch, snapshot branch, or milestone branch and then return to the previous working branch.
---

# Savepoint Branching

Create reproducible savepoint branches from current commit state.

## Naming Convention

- **Milestone savepoint** (in-progress checkpoint): `savepoint-<number>-<descriptor>`.
- **Feature savepoint** (a completed feature — see below): `<feature-id>@luke` (e.g.
  `f1-simple-affiliate-system@luke`) — the feature's own id + `@luke`, matching the working
  feature-branch + production PR-branch naming.
- Normalize user-provided names to lowercase hyphen-case (keep the `@luke` suffix literal).
- Remove invalid git ref characters and spaces.
- Example:
- User request: `savepoint 1 - app planning complete for phase 1`
- Branch name: `savepoint-1-app-planning-complete-for-phase-1`

## Feature Savepoints (on feature completion) — REQUIRED sync convention

When a **feature** reaches a completed, validated state, snapshot it by syncing the completed commit to
**three** targets on the local working repo (`pelchers/CC-Local`), in addition to the working branch:

1. **The device working lane** — `<Device>-Work` (e.g. `Asus-Work`), resolved from `device.local.md`.
2. **`main`** — fast-forward only (main = stable / handoff / deploy).
3. **A feature-named savepoint branch** — `<feature-id>@luke` (e.g. `f1-simple-affiliate-system@luke`),
   the durable feature-scoped snapshot of the completed state.

### Push order + safety
1. Commit the completed work on the working branch; push the working branch.
2. **`main`** — fast-forward `main` to the completed commit. If it is NOT a fast-forward, STOP and ask
   (only supersede `main` on explicit operator direction).
3. **Device lane** — push the completed commit to `<Device>-Work`. **If the device lane has genuinely
   diverged** (holds superseded / parked work not contained in the new state), **preserve its current tip
   under a `parked/<name>` branch FIRST**, then update the lane. Never discard a lane.
4. **Feature branch** — create/update `<feature-id>@luke` at the completed commit; push it.

This complements `/winddown` (which handles the device-lane + main sync at end-of-session); the feature
savepoint additionally captures the **feature-named** durable snapshot on completion.

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
