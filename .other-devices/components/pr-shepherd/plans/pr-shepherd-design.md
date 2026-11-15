# Design note — PR Shepherd (`pr-shepherd`)

> **Status:** ✅ Built + staged. Portable package: `.other-devices/components/pr-shepherd/`.
> **Goal:** keep a **submitted upstream CONTRIBUTOR PR** moving from submission → CI/review rounds →
> **merged into the dev branch** without the user babysitting it — catch each new CI failure or maintainer
> change-request, remediate it **additively** on the feature branch, re-push, and watch again until merge.
> **Companion to:** `contributor-conventions` (`/promote-pr` OPENS the PR) + the pre-PR checklist (the
> checks it enforces). Full user-facing explanation: the runbook
> `.docs/runbooks/development/pr-shepherd.md` (copied into `artifacts/`).

---

## 0. Purpose

The upstream maintainer (`fmchisti`) very often returns a small gating issue shortly after each push — a
red CI job, or a "please fix X" review comment. Handling each one by hand means the user has to watch the
PR and re-run the pre-PR flow every round. The PR Shepherd automates exactly that maintenance half: it
watches an already-open PR and remediates each new gating failure the same way we would by hand, until the
PR is merged (deployed to the dev branch).

## 1. The loop

```
/promote-pr opens PR  ──►  /pr-watch add #N <branch>   (register in the watch-list)
                                    │
        ┌───────────────────────────┘   (recurring in-session check, ~20 min)
        ▼
   check each watched PR (Chrome extension, in-session):
     • CI job "Build, lint, typecheck, test" status on .../pull/<N>/checks
     • newest comment/review by the MAINTAINER (fmchisti) on .../pull/<N> — ignore bots
        │
        ├─ nothing newer than last-handled ──►  one-line heartbeat, stop (quiet)
        │
        └─ NEW gating failure / change-request ──►  REMEDIATE:
              1. diagnose (read the failed job log OR the maintainer's comment)
              2. reproduce + fix in a FRESH shallow clone of the PR branch — ADDITIVE only
              3. verify FULL CI parity green (build · lint · typecheck · test, CI env)
              4. novel failure class → append pre-pr-learned-checks + sync across repos
              5. push the fix to the FEATURE BRANCH only; mirror into CC/ ; update watch-log
              6. keep watching
        ▼
   PR merged into the dev branch  ──►  deregister; stop watching (deployed ✔)
```

## 2. Composition (component build sheet)

| Component | Path | Responsibility |
|---|---|---|
| **Skill** `pr-shepherd` | `.claude/skills/pr-shepherd/SKILL.md` (+ `.codex/`) | the loop + detection + remediation rules + guardrails |
| **Agent** `pr-shepherd-agent` | `.claude/agents/pr-shepherd-agent/AGENT.md` (+ `.codex/`) | ONE watch+remediate pass per firing; escalates ambiguity |
| **Command** `/pr-watch` | `.claude/commands/pr-watch.md` (+ `.codex/`) | `add`/`remove`/`status`/`check-now`/`stop`; starts the session cron |
| **Runbook** | `.docs/runbooks/development/pr-shepherd.md` | full explanation + CI-env block + durable upgrade |
| **Learned-checks** | `.docs/runbooks/development/pre-pr-learned-checks.md` | the self-improving, content-synced registry |
| **State** | `.chat-history/pr-watch-log.md` | per-PR branch + last-pushed sha + last-handled failure (dedup) |
| **System docs** | `.claude`/`.codex` `system_docs/pr_shepherd/{README,USAGE_GUIDE}.md` | component reference |
| **Convention block** | `CLAUDE.md` · `.claude/CLAUDE.md` · `.codex/CODEX.md` · `.codex/AGENTS.md` | managed `pr-shepherd` block |

## 3. Decisions (locked)

