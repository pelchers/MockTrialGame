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
| HealthApps (umbrella) | `C:\App\HealthApps` | Health-app umbrella directory |
| LivBeyond | `C:\App\HealthApps\LivBeyond` | Health metrics demo (LivBeyond client work) |

## What to sync

- `sync-repos-*.md` device-local sync manifests, including `sync-repos-asus-laptop.md`
- `SYNC-REPOS.md` global/cross-machine sync manifest
- `device.local.example.md`
- `.claude/agents/<name>/AGENT.md`
- `.claude/skills/<name>/SKILL.md`
- `.claude/commands/<name>.md` when a component includes a slash command
- `.claude/hooks/scripts/<name>.sh` or `.ps1` when a component includes a hook
- `.claude/hooks/settings.json` when hook registration changes
- `.claude/system_docs/<name>/README.md`
- `.codex/agents/<name>/AGENT.md`
- `.codex/skills/<name>/SKILL.md`
- `.codex/commands/<name>.md` when a mirrored slash command exists
- `.codex/system_docs/<name>/README.md`
- `.docs/runbooks/**/<name>.md` (component runbooks — e.g. `device-sync-and-handoff-protocol.md`, `device-branch-convention.md`, `contributor-conventions.md`)
- `multi-device-and-agent-contract.md` (repo root) + its `.docs/runbooks/development/` duplicate — the cross-device/agent contract explainer
- `repo.local.md` (per-repo ownership + remotes declaration for `contributor-conventions`) + `repo.local.md.template` — `repo.local.md` is TRACKED per-repo; **do not overwrite a target's own checked ownership/remotes** (sibling policy to `device.local.md`)
- `.other-devices/components/<name>/**` (the portable package)
- Convention blocks in `CLAUDE.md`/`.claude/CLAUDE.md`/`.codex/CODEX.md`/`.codex/AGENTS.md` (+ relevant agent AGENT.md) — **appended idempotently, never wholesale-overwritten**. Managed blocks include: `device-sync-and-handoff`, `remote-push-safety`, `production-pr-on-request`, `production-safety-additive`, `dev-only-instance`, **`dev-server-persistence`**, **`docs-organization`**.
- **Docs-organization convention** (the *convention* is synced above): app/product docs live in `CC/.app-docs/{runbooks,visual-docs}/`; infra/environment docs in a root `.<area>-docs/{runbooks,visual-docs}/` (e.g. `.railway-docs/`); dev-process docs stay in `.docs/`+`.adr/`. The folder **CONTENTS are project data — NOT cross-repo synced** (like runbooks / autonomous-report-log); each repo grows its own.

## How

Use the `syncing-claude-codex` skill for `.claude/` <-> `.codex/` sync within a repo.
Use the `maintaining-trinary-sync` skill or manual copy for cross-repo sync.
