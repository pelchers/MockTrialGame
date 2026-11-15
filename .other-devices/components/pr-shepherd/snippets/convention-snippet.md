<!-- The pr-shepherd component adds ONE managed, marker-guarded convention block to each of the four
     always-loaded instruction files:
       CLAUDE.md · .claude/CLAUDE.md · .codex/CODEX.md · .codex/AGENTS.md
     Append it AFTER the last existing managed block (idempotent: guard on the `pr-shepherd convention`
     marker / the block title — if already present, do NOT duplicate). It is a NEW block (not an append to
     an existing block, unlike contributor-conventions). The block below (BEGIN … END inclusive) is the
     exact paste-ready content; the sync-component convention-append extracts it by its marker. -->

<!-- BEGIN pr-shepherd convention (managed; append idempotently — do not duplicate) -->
## PR Shepherd — auto-watch + remediate submitted PRs (Required)
- After `/promote-pr` opens a feature-branch PR into the upstream **dev branch**, the **PR Shepherd**
  (`/pr-watch`, skill `pr-shepherd`, agent `pr-shepherd-agent`) watches it and **auto-remediates each
  CI/maintainer gating failure ADDITIVELY on the feature branch** — round after round — **until it merges
  into the dev branch** (deployed). Applies ONLY to `contributor` repos (`repo.local.md`).
- **Feature-branch only; never push `development`/`website@dev`/`website@live`; never merge a PR; escalate
  anything ambiguous / large / design-decision** — log "needs the user" in the watch-log and STOP.
- A **novel** failure class is appended to `.docs/runbooks/development/pre-pr-learned-checks.md` and synced
  across repos, so the same class never costs a round-trip again.
- Per-PR state lives in `.chat-history/pr-watch-log.md` (dedup — never re-handle a handled failure).
  **Session-scoped by default**; a durable Windows Scheduled Task is an opt-in (runbook
  `.docs/runbooks/development/pr-shepherd.md`).
<!-- END pr-shepherd convention -->

<!-- Rationale: the PR Shepherd is the maintenance half of the contributor-promotion flow — it keeps an
     already-open upstream PR green through every CI round + maintainer review until it merges, without the
     user babysitting it. The block sits alongside `production-pr-on-request` / `contributor-conventions`
     (which OPEN the PR) and points at the skill/agent/command + the synced learned-checks registry. Keep
     the wording in lock-step with the four files' copies. -->