| # | Question | Decision |
|---|----------|----------|
| D1 | What is a "gating signal"? | A **red CI job** ("Build, lint, typecheck, test") OR a **maintainer** change-request/failure comment (`fmchisti`) — newer than last-handled. Bot comments (Copilot / Cursor / Supabase) are NOT gating on their own. |
| D2 | How is PR state detected? | Through the **Chrome extension** (claude-in-chrome), in an active session — same method used to open PRs. No `gh` CLI / stored token required for the default. |
| D3 | What drives the recurring check? | A **session cron** (~20 min) started by `/pr-watch add`, executed per-pass by `pr-shepherd-agent`. Session-scoped (runs while a Claude session is open). |
| D4 | How is a fix made? | **Fresh shallow clone → additive fix (adapt our code to the dev branch's API; never revert upstream) → verify FULL CI parity green → commit clean (no AI trailers) → push the FEATURE branch only.** |
| D5 | Where does the fix also land? | Mirrored into the working tree `CC/` subtree + pushed to our working remote, so CC-Local stays consistent. |
| D6 | How does it avoid re-handling? | **Dedup via `.chat-history/pr-watch-log.md`** — only act on something newer than the last-handled failure/comment/sha. |
| D7 | What happens on a novel failure class? | Append an entry to `pre-pr-learned-checks.md` (symptom → root cause → pre-submit check → fix pattern → PR/date), then **sync across all repos** so the checklist grows + stays consistent. |
| D8 | Session-cron vs durable watcher? | **Session cron is the default** (no extra deps). A **durable Windows Scheduled Task** is an opt-in upgrade — it needs a headless GitHub read (`gh`/token) since the browser is in-session only, so it is not the default. |
| D9 | Codex parity | Mirror skill + agent + command into `.codex/` (command header → `Instructions for Codex`). Runbooks live only in `.docs/`. |

## 4. Guardrails (hard — never crossed autonomously)

- **Feature branch only.** NEVER push `development` / `website@dev` / `website@live`. NEVER merge a PR.
- **Additive + verified.** Only auto-push a fix that is clearly ADDITIVE and verified GREEN across the full
  CI parity. Ambiguous / large / design-decision / can't-go-green-additively → append a clear "needs the
  user" entry to the watch-log and STOP; surface it. Never force.
- **Quiet by default.** A firing with nothing new writes a one-line heartbeat. Substantive output only on
  an actual remediation.
- **Dedup.** Never re-handle a failure already recorded as handled.

## 5. The learned-checks + sync mechanism

`pre-pr-learned-checks.md` is the append-only companion to `pre-pr-checklist.md`. Every time the shepherd
remediates a **novel** gating class (one the checklist did not already cover), it appends an entry — and
because the file is in the component's sync set, it flags the appendage
(`component-change-detector.sh` / `/sync-component pr-shepherd`) and `/sync-flush` commits + pushes it to
every `SYNC-REPOS.md` target + the `.codex` mirror. This is the **one runbook whose CONTENT is
intentionally synced** (unlike other `.docs/runbooks/**`, whose contents stay project-local): over time the
pre-submit checks catch these classes *before* the next PR, shrinking the number of round-trips, and every
repo inherits the lesson.

## 6. Session-cron vs durable — the decision, in one line

**Default = session cron** (zero extra dependencies; detection is in-session via the Chrome extension).
**Opt-in = a durable Windows Scheduled Task** on the idle-handoff pattern that fires a headless monitor —
which needs a `gh`/token to read PR state without the browser. Left as an opt-in precisely because it adds
that dependency; see the runbook's "Durable upgrade".

## 7. Relationship to `contributor-conventions` + `pre-pr-checklist`

- `contributor-conventions` + `/promote-pr` **OPEN** the feature-branch PR into the upstream dev branch.
- `pre-pr-checklist` (+ the learned-checks companion) is the set of checks that must be green.
- `pr-shepherd` is the **maintenance half**: it keeps that already-open PR green through every round until
  it merges. It enforces the same checks the pre-PR flow does, and feeds new lessons back into them.

## 8. Portability staging

Per `.other-devices/README.md`, staged as a self-contained, installable package. See `FILE-TREE.md`
(what it touches) + `MANIFEST.md` (where it goes) + `NOTES.md` (rationale + gotchas). Modeled structurally
on `contributor-conventions` / `device-sync-protocol`.
