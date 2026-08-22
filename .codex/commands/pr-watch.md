---
name: pr-watch
description: Start / manage the PR Shepherd — watch an open upstream contributor PR and auto-remediate its CI/maintainer gating failures until it merges into the dev branch. Subcommands: add, remove, status, check-now, stop.
invocable: true
---

# /pr-watch — shepherd an open upstream PR until it merges

Manages the `pr-shepherd` loop: register a PR we opened (via `/promote-pr`) into the watch-list, then a
recurring in-session check (~20 min) catches each new CI failure or maintainer change-request, remediates
it additively, and re-pushes the feature branch — until the PR is merged (deployed to the dev branch).
Executed per-pass by the `pr-shepherd-agent`. Full behavior: the `pr-shepherd` skill.

`$ARGUMENTS` = a subcommand and its operands:

- `add <#N> <branch>` — register PR #N (feature branch `<branch>`) into `.chat-history/pr-watch-log.md` and
  start the recurring watcher (a session cron, ~20 min) if it isn't already running. Records the current
  head sha as the baseline so only NEW failures are acted on.
- `remove <#N>` — deregister PR #N (e.g. once it's merged, or to stop watching it).
- `status` — print the watch-list: each watched PR, its branch, last-pushed sha, last-handled failure, and
  whether the recurring watcher is running.
- `check-now` — run ONE watch+remediate pass immediately (dispatch `pr-shepherd-agent`) over all watched
  PRs, without waiting for the next cron firing.
- `stop` — stop the recurring watcher (delete the session cron) and leave the watch-list intact.

## Instructions for Codex

When `/pr-watch` is invoked, parse `$ARGUMENTS`:

1. **Gate:** `repo.local.md` must declare `contributor`. If not, say so and stop.
2. **`add`:** confirm the PR # and branch; append/update its row in `.chat-history/pr-watch-log.md`
   (branch, baseline head sha from `git ls-remote <upstream> <branch>`, "no failure handled yet"); ensure a
   recurring session cron exists whose prompt runs the `pr-shepherd-agent` over the watch-list (create it
   with CronCreate if absent — one shared watcher for all watched PRs, ~every 20 min at an off-minute).
   Report the watch-list + the compare/PR URL.
3. **`remove`:** update the watch-log to mark PR #N deregistered; if no PRs remain active, offer to `stop`.
4. **`status`:** read + print the watch-log rows + whether the cron is live (CronList).
5. **`check-now`:** dispatch the `pr-shepherd-agent` for a single immediate pass; relay only substantive
   results (a remediation) — keep a clean pass quiet.
6. **`stop`:** CronDelete the watcher; confirm the watch-list is preserved.

Guardrails are the skill's: feature-branch-only, additive+verified pushes, never dev/live, never merge,
escalate anything ambiguous. Session-scoped (the watcher runs while a Claude session is open); the runbook
documents the optional durable Windows Scheduled Task upgrade.

$ARGUMENTS
