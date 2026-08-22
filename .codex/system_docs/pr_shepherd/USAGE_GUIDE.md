# Usage Guide: PR Shepherd

## Quick Start

After `/promote-pr` opens a feature-branch PR into the upstream dev branch, the PR is **auto-registered**
into the watch-list — in the normal flow you never call `add` by hand. To drive the watcher manually:

```
/pr-watch add #93 simple-affiliate-system@luke   # register PR #93 (branch) + start the ~20-min watcher
/pr-watch status                                  # list watched PRs + last-handled state + is the watcher live
/pr-watch check-now                               # run ONE watch+remediate pass right now
/pr-watch remove #93                              # deregister a PR (e.g. after it merges)
/pr-watch stop                                    # stop the recurring watcher; keep the watch-list intact
```

| Command | One-line effect |
|---|---|
| `/pr-watch add <#N> <branch>` | register PR #N + start the recurring in-session watcher (baseline = current head sha) |
| `/pr-watch remove <#N>` | deregister PR #N; if none remain, offer to `stop` |
| `/pr-watch status` | print the watch-list rows + whether the session cron is live |
| `/pr-watch check-now` | dispatch `pr-shepherd-agent` for a single immediate pass (relay only a real remediation) |
| `/pr-watch stop` | delete the session cron; the watch-list is preserved |

## The normal flow

1. **`/promote-pr <feature>`** opens the PR into the upstream dev branch (via `contributor-conventions` +
   `contributor-promotion-agent`).
2. The PR is **auto-registered** into `.chat-history/pr-watch-log.md` and the recurring watcher starts.
3. **Each round**, the watcher (via `pr-shepherd-agent`) checks CI + the maintainer's newest comment and
   **remediates** any new gating failure additively on the feature branch — round after round.
4. When the PR is **merged** into the dev branch, the watcher **deregisters** it (deployed ✔).

## The remediation cycle (only on a NEW gating signal)

Identical to the by-hand pre-PR flow:

1. **Detect** (Chrome extension, in-session): red "Build, lint, typecheck, test" job on `.../pull/<N>/checks`,
   OR a change-request / "please fix X" from the **maintainer** (`fmchisti`) on `.../pull/<N>` — newer than
   last-handled. Bots (Copilot / Cursor / Supabase) are not gating on their own.
2. **Reproduce** in a fresh shallow clone of the PR branch (never the working tree) → `pnpm install
   --frozen-lockfile`.
3. **Fix ADDITIVELY** — add code/methods; adapt our code to the dev branch's current API. Never delete,
   rename, or revert the maintainer's code to satisfy a type error (C7).
4. **Verify FULL CI parity green** (build · lint 0-errors · typecheck · test with the CI env placeholders;
   no `*.test.ts` importing vitest).
5. **Commit clean** (NO AI/tool trailers) → `CONTRIBUTOR_PUSH_OK=1 git push origin 'HEAD:<branch>'` (feature
   branch only) → mirror the fix into the working tree `CC/` subtree + push our working remote → update the
   watch-log.

## Where state lives — `.chat-history/pr-watch-log.md`

Per-PR state (project-local, **NOT** synced): the branch, the last commit sha we pushed, and the last
failure/comment we handled. The watcher only acts on something **newer** than what's logged, so a firing
never re-handles a failure already fixed. Every remediation appends an activity line; a quiet firing writes
a one-line heartbeat.

## The self-appending checklist + cross-repo sync

When a remediation reveals a **novel** failure class — not already covered by `pre-pr-checklist.md` or the
learned-checks companion — the shepherd appends an entry to
**`.docs/runbooks/development/pre-pr-learned-checks.md`**:

```
### <short signature>  (learned <date>, from PR #<N>)
- **Symptom:** <the exact CI error or maintainer comment>
- **Root cause:** <why it happened — usually a divergence gap>
- **Pre-submit check:** <the concrete thing to verify BEFORE the next PR so it never recurs>
- **Fix pattern:** <how it was remediated, additively>
```

It then flags the appendage (`bash .claude/hooks/scripts/component-change-detector.sh`, or
`/sync-component pr-shepherd`) and `/sync-flush` commits + pushes it to every `SYNC-REPOS.md` target + the
`.codex` mirror. This is the one runbook whose **CONTENT** is intentionally synced (the learned-checks
registry) — so the checklist grows over time and stays consistent across all our repos, and the pre-submit
checks catch these classes *before* the next PR, shrinking the number of round-trips.

## The pr-shepherd-agent

For an autonomous pass, the `pr-shepherd-agent` executes ONE watch+remediate cycle over the watched PRs (it
loads `pr-shepherd`, `contributor-conventions`, and `pre-pr-checklist`). It runs on each session-cron firing
or on `/pr-watch check-now`, and escalates anything ambiguous, large, or destructive instead of pushing.

## Guardrails (never crossed autonomously)

- Feature branch only; never push `development` / `website@dev` / `website@live`; never merge a PR.
- Push only an ADDITIVE fix verified GREEN; ambiguous / large / design-decision / can't-go-green-additively
  → log "needs the user" in the watch-log and STOP.
- Quiet by default (heartbeat); dedup via the watch-log.
- Session-scoped by default; the durable Windows Scheduled Task is an opt-in that adds a `gh`/token
  dependency (see the runbook).
