# feature-user-docs — sync manifest

The exact file set that travels when this component is propagated to the `SYNC-REPOS.md` targets
(via `/sync-component` → `/sync-flush`). Mirrors the "What to sync" convention in `SYNC-REPOS.md`.

## Component files (SYNC these)

```
.claude/agents/feature-user-docs-agent/AGENT.md
.claude/skills/feature-user-docs/SKILL.md
.claude/skills/feature-user-docs/references/overview-template.md
.claude/skills/feature-user-docs/references/adr-pointer-stub.md
.claude/skills/feature-user-docs/references/sync-manifest.md
.claude/skills/feature-user-docs/scripts/feature-user-docs.py
.claude/hooks/scripts/feature-user-docs-detect.sh
.claude/commands/feature-user-docs.md
.claude/system_docs/feature_user_docs/README.md
.claude/system_docs/feature_user_docs/USAGE_GUIDE.md
.claude/system_docs/feature_user_docs/ARCHITECTURE.md
.claude/system_docs/feature_user_docs/SYSTEM_OVERVIEW.md

.codex/agents/feature-user-docs-agent/AGENT.md
.codex/skills/feature-user-docs/SKILL.md
.codex/skills/feature-user-docs/references/overview-template.md
.codex/skills/feature-user-docs/references/adr-pointer-stub.md
.codex/skills/feature-user-docs/references/sync-manifest.md
.codex/skills/feature-user-docs/scripts/feature-user-docs.py
.codex/hooks/scripts/feature-user-docs-detect.sh
.codex/commands/feature-user-docs.md
.codex/system_docs/feature_user_docs/README.md
.codex/system_docs/feature_user_docs/USAGE_GUIDE.md
.codex/system_docs/feature_user_docs/ARCHITECTURE.md
.codex/system_docs/feature_user_docs/SYSTEM_OVERVIEW.md
```

Plus hook registration in each target's `.claude/settings.json` (SessionStart + PostToolUse) and
`.claude/hooks/settings.json` — appended **idempotently**, never wholesale-overwritten.

## Project data (NEVER synced)

| Path | Why |
|---|---|
| `.docs/planning/<feature>/user-docs/**` | Per-project reading maps. Every repo grows its own; another repo's f11 map is meaningless here. |
| `.adr/orchestration/<feature>/user-docs/README.md` | Same — per-project pointer stubs. |
| `.git/feature-user-docs/*.state` | Per-clone phase-completion fingerprints. Untracked by design. |

Same split as `cycle-back` and `pr-shepherd`: **the component travels, the log/content stays local.**

## Portability notes

The component is repo-agnostic except for one constant in `scripts/feature-user-docs.py`:

```python
APP_SUBTREE = "CC"   # the product subtree that `apps/` and `packages/` paths resolve under
```

In a repo where the app is at the root rather than in a subtree, set `APP_SUBTREE = ""`. Everything
else (`.adr/orchestration/`, `.docs/planning/`, the three phase-completion markers) is already the
shared ADR convention. Per `verifying-agnosticism`, that constant is the single value to review on
onboarding.
