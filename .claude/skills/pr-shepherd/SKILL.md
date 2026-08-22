---
name: pr-shepherd
description: Watch a submitted upstream CONTRIBUTOR pull request and shepherd it through every CI round and maintainer review until it is merged (deployed to the dev branch). On a NEW gating failure — a red CI job OR a change-request/failure comment from the maintainer (not a bot) — remediate ADDITIVELY, verify full CI parity, push the fix to the PR's feature branch, and keep watching. Self-improving: a novel failure class is appended to the synced pre-pr-learned-checks. Use after `/promote-pr` opens a PR, when the user says "watch the PR"/"babysit the PR"/"auto-remediate CI", or when a watched PR gets a new failure. Companion to `contributor-conventions` (which opens the PR) and `pre-pr-checklist` (the checks it enforces).
---

# PR Shepherd

Keeps a submitted upstream PR moving from **submission → CI/review rounds → merged** without the user
babysitting it. This maintainer very often returns small gating issues shortly after each push; the
shepherd catches each one, fixes it, re-submits, and watches again — **until the PR is deployed** (merged
into the upstream dev branch).

> **Scope gate — read FIRST.** Applies ONLY to repos where `repo.local.md` declares `contributor` and to
> **feature-branch PRs we opened into the upstream dev branch** (via `/promote-pr`). It NEVER pushes to
> `development` / `website@dev` / `website@live`, NEVER merges a PR, and only ever pushes ADDITIVE fixes to
> the PR's own feature branch. Companion to `contributor-conventions` (opens the PR) and the pre-PR
> checklist (`.docs/runbooks/development/pre-pr-checklist.md` + the learned-checks companion). Full
> reference: `.docs/runbooks/development/pr-shepherd.md`.

## What it does (the loop)

```
/promote-pr opens PR  ──►  /pr-watch add #N <branch>   (register in the watch-list)
                                    │
        ┌───────────────────────────┘   (recurring check, ~20 min, in-session)
        ▼
   check each watched PR:
     • CI job "Build, lint, typecheck, test" status
     • newest comment/review by the MAINTAINER (fmchisti) — ignore bots (Copilot/Cursor/Supabase)
        │
        ├─ nothing new since last-handled ──►  one-line heartbeat, stop (quiet)
        │
        └─ NEW gating failure / change-request ──►  REMEDIATE:
              1. diagnose precisely (read the failed job log OR the maintainer's comment)
              2. reproduce + fix in a FRESH clone of the PR branch — ADDITIVE only
              3. verify FULL CI parity green (build · lint · typecheck · test, CI env)
              4. if novel failure class → append to pre-pr-learned-checks + sync across repos
              5. push the fix to the FEATURE BRANCH (never dev/live); update the watch-log
              6. keep watching
        │
        ▼
   PR merged into the dev branch  ──►  deregister; stop watching (deployed ✔)
```

## Detection mechanism (the way we do it here)

Read PR state through the **Chrome extension** (claude-in-chrome), in an active Claude session — the same
method used to open the PRs. No `gh` CLI and no stored token are required.

- CI status: open `https://github.com/<upstream>/pull/<N>/checks`, read the **"Build, lint, typecheck,
  test"** job — RED = a gating failure. Open the failed job (`.../actions/runs/<id>/job/<jid>`) and
  `get_page_text` to read the exact step + file + error.
- Maintainer review: open `https://github.com/<upstream>/pull/<N>`, read the newest comment/review by the
  **maintainer** (`fmchisti`). A change-request or "this failed / please fix X" is a gating signal. Bot
  comments (Copilot / Cursor / Supabase) are NOT gating on their own — a red CI job or the maintainer are.
- Merge state: if the PR shows **Merged** (or Closed), it's deployed to dev — deregister it.

