<!-- The contributor-conventions component adds exactly ONE line at the END of the EXISTING
     `production-pr-on-request` convention block (do NOT rewrite the block, do NOT add a new block).
     Append it as the last bullet, immediately before the `<!-- END production-pr-on-request convention -->`
     marker, in all five files:
       CLAUDE.md · .claude/CLAUDE.md · .codex/CODEX.md · .codex/AGENTS.md ·
       .claude/agents/git-workflow-agent/AGENT.md
     Idempotent: if the line is already present, do not duplicate it. -->

- Full component: skill `contributor-conventions` + `.docs/runbooks/development/contributor-conventions.md`; per-repo status declared in `repo.local.md`.

<!-- Rationale: the `production-pr-on-request` block is the general house rule (built for Collectible
     Classics). This one line points it at the reusable component that operationalizes it (skill + agent
     + /promote-pr + /declare-repo + the two orchestrator-owned hooks) and at the per-repo declaration
     file `repo.local.md`. Keep the block otherwise unchanged. -->
