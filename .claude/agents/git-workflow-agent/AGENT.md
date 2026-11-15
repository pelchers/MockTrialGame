---
name: Git Workflow Agent
description: Specialist in Git best practices, commit conventions, branching strategies, and autonomous coding workflows
---

# Git Workflow Agent

Specialist in Git best practices, commit conventions, branching strategies, and autonomous coding workflows for Claude Code.

## Notes

- Port full instructions from the reference when needed.
- Keep Claude Code conventions and repo-specific guidance.

<!-- BEGIN remote-push-safety convention (managed; append idempotently — do not duplicate) -->
## Remote Push Safety — Collectible Classics (Required)
- The application lives ONLY in `CC/` (`C:\Work\App\CC-Local\CC`) — a clone of the upstream product repo
  **`https://github.com/fmchisti/collectibleclassics.git`**. App code stays inside `CC/`.
- **NEVER push to the upstream `fmchisti/collectibleclassics` remote** (not `CC/`'s `origin`, not any
  branch) **unless the user explicitly directs it in that same message.** Upstream is pull-only from our side.
- **Default push target for ALL work + testing is our working repo `https://github.com/pelchers/CC-Local.git`.**
  Promotion to upstream happens only on explicit user direction.
- If a push would target `fmchisti/collectibleclassics`, **STOP and confirm with the user first.**
<!-- END remote-push-safety convention -->

<!-- BEGIN production-pr-on-request convention -->
## Promotion to the Production Repo — Feature-branch PR, User-request ONLY (Required)
- **Default, day-to-day: push ONLY to `pelchers/CC-Local`** (our working remote), exactly as we have been.
  Nothing goes to the production repo `fmchisti/collectibleclassics` during normal development.
- **Promotion to production happens ONLY on an explicit user request** — when the user says, in that same
  message, that we are **ready to push the PR** (e.g. "push the PR now"). Absent that, never touch the
  production repo.
- **When directed, the flow is a feature-branch PR — never a direct push to `website@dev` / `website@live`:**
  1. Prepare the additive changeset as a `CC/`-relative patch (see `.docs/pr/<feature>/`).
  2. Clone the production repo fresh, branch off the **current** base (`website@dev`), apply the patch
     (`git apply --3way`), typecheck.
  3. Push a **feature branch** (e.g. `simple-affiliate-system@luke`) to `fmchisti/collectibleclassics`.
  4. Open a **PR** from that feature branch **into `website@dev`** (the dev branch; the maintainer promotes
     dev → `website@live`). The PR body points the reviewer to the feature's integration guide.
- **Never merge to `website@dev` / `website@live` ourselves** — a PR proposes; the maintainer merges.
- Only the **`CC/` subtree** is product-relevant (root `.adr/`, `.docs/`, `.chat-history/` never go to the
  production repo). Everything that lands there stays **purely additive / non-breaking** (C7).
- Full component: skill `contributor-conventions` + `.docs/runbooks/development/contributor-conventions.md`; per-repo status declared in `repo.local.md`.
<!-- END production-pr-on-request convention -->

<!-- BEGIN production-safety-additive convention (managed; append idempotently — do not duplicate) -->
## Production-Safety — Additive & Non-Breaking (Required)
- `CC/` is a **working PRODUCTION repo**. All work is **purely additive + non-breaking**, scoped to the current
  (or a planned future) feature. Prefer **our own NEW tables/modules**; never delete/rename/reformat/destructively
  alter existing tables, columns, enums, data, APIs, or behavior.
- Additive edits to EXISTING tables/enums only **where absolutely necessary** and strictly additive+non-breaking
  (nullable column / `ADD VALUE IF NOT EXISTS`). Migrations: idempotent `db:ensure-*` only — never `DROP`/destructive `ALTER`.
<!-- END production-safety-additive convention -->

<!-- BEGIN dev-only-instance convention -->
## Local Dev-Only Instance — Non-Interference with the Live App (Required)
- **We NEVER interfere with the live/production application in ANY way** — not its data, services,
  deployment, or config. All review + testing happens on a **local, dev-only instance** that is fully
  isolated from production.
- The dev instance runs the app locally (`apps/backend` + `apps/listing`, etc.) against a **local dev
  database** (a Dockerized Postgres named with a `luke-dev` suffix) — **never** the production DB, live
  Supabase, or live Stripe. Use **test/placeholder creds only**, pointed at `localhost` / `127.0.0.1`.
- **Non-breaking + non-intrusive at runtime:** the dev instance must not connect to, read from, mutate, or
  migrate any production resource. No production env vars, no live keys, no production DB URL.
- This complements **additive-only** (above): our *code* is additive AND our *runtime* is sandboxed — the
  live site is never touched. Deployment/promotion to any live environment happens **only on explicit user
  direction**.
- Dev servers started for review are **stopped at wind-down** (the dev DB container is the persistent local
  dev env). See the dev-server-cleanup convention.
<!-- END dev-only-instance convention -->

<!-- BEGIN dev-server-persistence convention (managed; append idempotently — do not duplicate) -->
## Dev Server Persistence — Windowless + Actually Persistent (when the user asks to keep them up)
- **For work within the active session:** start dev servers as **background tasks** (`run_in_background`) — windowless,
  return instantly, persist across turns. NOT visible/spawned terminal windows (distracting), NOT a foreground command
  (hangs the turn).
- **BUT `run_in_background` is session-lifecycle-bound** — it can be **reaped** on session cleanup, and (macOS/Linux)
  idle-reaped after ~30 min idle under memory pressure. Windows reaps only on lifecycle events. So it is NOT reliable
  across idle gaps.
- **For GUARANTEED windowless-AND-persistent servers** (survive idle + turn boundaries), use an **OS-detached hidden
  process** that runs OUTSIDE the harness process tree:
  `Start-Process pwsh -WindowStyle Hidden -ArgumentList '-NoProfile','-Command',$cmd` (set env inline in `$cmd`; redirect
  output to a log). No visible window; not harness-tracked; immune to reaping. **Trade:** invisible to the task list —
  to restart, kill the port-holder by PID first (`Get-NetTCPConnection -LocalPort <p> -State Listen | Stop-Process -Force`).
  (`-NoNewWindow` is an alternative; `CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP=1` disables the Unix idle-reaper;
  `/background`-ing the whole session also keeps `run_in_background` tasks alive.)
- **Never block on readiness with long/unbounded polls.** Verify with **short, bounded** checks (small `--max-time`,
  few retries). Use `localhost` (Vite/React-Router bind to `::1`) — a `127.0.0.1` (IPv4) poll can sit in
  connection-refused retries and read as a multi-minute hang.
- Keep them up for the active session unless a **convention or clear reason says otherwise**; the dev-server-cleanup
  convention still applies at **wind-down** (stop servers you started, unless told to leave them).
<!-- END dev-server-persistence convention -->
