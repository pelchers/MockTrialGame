# Sync Repos

When adding new agents, skills, or system docs to `.claude/` and `.codex/`, also sync them to these repos:

| Repo | Path | Notes |
|------|------|-------|
| CC-Local | `C:\Work\App\CC-Local` | Collectible Classics contributor working repo |
| Template | `C:\Template\Claude+Codex Agent+Skill Sync\All` | Primary template — all agents/skills/system_docs |
| MockTrial | `C:\Game\MockTrial.game` | Game project |
| AppDock | `C:\App\AppDock` | App project |
| PortfolioV1 | `C:\App\PortfolioV1` | Portfolio project |
| IDEA-MANAGEMENT | `C:\Ideas\IDEA-MANAGEMENT` | Idea management app  |
| Markdown Mermaid Editor | `C:\Extensions\Markdown Mermaid Editor` | VS Code extension |
| Campus | `C:\coding\apps\campus` | Campus app |
| Restaurant-MarTech | `C:\App\Portfolios\Restaurant-MarTech` | Restaurant marketing portfolio |
| Dispatch Template | `C:\Dispatch\Template\All` | Dispatch template — all agents/skills/system_docs |
| Brand-MarTech | `C:\App\Portfolios\Brand-MarTech` | Umbrella marketing portfolio (core site) |
| OutreachAI | `C:\Tool\OutreachAI` | Local-first creator outreach drafting workstation |
| DualLeads | `C:\Tool\Clients\CC\DualLeads` | Collectible Classics dual-lead (buyer+seller) car-scraping dashboard |
| HealthApps (umbrella) | `C:\App\HealthApps` | Health-app umbrella directory — sync deferred until user authorizes |
| LivBeyond | `C:\App\HealthApps\LivBeyond` | Health metrics demo (LivBeyond client work) — sync deferred until user authorizes |

## What to sync

- `sync-repos-*.md` device-local sync manifests, including `sync-repos-asus-laptop.md`
- `SYNC-REPOS.md` global/cross-machine sync manifest
- `device.local.example.md`
- `.claude/agents/<name>/AGENT.md`
- `.claude/skills/<name>/SKILL.md`
- `.claude/commands/<name>.md` when a component includes a slash command
- `.claude/hooks/scripts/<name>.sh` or `.ps1` when a component includes a hook
- **feature-review component** (root `FEATURE-REVIEW.md` state + review index) — **REGISTERED +
  PROPAGATED 2026-10-14** (from `asus-laptop`/VENGEANCE, the first device with the targets present;
  it was authored 2026-10-13 on `DESKTOP-16O74RE` where no target existed). Now a first-class synced
  component: its files are in `sync-component.sh`'s FILES list, its SessionStart hook in that script's
  `wire_hook` WANT list, its convention block is a managed `<!-- BEGIN feature-review convention -->`
  block carried by `ensure_block`, and its paths are in `sync-flush.sh`'s PATHS list — so future
  `/sync-component` → `/sync-flush` runs carry it automatically. Files:
  `.claude/skills/feature-review/SKILL.md`,
  `.claude/agents/feature-review-agent/AGENT.md`,
  `.claude/commands/feature-review.md`,
  `.claude/hooks/scripts/feature-review-refresh.sh`,
  `.codex/system_docs/feature_review/README.md` + `USAGE_GUIDE.md`,
  the `.codex/` mirror of each of the first four,
  the `feature_review/` entry in `.codex/system_docs/README.md`,
  and the **"## Feature Review"** convention block in `CLAUDE.md` + `.claude/CLAUDE.md`.
  Also register the hook on `SessionStart` in each target's `.claude/settings.json`
  (`bash .claude/hooks/scripts/feature-review-refresh.sh`).
  The **`FEATURE-REVIEW.md` file itself is project-local and must NOT be copied** — each repo has
  its own features. Only the component travels.
