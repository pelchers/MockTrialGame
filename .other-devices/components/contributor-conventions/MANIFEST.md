# MANIFEST — `contributor-conventions`

**What it is:** the rules for working on a repo where **we are a contributor, not the sole owner**.
Applies **ONLY when `repo.local.md` declares `contributor`**; on an `owner` repo it is inert. For a
contributor repo: day-to-day work pushes to our own **CC-Local-style working remote**; the
**upstream/production repo is PR-only** — HELD until an explicit user request + PR-ready, then promoted
via a **feature-branch PR into the upstream dev branch** (never a direct push, never merged by us).

**Type:** full component (declaration file + skill + 2 commands + agent + 2 hooks [spec only] +
system_docs + runbook + governance pointer). Companion to `device-sync-protocol`.

**Self-documenting package contents:**
- `README.md` — overview + quick install.
- `FILE-TREE.md` — every file added/edited in the host repo (the install checklist).
- `artifacts/` — exact copies of the live files (+ the declaration template + hook specs).
- `plans/` — the design note (decisions + two-remote model).
- `snippets/` — the one-line governance pointer + the two-hooks note.
- `NOTES.md` — development context + rationale + gotchas.

---

## Prerequisite

None hard-required. Pairs naturally with `device-sync-protocol` (both read a tracked `*.local.md`
sibling at the repo root), but installs standalone.

## Install into a target repo (file → target path)

| From (this package) | → Target path in destination repo | Action |
|---|---|---|
| `artifacts/SKILL.md` | `.claude/skills/contributor-conventions/SKILL.md` | create |
| `artifacts/SKILL.md` | `.codex/skills/contributor-conventions/SKILL.md` | create (mirror) |
| `artifacts/promote-pr.md` | `.claude/commands/promote-pr.md` | create |
| `artifacts/promote-pr.md` | `.codex/commands/promote-pr.md` | create (header → `Instructions for Codex`) |
| `artifacts/declare-repo.md` | `.claude/commands/declare-repo.md` | create |
| `artifacts/declare-repo.md` | `.codex/commands/declare-repo.md` | create (header → `Instructions for Codex`) |
| `artifacts/AGENT.md` | `.claude/agents/contributor-promotion-agent/AGENT.md` | create |
| `artifacts/AGENT.md` | `.codex/agents/contributor-promotion-agent/AGENT.md` | create (mirror) |
| `artifacts/repo.local.md.template` | `repo.local.md.template` (repo root) | create; then `/declare-repo` writes `repo.local.md` |
| `artifacts/runbook-contributor-conventions.md` | `.docs/runbooks/development/contributor-conventions.md` | create |
| `plans/contributor-conventions-design.md` | `.docs/planning/plans/<n>-contributor-conventions.md` | create (optional; renumber) |
| `snippets/convention-snippet.md` | append the ONE line at the END of the `production-pr-on-request` block in `CLAUDE.md`, `.claude/CLAUDE.md`, `.codex/CODEX.md`, `.codex/AGENTS.md`, `.claude/agents/git-workflow-agent/AGENT.md` | edit |
| — (system docs; regenerate or copy) | `.codex/system_docs/contributor_conventions/README.md` + `USAGE_GUIDE.md` + `ARCHITECTURE.md` + `HOOKS-TODO.md` | create |
| `artifacts/HOOKS-TODO.md` → **orchestrator** | build `.claude/hooks/scripts/contributor-repo-check.sh` + `contributor-push-guard.sh` (+ `.codex/`) **and register in `settings.json`** | **orchestrator-owned — NOT applied by this package** |

## ⚠ Orchestrator-owned (do NOT do in this component's install)

- **Do NOT create the two hook scripts.** `contributor-repo-check.sh` (SessionStart) and
  `contributor-push-guard.sh` (PreToolUse, fail-open) are built by the orchestrator.
- **Do NOT edit `settings.json`** (`.claude/settings.json` or `.codex/hooks/settings.json`). The
  orchestrator registers + tests the hooks. Specs: `artifacts/HOOKS-TODO.md`.

## Per-target adaptation

- **Remotes:** set `working_remote`, `upstream_remote`, `upstream_base`, `upstream_live`, `app_subtree`
  in the target's `repo.local.md` via `/declare-repo` (or edit the file). The *shape* is identical; only
  the remotes + subtree change per repo.
- **Ownership:** check `owner` on repos we own outright (the component then stays inert), `contributor`
  on repos we contribute to.
- **App subtree:** if the target's app lives at the repo root (not a subtree), set `app_subtree` to `.`
  and the whole repo is upstream-relevant (rare for our setup).

## Post-install validation (run in the target repo)

1. `repo.local.md` present at the repo root, tracked, exactly one ownership box checked.
2. `/declare-repo` writes/updates `repo.local.md`, preserving unspecified fields.
3. `/promote-pr` gate refuses on `owner` / no-explicit-request / mid-flight; on go, runs
   patch → fresh clone → feature branch → PR into `upstream_base` (never dev/live directly).
4. `.claude` ⇄ `.codex` parity (skill, both commands, agent); system_docs entry exists.
5. Orchestrator has built + wired + tested both hooks (`HOOKS-TODO.md`).
6. One-line governance pointer present at the END of the `production-pr-on-request` block in all five files.

## Provenance
- Origin repo: CC-Local (`C:\Work\App\CC-Local`), branch `simple-affiliate-system`, machine home-desktop.
- Built via the component-creation-pipeline, modeled structurally on `device-sync-protocol`.
- Live sources mirror under `.claude/` + `.codex/` + `.docs/` + `repo.local.md` of the origin repo.
