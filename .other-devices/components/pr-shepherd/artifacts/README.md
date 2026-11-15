# PR Shepherd System

## Overview
Keeps a submitted **upstream CONTRIBUTOR pull request** moving from **submission → CI/review rounds →
merged** without the user babysitting it. The maintainer (`fmchisti`) very often returns small gating
issues shortly after each push; the shepherd catches each one, fixes it **additively** on the PR's feature
branch, re-pushes, and watches again — **until the PR is merged into the upstream dev branch** (deployed).
It is self-improving: a novel gating-failure class is appended to the synced `pre-pr-learned-checks.md`
so the same class never costs a round-trip again, on any repo.

Applies **ONLY** to repos where `repo.local.md` declares `contributor` and to feature-branch PRs we
opened into the upstream dev branch (via `/promote-pr`). Companion to **`contributor-conventions`** (which
opens the PR) and the **pre-PR checklist** (the checks it enforces).

## Components
| Component | `.claude` path | `.codex` path |
|---|---|---|
| **Skill** `pr-shepherd` | `.claude/skills/pr-shepherd/SKILL.md` | `.codex/skills/pr-shepherd/SKILL.md` |
| **Agent** `pr-shepherd-agent` | `.claude/agents/pr-shepherd-agent/AGENT.md` | `.codex/agents/pr-shepherd-agent/AGENT.md` |
| **Command** `/pr-watch` | `.claude/commands/pr-watch.md` | `.codex/commands/pr-watch.md` (header → Instructions for Codex) |
| **Runbook** | `.docs/runbooks/development/pr-shepherd.md` | — (runbooks live only in `.docs/`) |
| **Learned-checks registry** | `.docs/runbooks/development/pre-pr-learned-checks.md` | — (runbooks live only in `.docs/`; CONTENT is synced) |
| **System docs** | `.claude/system_docs/pr_shepherd/README.md` (this) · `USAGE_GUIDE.md` | `.codex/system_docs/pr_shepherd/README.md` (this) · `USAGE_GUIDE.md` |
| **State (per-PR watch-log)** | `.chat-history/pr-watch-log.md` (project-local — component syncs, contents do not) | — |
| **Convention block** | `CLAUDE.md` · `.claude/CLAUDE.md` (managed `PR Shepherd` block) | `.codex/CODEX.md` · `.codex/AGENTS.md` (managed `PR Shepherd` block) |
| **Portable package** | `.other-devices/components/pr-shepherd/` (MANIFEST + FILE-TREE + NOTES + artifacts/ + plans/ + snippets/) | (same) |

## How it works (the loop)
1. `/promote-pr` opens a feature-branch PR into the upstream dev branch → `/pr-watch add #N <branch>`
   registers it in `.chat-history/pr-watch-log.md` and starts a recurring in-session check (session cron,
   ~20 min), executed per-pass by the `pr-shepherd-agent`.
2. Each firing reads PR state through the **Chrome extension** (in-session): the "Build, lint, typecheck,
   test" CI job on `.../pull/<N>/checks`, and the newest comment/review by the **maintainer** on
   `.../pull/<N>` (bots are ignored). Nothing newer than last-handled → a one-line heartbeat, stop (quiet).
3. On a NEW gating failure (red CI job OR a maintainer change-request), **remediate**: reproduce in a fresh
   shallow clone → fix **additively** (adapt our code to the dev branch's API; never revert upstream) →
   verify FULL CI parity green → commit clean (no AI trailers) → push to the FEATURE branch only → update
   the watch-log.
4. A novel failure class is appended to `pre-pr-learned-checks.md` and synced across repos. When the PR
   shows **Merged**, deregister it — deployed to the dev branch.

## Guardrails
- **Feature branch only.** NEVER push to `development` / `website@dev` / `website@live`; NEVER merge a PR.
- **Additive + verified.** Only auto-push a fix that is clearly ADDITIVE and verified GREEN across the full
  CI parity. Ambiguous / large / design-decision / can't-go-green-additively → append a "needs the user"
  entry to the watch-log and STOP; surface it. Never force anything.
- **Escalate ambiguity.** A maintainer request that needs a design decision is never auto-remediated.
- **Quiet + dedup.** A firing with nothing new writes a one-line heartbeat; never re-handle a failure
  already recorded as handled in the watch-log. Substantive output only on an actual remediation.

## Notes
- Session-scoped by default (the watcher runs while a Claude session is open). A durable Windows Scheduled
  Task is an opt-in upgrade (see the runbook's "Durable upgrade") — it needs `gh`/token for headless
  detection, so the default is the session cron.
- Skill, agent, and command are mirrored `.claude` ⇄ `.codex` per the claude-codex sync convention; the
  runbook + learned-checks live only in `.docs/`.
- Portable copy: `.other-devices/components/pr-shepherd/`.