- `.githooks/prepare-commit-msg` + `.githooks/README.md` — the **`Made-By: pelchers` attribution git hook** (contributor-attribution component). **Install per clone by COPY:** `cp .githooks/prepare-commit-msg .git/hooks/prepare-commit-msg && chmod +x .git/hooks/prepare-commit-msg`. Do **NOT** `git config core.hooksPath .githooks` in a target — it would bypass that clone's existing `.git/hooks/*` (e.g. the branched-logs `post-merge`).
- **chat-history-convention + qna-logger components** (verbatim raw-prompt capture) — MUST propagate to
  all sync targets on ingest so the MANDATORY **VERBATIM USER PROMPT(S)** requirement (every user message
  stored EXACTLY as typed — raw, unedited — recoverable from the session transcript JSONL) is enforced
  everywhere. Files: `.claude/skills/chat-history-convention/SKILL.md` +
  `.claude/skills/chat-history-convention/scripts/append-user-message.ps1`,
  `.claude/hooks/scripts/chat-history-reminder.sh` (the UserPromptSubmit reminder),
  `.claude/skills/qna-logger/SKILL.md` (+ `.claude/commands/log-qna.md` + `.claude/system_docs/qna_logger/**`),
  and the `.codex/` mirror of each. The `.chat-history/` CONTENTS stay project-local (NOT synced) — only
  the component travels.
- `.claude/hooks/settings.json` when hook registration changes
- `.claude/system_docs/<name>/README.md`
- `.codex/agents/<name>/AGENT.md`
- `.codex/skills/<name>/SKILL.md`
- `.codex/commands/<name>.md` when a mirrored slash command exists
- `.codex/system_docs/<name>/README.md`
- `.docs/runbooks/**/<name>.md` (component runbooks — e.g. `device-sync-and-handoff-protocol.md`, `device-branch-convention.md`, `contributor-conventions.md`, `pr-shepherd.md`)
- **`pr-shepherd` component** (watch + auto-remediate a submitted upstream contributor PR) — sync the whole
  set: `.claude/skills/pr-shepherd/SKILL.md`, `.claude/agents/pr-shepherd-agent/AGENT.md`,
  `.claude/commands/pr-watch.md`, `.claude/system_docs/pr_shepherd/{README,USAGE_GUIDE}.md`, the
  `.docs/runbooks/development/pr-shepherd.md` runbook, and the `.codex/` mirror of each. The per-PR state
  `.chat-history/pr-watch-log.md` stays project-local (NOT synced) — only the component travels.
- `.docs/runbooks/development/pre-pr-learned-checks.md` — the **PR Shepherd learned-checks registry**; the
  ONE runbook whose **CONTENT is intentionally synced** across repos (every novel gating-failure lesson
  propagates to all `SYNC-REPOS.md` targets via `/sync-component pr-shepherd` → `/sync-flush`), unlike other
  `.docs/runbooks/**` whose contents stay project-local.
- **`cycle-back` component** (park a conversation topic; resume it after context compaction) — sync the whole
  set: `.claude/skills/cycle-back/SKILL.md`, `.claude/agents/cycle-back-agent/AGENT.md`,
  `.claude/commands/cycle-back.md`, `.claude/hooks/scripts/cycle-back-surface.sh`,
  `.claude/system_docs/cycle_back/{README,USAGE_GUIDE}.md`, the `.docs/runbooks/development/cycle-back.md`
  runbook, and the `.codex/` mirror of each (the surfacing hook is registered in each target's
  `.claude/settings.json` SessionStart). The parked-topics log `.chat-history/cycle-back.md` stays
  project-local (NOT synced) — only the component travels.
