# Design note — Contributor Conventions (`contributor-conventions`)

> **Status:** ✅ Built + staged. Portable package:
> `.other-devices/components/contributor-conventions/`.
> **Goal:** codify how we work on repos where **we are a contributor, not the sole owner** — keep the
> fast owner-style flow on our own working remote, and make an upstream push a deliberate, gated,
> PR-shaped act that happens only on explicit request.
> **Companion to:** `device-sync-protocol` (that convention says *which branch on this machine*; this
> one says *what our relationship to this repo is* and therefore *where a push may go*). Full
> user-facing explanation: the runbook `.docs/runbooks/development/contributor-conventions.md`
> (copied into `artifacts/`).

---

## 0. Decisions (locked)

| # | Question | Decision |
|---|----------|----------|
| D1 | How does an agent know a repo is contributor vs owner? | **A tracked root file `repo.local.md`** (sibling to `device.local.md`). Section 1 = one-of-two checkbox (`owner` / `contributor`). Missing/ambiguous → **fail-safe to `contributor`**. |
| D2 | Where does day-to-day work push on a contributor repo? | **Our own CC-Local-style WORKING remote** (`working_remote`) — a same-structure mirror (root `.adr/` `.docs/` `.chat-history/` + the app subtree). Commit + push as you work, exactly like an owner repo. |
| D3 | When may we push upstream? | **Only on an explicit user request AND when the feature is PR-ready/complete.** Otherwise upstream is read-only. |
| D4 | How does a change reach upstream? | **A feature-branch PR into the upstream DEV branch** (`upstream_base`) — never a direct push to dev/live, never merged by us. A PR proposes; the maintainer merges. |
| D5 | What is upstream-relevant? | **Only the app subtree** (`app_subtree`, e.g. `CC/`). Root `.adr/` `.docs/` `.chat-history/` never go upstream. Everything upstream stays additive/non-breaking. |
| D6 | Promotion mechanics | **`<app_subtree>`-relative patch → clone upstream fresh → branch off current dev → `git apply --3way` (union additive conflicts) → typecheck via `turbo` → push feature branch → open PR (body → integration guide).** |
| D7 | Does every contributor repo get a mirror? | **Yes** — we create a same-structure working-remote mirror for every contributor repo and write it into `repo.local.md` as `working_remote` as soon as it exists. |
| D8 | How is an accidental upstream push prevented? | **Layered assurance:** declaration file + SessionStart banner + fail-open pre-push guard + skill + governance line. Escape hatch `CONTRIBUTOR_PUSH_OK=1` marks a deliberate promotion push. |
| D9 | Who owns the hooks? | **The orchestrator** (safety-critical): builds `contributor-repo-check.sh` + `contributor-push-guard.sh` and registers them in `settings.json`. This component only **specifies** them (`HOOKS-TODO.md`) and never edits `settings.json`. |
| D10 | Codex parity | **Yes** — mirror skill, both commands, and the agent into `.codex/`; append the one-line governance pointer to `.codex/CODEX.md` + `.codex/AGENTS.md` (syncing-claude-codex). |

---

## 1. Two-remote model

| Remote | Structure | Role |
|--------|-----------|------|
| `working_remote` (CC-Local mirror) | root `.adr/` `.docs/` `.chat-history/` + app subtree | DEFAULT push target — owner-style fast flow |
| `upstream_remote` (product repo) | app only | read-only from our side; receives only additive, PR-shaped, app-subtree changes |

```
   local working tree ──push as you work──▶ working_remote (CC-Local mirror)
        │
        └─/promote-pr (explicit go): app-subtree patch → fresh clone → feature branch ──PR──▶ upstream_base (dev)
                                                                                          maintainer merges ──▶ upstream_live (prod)
```

## 2. Component build sheet

| Component | Path | Responsibility |
|---|---|---|
| **Declaration** | `repo.local.md` (root, tracked) | owner vs contributor + remotes |
| **Template** | `artifacts/repo.local.md.template` | placeholder starting point |
| **Skill** `contributor-conventions` | `.claude/skills/contributor-conventions/SKILL.md` (+ `.codex/`) | ownership check → default-to-working-remote → PR promotion flow |
| **Command** `/promote-pr` | `.claude/commands/promote-pr.md` (+ `.codex/`) | run the promotion (explicit go only) |
| **Command** `/declare-repo` | `.claude/commands/declare-repo.md` (+ `.codex/`) | create/update `repo.local.md` |
| **Agent** `contributor-promotion-agent` | `.claude/agents/contributor-promotion-agent/AGENT.md` (+ `.codex/`) | executes the promotion autonomously |
| **Hook (SessionStart)** | `.claude/hooks/scripts/contributor-repo-check.sh` (+ `.codex/`) | banner — **ORCHESTRATOR-OWNED** |
| **Hook (PreToolUse)** | `.claude/hooks/scripts/contributor-push-guard.sh` (+ `.codex/`) | fail-open guard — **ORCHESTRATOR-OWNED** |
| **Governance line** | `production-pr-on-request` block in `CLAUDE.md` · `.claude/CLAUDE.md` · `.codex/CODEX.md` · `.codex/AGENTS.md` · git-workflow-agent | one-line pointer |
| **Runbook** | `.docs/runbooks/development/contributor-conventions.md` | the full explanation |
| **System docs** | `.codex/system_docs/contributor_conventions/` (README · USAGE_GUIDE · ARCHITECTURE · HOOKS-TODO) | component reference |

## 3. Relationship to `device-sync-protocol` and `production-pr-on-request`

- `device.local.md` resolves *which device* → *which working lane*; `repo.local.md` resolves *what our
  relationship to this repo is* → *where a push may go*. Two orthogonal `*.local.md` siblings.
- The `production-pr-on-request` convention block is the general house rule (built for Collectible
  Classics); this component **operationalizes** it into a reusable skill + agent + commands +
  declaration file + hooks, and the block carries a one-line pointer to it.

## 4. Validation checklist

- [ ] `repo.local.md` present at the repo root, tracked, exactly one ownership box checked.
- [ ] `/declare-repo` writes/updates `repo.local.md`, preserving unspecified fields.
- [ ] `/promote-pr` gate refuses on `owner` / no-explicit-request / mid-flight; on go, PRs into
      `upstream_base` (never dev/live directly).
- [ ] `.claude` ⇄ `.codex` mirrors aligned; system_docs present; package staged in `.other-devices/`.
- [ ] Orchestrator has built + wired + tested the two hooks (`HOOKS-TODO.md`).
- [ ] One-line governance pointer present in all five instruction/agent files.

## 5. Portability staging

Per `.other-devices/README.md`, staged as a self-contained, installable package. See `FILE-TREE.md`
(what it touches) + `MANIFEST.md` (where it goes) + `NOTES.md` (rationale + gotchas).
