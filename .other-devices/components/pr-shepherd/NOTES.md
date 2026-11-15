# NOTES — `pr-shepherd` (development context)

## Problem it solves
`contributor-conventions` + `/promote-pr` get a feature-branch PR **open** against the upstream dev branch.
But opening the PR is only the start: the maintainer (`fmchisti`) very often returns a small gating issue
shortly after each push — a red CI job, or a "please fix X" review comment — and the PR only merges once
every round is green. Handling each round by hand means the user has to babysit the PR and re-run the
pre-PR flow each time. `pr-shepherd` automates exactly that maintenance half: it watches an already-open PR
and remediates each new gating failure the same additive way we would by hand, until the PR is merged
(deployed to the dev branch).

## Key design decisions
- **Detection is in-session via the Chrome extension.** PR state (CI job status + the maintainer's newest
  comment) is read through claude-in-chrome — the same method used to open the PRs. No `gh` CLI and no
  stored token are required for the default path.
- **Default watcher = a session cron (~20 min).** Started by `/pr-watch add`, executed per-firing by
  `pr-shepherd-agent`. It is **session-scoped** — it runs while a Claude session is open on this machine.
  This is deliberately the low-dependency default.
- **A red CI job OR the maintainer are the only gating signals.** Bot comments (Copilot / Cursor /
  Supabase) are NOT gating on their own. A change-request that needs a *design decision* is escalated, not
  auto-remediated.
- **Remediation is additive, verified, feature-branch-only.** Fresh shallow clone → additive fix (adapt our
  code to the dev branch's API; never revert the maintainer's code) → verify FULL CI parity green (build /
  lint 0-errors / typecheck / test with the CI-env placeholders; no `*.test.ts` importing vitest) → commit
  clean (no AI trailers) → push the FEATURE branch only → mirror into the working tree `CC/` subtree.
- **Dedup via `.chat-history/pr-watch-log.md`.** Per-PR branch + last-pushed sha + last-handled failure.
  Only act on something *newer* than what's logged, so a firing never re-handles a fixed failure. State is
  project-local — the component syncs, the log contents do not.
- **Self-improving learned-checks.** A novel gating class is appended to `pre-pr-learned-checks.md`
  (symptom → root cause → pre-submit check → fix pattern → PR/date) and synced across repos, so the same
  class never costs a round-trip again and every project inherits the lesson.

## Session-cron (default) vs durable Windows Scheduled Task (opt-in)
- **Session cron is the default** because detection is in-session (the browser is only available inside a
  Claude session) and it needs **zero extra dependencies**. It covers the common case: the user is working
  in a session while the PR is in flight.
- **A durable Windows Scheduled Task** (survives restarts + idle) is an **opt-in upgrade**: register a task
  on the idle-handoff pattern (`register-idle-handoff.ps1`) that fires a headless monitor every ~20 min.
  That monitor needs a **headless way to read GitHub PR state** — the `gh` CLI (one `gh auth login`) or a
  stored token — since the browser is in-session only. Left as opt-in precisely because it adds that
  `gh`/token dependency. See the runbook's "Durable upgrade".

## Guardrails (why they are hard limits)
- **Feature branch only; never dev/live; never merge.** The whole point of the contributor model is that we
  propose via PR and the maintainer merges. An autonomous watcher must never widen that — it only ever
  pushes an additive fix to the PR's own feature branch.
- **Additive + verified, or STOP.** If a fix would need a destructive/large change, if the maintainer's
  request is ambiguous or a design decision, or if CI-parity-green isn't reachable additively → the shepherd
  does NOT push; it appends a clear "needs the user" entry to the watch-log and surfaces it. Better a
  surfaced stall than a bad autonomous push.
- **Quiet by default.** A firing with nothing new writes a one-line heartbeat and stops — substantive output
  only on an actual remediation, so the watcher isn't noisy.

## Gotchas when porting
- **Runbooks live ONLY in `.docs/`** — do NOT mirror `pr-shepherd.md` or `pre-pr-learned-checks.md` into
  `.codex`. The skill/agent/command DO mirror to `.codex` (command header → `Instructions for Codex`).
- **`pre-pr-learned-checks.md` is the one runbook whose CONTENT is synced.** Other `.docs/runbooks/**`
  contents stay project-local; this one is a shared, append-only registry — merge/append entries, never
  wholesale-overwrite a target's copy.
- **Upstream-specific strings need adapting.** The maintainer handle (`fmchisti`), the CI job name
  ("Build, lint, typecheck, test"), and the CI-env placeholders come from the target repo's
  `.github/workflows/ci.yml`. Adapt them for a different upstream.
- **This package does NOT edit `/promote-pr`.** The one-line auto-register hand-off is operator-applied
  (owned by `contributor-conventions`); this package only *describes* it in
  `snippets/promote-pr-integration.md`.
- **Inert on `owner` repos.** Like `contributor-conventions`, `pr-shepherd` only applies when
  `repo.local.md` declares `contributor`.
- **Keep `.claude` ⇄ `.codex` in sync** (`syncing-claude-codex`) and keep the four convention-file copies of
  the managed block in lock-step.

## Why staged here
Per the `.other-devices/` convention: anything reusable/template-worthy built on a device is staged as a
portable package so it can be synced to template repos / other machines. This component pairs with
`contributor-conventions` (which opens the PR) and reuses the same `repo.local.md` ownership gate; it is
modeled structurally on `contributor-conventions` / `device-sync-protocol`.