The recurring driver is a **session cron** (CronCreate, ~20 min) started by `/pr-watch` — this is
session-scoped (runs while a Claude session is open on this machine). A durable Windows Scheduled Task is
possible (see the runbook's "Durable upgrade") but requires `gh`/token for headless detection, so the
default is the session cron.

## State + dedup — `pr-watch-log.md`

Per-PR state lives in `.chat-history/pr-watch-log.md` (project-local, NOT synced): the branch, the last
commit sha we pushed, and the last failure/comment we handled. **Only act on something NEWER** than what's
logged, so a firing never re-handles a failure already fixed. Every remediation appends an activity line.

## Remediation rules (identical to how we work by hand)

1. **Reproduce in a FRESH shallow clone** of the PR branch, never the main working tree:
   `git clone --depth 1 --branch '<branch>' --single-branch <upstream-url> "$TMP/cc-watch-<N>"` →
   `pnpm install --frozen-lockfile` (pnpm 9.15.9).
2. **Fix ADDITIVELY** — add code/methods; adapt OUR code to the dev branch's current API. NEVER delete,
   rename, reformat, or revert the maintainer's code to satisfy a type error (that is the C7 rule and the
   #1 way a combined patch silently reverts upstream work).
3. **Verify FULL CI parity green before pushing** (all must pass), matching `.github/workflows/ci.yml`:
   - `pnpm exec turbo run build --filter=!collectibleclassics`
   - `pnpm exec turbo run typecheck --filter=!collectibleclassics --continue`
   - `pnpm exec turbo run lint --filter=!collectibleclassics --continue` (0 errors; warnings ok)
   - tests with the CI env exported (the placeholders the workflow sets):
     `NODE_ENV=test DATABASE_URL=postgresql://ci:ci@localhost:5432/ci BACKEND_URL=http://localhost:3000 SUPABASE_URL=http://localhost:54321 SUPABASE_ANON_KEY=ci-placeholder-anon-key SUPABASE_SERVICE_KEY=ci-placeholder-service-key SIGNING_LINK_SECRET=ci-placeholder-signing-link-secret-32chars-min SCRAPPER_SERVICE_KEY=ci-placeholder-scrapper-service-key GOOGLE_DRIVE_API_KEY=ci-placeholder-google-key pnpm exec turbo run test --filter=collectibleclassics-backend --filter=listing --filter=scrapper-backend --continue`
   - confirm no `*.test.ts` in the changeset imports vitest (the recurring CI-red: PRs #48/#62).
4. **Commit clean, push the feature branch only:** conventional message, NO AI/tool trailers (strip
   `Co-Authored-By: Claude`, `Generated with`, `Claude-Session` — the maintainer's hook strips them anyway,
   #21). `git config user.name "Luke Pelych"` / `user.email "thepineist@gmail.com"`, then
   `CONTRIBUTOR_PUSH_OK=1 git push origin 'HEAD:<branch>'`.
5. **Mirror the same code fix into the working tree's `CC/` subtree** if the file exists there (so CC-Local
   stays consistent), commit to the working lane, push `origin` (our working remote — allowed).
6. **Update `pr-watch-log.md`** with the failure handled + the new sha + the verification result.

## Self-improving checklist — append + sync

When a remediation reveals a **NOVEL failure class** — a failure signature not already covered by
`.docs/runbooks/development/pre-pr-checklist.md` or the learned-checks companion — append a new entry to
**`.docs/runbooks/development/pre-pr-learned-checks.md`** (the synced companion the checklist links to):

```
### <short signature>  (learned <date>, from PR #<N>)
- **Symptom:** <the exact CI error or maintainer comment>
- **Root cause:** <why it happened — usually a divergence gap>
- **Pre-submit check:** <the concrete thing to verify BEFORE the next PR so it never recurs>
- **Fix pattern:** <how it was remediated, additively>
```

Then **propagate the appendage to every sync-repo**: the learned-checks file is in the component's sync
set, so flag it (`bash .claude/hooks/scripts/component-change-detector.sh` writes the pending marker, or
run `/sync-component pr-shepherd`) and `/sync-flush` commits+pushes it to all `SYNC-REPOS.md` targets +
the `.codex` mirror. This is how "the checklist grows over time and stays consistent across all our repos."

## GUARDRAILS (hard — never cross these autonomously)

- **Feature branch only.** NEVER push to `development` / `website@dev` / `website@live`. NEVER merge a PR.
- **Additive + verified.** Only auto-push a fix that is clearly ADDITIVE and that you verified GREEN across
  the full CI parity. If a fix would require a destructive/large change, if the maintainer's request is
  ambiguous or asks for a design decision, or if you cannot reach CI-parity-green additively — **DO NOT
  push.** Append a clear entry to the watch-log describing what's needed and STOP; surface it to the user.
- **Quiet by default.** A firing with nothing new writes a one-line heartbeat and stops. Only produce a
  substantive report when you actually remediated something.
- **Dedup.** Never re-handle a failure already recorded as handled in the watch-log.

## Related
- `/pr-watch` command (add/remove/status/check-now/stop) · agent `pr-shepherd-agent` (one check+remediate pass).
- Opens the PR: `contributor-conventions` skill + `/promote-pr` + `contributor-promotion-agent`.
- Enforces: `.docs/runbooks/development/pre-pr-checklist.md` + `pre-pr-learned-checks.md`.
- Push guard: `contributor-push-guard.sh` (the `CONTRIBUTOR_PUSH_OK=1` escape hatch is used only for the
  additive feature-branch push above).
