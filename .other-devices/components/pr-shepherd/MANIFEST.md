# MANIFEST — `pr-shepherd`

**What it is:** the **maintenance half** of the contributor-promotion flow — it watches a **submitted
upstream CONTRIBUTOR PR** and shepherds it through every CI round and maintainer review until it is
**merged into the upstream dev branch** (deployed). On a NEW gating failure (a red CI job OR a
maintainer change-request) it remediates **ADDITIVELY** on the PR's feature branch, verifies full CI
parity, re-pushes, and keeps watching. Self-improving: a novel failure class is appended to the synced
`pre-pr-learned-checks.md`.

**Type:** component — skill + agent + command + runbook + learned-checks registry + system_docs +
per-PR state file + a managed convention block. Applies **ONLY when `repo.local.md` declares
`contributor`**. Companion to `contributor-conventions` (opens the PR) + the pre-PR checklist.

**Self-documenting package contents:**
- `MANIFEST.md` — this install map (file → target path in a destination repo).
- `FILE-TREE.md` — every file added/edited in the host repo (the install checklist + counts).
- `artifacts/` — exact copies of the live files (skill, agent, command, runbook, learned-checks, system_docs).
- `plans/` — the approved design note (purpose, the loop, composition, guardrails, learned-checks+sync,
  session-cron-vs-durable decision).
- `snippets/` — the paste-ready convention block + the one-line `/promote-pr` hand-off step.
- `NOTES.md` — development context + rationale + gotchas.

---

## Prerequisite

The repo must be a **`contributor`** repo (`repo.local.md`) — this component is the maintenance half of
`contributor-conventions`, which should already be installed (`/promote-pr` opens the PR this watches).
Detection uses the **Chrome extension** (claude-in-chrome) in an active session; the default watcher is a
**session cron** (no `gh`/token required).

## Install into a target repo (file → target path)

| From (this package) | → Target path in destination repo | Action | Per-target adaptation |
|---|---|---|---|
| `artifacts/SKILL.md` | `.claude/skills/pr-shepherd/SKILL.md` | create | — |
| `artifacts/SKILL.md` | `.codex/skills/pr-shepherd/SKILL.md` | create (mirror) | byte-identical |
| `artifacts/AGENT.md` | `.claude/agents/pr-shepherd-agent/AGENT.md` | create | — |
| `artifacts/AGENT.md` | `.codex/agents/pr-shepherd-agent/AGENT.md` | create (mirror) | byte-identical |
| `artifacts/pr-watch.md` | `.claude/commands/pr-watch.md` | create | — |
| `artifacts/pr-watch.md` | `.codex/commands/pr-watch.md` | create (mirror) | change ONLY the heading `## Instructions for Claude` → `## Instructions for Codex` (matches `/promote-pr`) |
| `artifacts/runbook-pr-shepherd.md` | `.docs/runbooks/development/pr-shepherd.md` | create | runbook lives ONLY in `.docs/` — do NOT mirror into `.codex` |
| `artifacts/pre-pr-learned-checks.md` | `.docs/runbooks/development/pre-pr-learned-checks.md` | create (or MERGE if present) | runbook lives ONLY in `.docs/`; its **CONTENT is intentionally synced** (the learned-checks registry) — append entries, never wholesale-overwrite |
| `artifacts/README.md` | `.claude/system_docs/pr_shepherd/README.md` | create | — |
| `artifacts/README.md` | `.codex/system_docs/pr_shepherd/README.md` | create (mirror) | identical |
| `artifacts/USAGE_GUIDE.md` | `.claude/system_docs/pr_shepherd/USAGE_GUIDE.md` | create | — |
| `artifacts/USAGE_GUIDE.md` | `.codex/system_docs/pr_shepherd/USAGE_GUIDE.md` | create (mirror) | identical |
| `snippets/convention-snippet.md` | append the managed `pr-shepherd` block to `CLAUDE.md`, `.claude/CLAUDE.md`, `.codex/CODEX.md`, `.codex/AGENTS.md` | edit (idempotent) | append the whole BEGIN…END block AFTER the last existing managed block; guard on the `pr-shepherd convention` marker — do NOT duplicate |
| `snippets/promote-pr-integration.md` | describes a one-line hand-off step added to `/promote-pr` (`.claude` + `.codex`) | edit (operator-applied) | this package does NOT edit `/promote-pr`; the operator adds the `/pr-watch add` step |
| `plans/pr-shepherd-design.md` | `.docs/planning/plans/<n>-pr-shepherd.md` | create (optional; renumber) | — |

## Install steps that are edits to shared wiring

1. **Sync array** — add the component's paths to the `FILES=(…)` array in
   `.claude/hooks/scripts/sync-component.sh` (append; do not reorder): the skill, agent, command, both
   system_docs (README + USAGE_GUIDE), the runbook, `pre-pr-learned-checks.md`, and every `.codex` mirror.
2. **Master system_docs index** — add a `pr_shepherd/` block to the **File Tree** section and a row to the
   **System Overview** table (1 agent · 1 skill · `/pr-watch`), bumping the Total — in BOTH
   `.codex/system_docs/README.md` and `.claude/system_docs/README.md`.
3. **`SYNC-REPOS.md`** — register the `pr-shepherd` component under "What to sync" (name its file classes),
   add `pr-shepherd.md` to the synced `.docs/runbooks/**` set, add `pre-pr-learned-checks.md` with the note
   that it is the one runbook whose CONTENT is synced, and add `pr-shepherd` to the managed-blocks list.
4. **`/promote-pr` hand-off** — see `snippets/promote-pr-integration.md` (operator-applied one-liner so the
   opened PR auto-registers into the watch-list).

## Per-target adaptation

- **Upstream identifiers** — the skill/runbook reference the maintainer (`fmchisti`), the CI job name
  ("Build, lint, typecheck, test"), and the CI-env placeholders from the target's own
  `.github/workflows/ci.yml`. On a different upstream, adapt those to the target repo's maintainer handle,
  job name, and workflow env.
- **App subtree** — the "mirror the fix into `CC/`" step uses the target's `app_subtree` from
  `repo.local.md`.
- **Watcher cadence** — the session-cron interval (~20 min) is tunable in `/pr-watch add`.

## Post-install validation (run in the target repo)

1. `repo.local.md` declares `contributor` (the shepherd is inert on an `owner` repo).
2. `.claude` ⇄ `.codex` parity for skill, agent, command (command differs only in the header line).
3. The two runbooks exist under `.docs/runbooks/development/` and are **NOT** mirrored into `.codex`.
4. Master system_docs README(s) parse (File Tree + System Overview tables intact; Total bumped).
5. The managed `pr-shepherd` convention block is present exactly once in each of the four instruction files.
6. `/pr-watch status` reads/prints the (empty) watch-list; `/pr-watch add` registers a PR + starts the cron.

## Provenance
- Origin repo: CC-Local (`C:\Work\App\CC-Local`), lane `Asus-Work`, machine asus-laptop.
- Modeled structurally on `contributor-conventions` / `device-sync-protocol`.
- Live sources mirror under `.claude/` + `.codex/` + `.docs/` of the origin repo; per-PR state is
  project-local in `.chat-history/pr-watch-log.md`.