- **`self-improvement-logging` component** (record how the agents actually performed — benefit + bug/gap +
  verified + commit — so future agents compound) — sync the whole set:
  `.claude/skills/self-improvement-logging/SKILL.md`, `.claude/agents/self-improvement-logger-agent/AGENT.md`,
  `.claude/commands/log-improvement.md`, `.claude/hooks/scripts/self-improvement-surface.sh` +
  `.claude/hooks/scripts/self-improvement-log-reminder.sh`,
  `.claude/system_docs/self_improvement/{README,USAGE_GUIDE}.md`, and the `.codex/` mirror of each (the
  surfacing hook is registered in each target's `.claude/settings.json` SessionStart, and the reminder in
  `.claude/hooks/settings.json` PostToolUse(Task)). The log folder `.self-improving-ai/` CONTENTS
  (`README.md`, `ledger.md`, `log/*.md`) stay project-local (NOT synced; the folder is **ours**, never
  shipped to the product subtree `CC/`) — only the component travels, same split as `cycle-back` /
  `pr-shepherd`.
- `multi-device-and-agent-contract.md` (repo root) + its `.docs/runbooks/development/` duplicate — the cross-device/agent contract explainer
- `repo.local.md` (per-repo ownership + remotes declaration for `contributor-conventions`) + `repo.local.md.template` — `repo.local.md` is TRACKED per-repo; **do not overwrite a target's own checked ownership/remotes** (sibling policy to `device.local.md`)
- `.other-devices/components/<name>/**` (the portable package)
- Convention blocks in `CLAUDE.md`/`.claude/CLAUDE.md`/`.codex/CODEX.md`/`.codex/AGENTS.md` (+ relevant agent AGENT.md) — **appended idempotently, never wholesale-overwritten**. Managed blocks include: `device-sync-and-handoff`, `remote-push-safety`, `production-pr-on-request`, `production-safety-additive`, `dev-only-instance`, **`dev-server-persistence`**, **`docs-organization`**, **`pr-shepherd`**, **`cycle-back`**.
- **`feature-user-docs` component** (per-feature `user-docs/` reading map — the FULL-path, annotated
  "which files do I open, in what order, and why" doc for a feature) — sync the whole set:
  `.claude/skills/feature-user-docs/SKILL.md` + its `references/{overview-template,adr-pointer-stub,sync-manifest}.md`
  + `scripts/feature-user-docs.py`, `.claude/agents/feature-user-docs-agent/AGENT.md`,
  `.claude/commands/feature-user-docs.md`, `.claude/hooks/scripts/feature-user-docs-detect.sh`,
  `.claude/system_docs/feature_user_docs/{README,USAGE_GUIDE,ARCHITECTURE,SYSTEM_OVERVIEW}.md`, and the
  `.codex/` mirror of each (incl. the `.codex/agents/feature-user-docs-agent.md` stub). The hook is
  registered in each target's `.claude/settings.json` **and** `.claude/hooks/settings.json` —
  `SessionStart` (`--session-scan`) + `PostToolUse` (`Edit|Write`) — appended idempotently. The
  per-feature maps `.docs/planning/<feature>/user-docs/**` and the ADR pointer stubs
  `.adr/orchestration/<feature>/user-docs/README.md` stay **project-local (NOT synced)** — only the
  component travels, same split as `cycle-back` / `pr-shepherd`. Portability: the single repo-specific
  constant is `APP_SUBTREE` in `scripts/feature-user-docs.py` (set `""` where the app is at the repo
  root rather than in a subtree) — review it on ingest per `verifying-agnosticism`.
- **Docs-organization convention** (the *convention* is synced above): app/product docs live in `CC/.app-docs/{runbooks,visual-docs}/`; infra/environment docs in a root `.<area>-docs/{runbooks,visual-docs}/` (e.g. `.railway-docs/`); dev-process docs stay in `.docs/`+`.adr/`. The folder **CONTENTS are project data — NOT cross-repo synced** (like runbooks / autonomous-report-log); each repo grows its own.

## How

Use the `syncing-claude-codex` skill for `.claude/` <-> `.codex/` sync within a repo.
Use the `maintaining-trinary-sync` skill or manual copy for cross-repo sync.
