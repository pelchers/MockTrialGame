# `contributor-conventions` — portable component package

**What it is:** the rules for working on a repo where **we are a contributor, not the sole owner**.
Applies **ONLY when `repo.local.md` declares `contributor`** — on an `owner` (sole-dev) repo it is
inert and the normal commit-and-push-as-you-work flow applies everywhere.

For a contributor repo it enforces a **two-remote model**: day-to-day work commits + pushes to our own
**CC-Local-style working remote** (a same-structure mirror we create for every contributor repo), while
the **upstream/production repo is PR-only** — all upstream pushes are HELD until (a) an explicit user
request AND (b) the feature is PR-ready/complete, then promoted via a **feature-branch PR into the
upstream dev branch** (never a direct push to dev/live, never merged by us).

Companion to `device-sync-protocol`: that component answers *which branch on this machine*; this one
answers *what our relationship to this repo is* and therefore *where a push may go*.

**Type:** full component — declaration file + skill + 2 commands + agent + 2 hooks (spec only;
orchestrator-owned) + system_docs + runbook + governance pointer.

## Package contents

| File | What it is |
|---|---|
| `README.md` | this overview |
| `MANIFEST.md` | install map (file → target path in a destination repo) |
| `FILE-TREE.md` | every file this component adds/edits in the host repo (the install checklist) |
| `NOTES.md` | development context + rationale + gotchas |
| `artifacts/SKILL.md` | the `contributor-conventions` skill (== `.claude` == `.codex`) |
| `artifacts/AGENT.md` | the `contributor-promotion-agent` (== `.claude` == `.codex`) |
| `artifacts/promote-pr.md` | the `/promote-pr` command (Codex variant: header only) |
| `artifacts/declare-repo.md` | the `/declare-repo` command (Codex variant: header only) |
| `artifacts/repo.local.md.template` | the declaration template (placeholders; both ownership boxes unchecked) |
| `artifacts/runbook-contributor-conventions.md` | the full runbook |
| `artifacts/HOOKS-TODO.md` | the two hook specs — **orchestrator builds the scripts + registers them** |
| `plans/contributor-conventions-design.md` | design note (decisions + two-remote model) |
| `snippets/convention-snippet.md` | the one-line governance pointer (paste-ready) |
| `snippets/sessionstart-hook-note.md` | the two hooks documented (orchestrator-owned; no settings.json edit here) |

## Install (summary — full map in `MANIFEST.md`)

1. Copy `artifacts/SKILL.md` → `.claude/skills/contributor-conventions/SKILL.md` (+ `.codex/` mirror).
2. Copy the two commands → `.claude/commands/` (+ `.codex/`, header → *Instructions for Codex*).
3. Copy `artifacts/AGENT.md` → `.claude/agents/contributor-promotion-agent/AGENT.md` (+ `.codex/`).
4. Copy `artifacts/repo.local.md.template` → repo root as the template; create `repo.local.md` via
   `/declare-repo`.
5. Copy `artifacts/runbook-contributor-conventions.md` → `.docs/runbooks/development/contributor-conventions.md`.
6. Regenerate/copy system_docs → `.codex/system_docs/contributor_conventions/` (README · USAGE_GUIDE ·
   ARCHITECTURE · HOOKS-TODO).
7. Append the one-line governance pointer (`snippets/convention-snippet.md`) to the END of the
   `production-pr-on-request` block in the instruction files + `git-workflow-agent`.
8. **Hand the two hooks to the orchestrator** (build scripts + register in `settings.json` + test) —
   see `artifacts/HOOKS-TODO.md`. **This component never edits `settings.json`.**

## Note on the hooks

The two hook **scripts** (`contributor-repo-check.sh`, `contributor-push-guard.sh`) and their
`settings.json` registration are **orchestrator-owned (safety-critical)** and are **not** shipped as
runnable scripts in this package — only **specified precisely** in `artifacts/HOOKS-TODO.md`. The skill
+ declaration file govern behavior until the hooks are wired.
