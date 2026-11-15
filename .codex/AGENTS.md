# Codex setup for this repo

This repository uses Codex repo-scoped skills and agents. Place skills in `./.codex/skills/<skill-name>/SKILL.md` and agents in `./.codex/agents/<agent-name>/AGENT.md` so they travel with the repo.

## Skill format (Codex)

- Each skill is a folder with a required `SKILL.md`.
- `SKILL.md` uses YAML front matter with `name` and `description`, plus optional Markdown instructions in the body.
- Optional folders: `scripts/`, `references/`, `assets/`.

## How to create or install skills

- Use `$skill-creator` inside Codex to scaffold a new skill.
- Use `$skill-installer` to install curated skills if needed.

## Reference source for corollary skills

Use the Claude workspace at `<PROJECT_ROOT>/.claude` as a reference for creating corollary Codex skills. Port concepts from that folder into Codex-style skills here (one folder per skill with `SKILL.md` plus optional `scripts/`, `references/`, `assets/`), adapting content to Codex conventions rather than copying wholesale.


<!-- BEGIN device-sync-and-handoff convention (managed; append idempotently — do not duplicate) -->
## Device Sync & Handoff Convention (Required)
- **Multi-device repo** (home-desktop ⇄ asus-laptop). BOTH devices commit to their own **working lane**
  (`Home-Work` / `Asus-Work`, resolved from `device.local.md`). **`main` = handoff + savepoint + stable +
  deployment/prod** — NOT a daily lane; it is synced to your working lane only at wind-down.
- **START of work → `/pickup`** (skill `device-sync-protocol`): `git fetch` all lanes, determine the
  most-forward-*appropriate* state (ADR/planning/`HANDOFF.md`-informed, not raw commit count), adopt it
  into your working branch (`--ff-only` / `pull --rebase`; STOP + ask if lanes truly diverged — never
  force-push, never discard a lane), then read the newest `HANDOFF.md` entry + status board before working.
  The SessionStart banner flags when a device/`main` is ahead.
- **END of work → `/winddown`**: commit to your lane → prepend a `HANDOFF.md` entry (append-only,
  per-device) → update chat-history + status board → `git push origin <Device>-Work` then
  `git push origin <Device>-Work:main` (fast-forward only) → optional `/savepoint` at a milestone.
- Full protocol: `.docs/runbooks/development/device-sync-and-handoff-protocol.md`. Log: `HANDOFF.md`.
<!-- END device-sync-and-handoff convention -->


<!-- BEGIN feature-review convention (managed; append idempotently — do not duplicate) -->
## Feature Review — one page saying what exists and where to review it (Required)
- Keep the repo-root **`FEATURE-REVIEW.md`** current: per feature, its **state**, the **URL / admin
  path to review it at**, the **paths** that carry it, and its **PR** with that PR's live CI/review
  state. Maintained by **`/feature-review`** (skill `feature-review`, agent `feature-review-agent`).
  Refresh whenever a feature's state MOVES — **pre-PR** (built locally ⇒ `BUILT — NOT SUBMITTED`)
  and **post-PR** (opened / remediated / CI / merged / closed) — not only when asked.
- **Ship state comes from MERGED upstream PRs, never from ADR checkboxes.** Measured 2026-10-13:
  `f2`, `f3`, `f4`, `f6` and `f10` all ship in production while their `primary_task_list.md` files
  show **zero** ticked phases. Report ADR-vs-code drift as a ⚠️ line; **never tick a checkbox** to
  make them agree (that fabricates a completion claim — reconciling an ADR is a separate audit).
- **`BUILT — NOT SUBMITTED` means local-only review.** Such a feature is on neither deployment, so
  the entry must say so; pointing a reviewer at a deployment that lacks it is the worst error this
  index can make. **`UNKNOWN — needs a check`** is a valid status — never guess, never round
  "probably done" up to LIVE.
- **Append-or-update, never rewrite** (the ⚠️ gap notes and the Progress log are hand-written), and
  **verify every link and path before writing it** — a dead link in a trusted index is worse than
  no link. The file stays at the **repo root**, never under `CC/` (only `CC/` reaches the product
  repo). No secrets or customer data: URLs and paths only.
- **Keep it readable as PLAIN TEXT.** Never inline a link in a table cell — define it at the
  bottom and cite the short form (`[#319]`); keep lines under 100 chars, cells ~40, paths in fenced
  code blocks, gaps in blockquotes, status as emoji + word. The first draft folded into
  unreadability (rows of 315/339/446 chars) because cells carried inline PR links.
- A SessionStart hook (`feature-review-refresh.sh`) flags staleness and never edits the file.
  `/winddown` should leave the index current — the other device reads it cold at `/pickup`.
<!-- END feature-review convention -->

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

<!-- BEGIN docs-organization convention (managed; append idempotently — do not duplicate) -->
## Docs Organization — App vs Infra, runbooks + visual-docs (Required)
- **App/product docs** live under the product subtree in **`<app>/.app-docs/`** (the app subtree, once one exists)
  with two subfolders: **`runbooks/`** (in-code markdown operational docs) and **`visual-docs/`**
  (self-contained rendered **HTML** visual documentation — the browsable "visual render", like the aggregate
  dev-docs site). Product-relevant; travels in the product subtree.
- **Infrastructure/environment docs** (e.g. the Railway + Supabase dev-clone) live at the **repo root** in a
  dedicated **`.<area>-docs/`** folder — this repo: **`.railway-docs/`** — with the SAME two subfolders:
  **`runbooks/`** + **`visual-docs/`**. Root-level infra docs are OURS (never shipped to the product repo).
- **Repo/dev-process docs** (ADR planning, device-sync, contributor conventions) stay in root **`.docs/`** + **`.adr/`**.
- New runbooks/visual-docs follow this layout; app runbooks go in `<app>/.app-docs/runbooks/`.
<!-- END docs-organization convention -->

<!-- BEGIN dev-server-persistence convention (managed; append idempotently, do not duplicate) -->
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

<!-- BEGIN env-vault convention -->
## Env Vault — committed env values for cross-device work (Required, CONDITIONAL)

**Precondition, checked before adopting this in any repo:** the remote this would be committed to
must be **PRIVATE and single-owner**. Verify it (`gh repo view <owner>/<repo> --json visibility`),
do not assume it. On a public repo, a repo with collaborators, or a fork, **this convention does
not apply** — keep env files gitignored there. Committing a secret is permanent: git history keeps
it after deletion, so rotation is the only undo.

Where the precondition holds:

- **Env values ARE committed, on purpose.** Multi-device work pays a real, recurring cost
  re-obtaining them per device, and some values sit behind an external admin request wall. The
  canonical copies live in a repo-root **`.envs/`** vault, git-tracked via an explicit `.gitignore`
  allow-list.
- **The safety property is LOCATION, not secrecy.** If the repo contains a subtree that is patched
  or published elsewhere (a vendored product clone, a submodule, a publish directory), an env file
  tracked *inside* that subtree can escape to somewhere far more exposed than a private remote.
  So: **env files inside a publishable subtree stay gitignored forever** and are only ever *written*
  there by the sync script. Only root-level vault files are tracked.
- **Edit the vault file, never the live file.** `.envs/manifest.tsv` maps each vault file to its
  destination path, one `<vault-file>TAB<destination>` per line.
- **Commands** (`scripts/env-sync.ps1`): no flags = **hydrate** (vault → live; the new-device case,
  backing up any differing live file to `.bak-<stamp>` rather than clobbering it); **`-Capture`** =
  live → vault after editing a live file; **`-Check`** = report drift, change nothing.
  On a fresh clone: `bash scripts/install-git-hooks.sh` once, then hydrate.
- **Enforced, not merely documented.** `scripts/env-location-guard.sh` runs as a **pre-commit hook**
  and rejects any staged env file inside the publishable subtree (`.env.example` excepted). The only
  way to stage one is `git add -f`, and the hook blocks the commit that follows.
- **Out of scope for the vault:** production/live credentials. Dev-clone values, local placeholders
  and read-only service credentials are the intended contents.
- **The vault's CONTENTS never sync between repos** — only the mechanism does. Each repo keeps its
  own `.envs/`, and `.envs/` is absent from every cross-repo sync list by design.
<!-- END env-vault convention -->

<!-- BEGIN plain-speech convention (managed; append idempotently, do not duplicate) -->
## Explain Like A Person, Not Like A Report (Required)

> # ⛔ READ THIS BEFORE WRITING ANY REPLY ⛔
>
> ## Plain speech is a HARD gate on every reply, report, ADR and commit message.
>
> **Component:** skill `plain-speech-convention` · agent `plain-speech-agent` · command
> `/plain-speech` · docs `.codex/system_docs/plain_speech/`
>
> **The catalogue already exists. Do not write a second one:**
> `.adr/orchestration/f3-ai-articles-seo@luke/08_tone-and-anti-ai-speak/ai-speak-convention-reference.md`
> 129 lines, zero tolerance, backed by `AI_SPEAK_WORDS` / `AI_SPEAK_PHRASES` /
> `AI_SPEAK_PATTERNS` and `scanAiSpeak`. Written for articles. **It applies to chat in full.**
>
> **The one-second check before sending: search the draft for an em dash. If it is there, the draft
> was never edited.**
>
> The operator has stopped work twice to say the output reads as machine-written. Treat a third time
> as a process failure, not a style note.

Standing instruction, 2026-10-20: "you speak like ai. i need things explained humanly", then
"still sounds like ai... nobody sis this was here 'the whole time'", then "we already well
documented ai patterns by the way in several files in this repo".

**Formalised as a component** (component-creation-pipeline): skill `plain-speech-convention`, agent
`plain-speech-agent`, command `/plain-speech`, system docs `.codex/system_docs/plain_speech/`,
mirrored to `.codex/`, registered in `SYNC-REPOS.md`.

### Two layers

**Mechanical, always wrong.** Em dash, en dash, curly quotes, unicode arrows, ellipsis character,
non-breaking space. `normalizeProse` strips these in the article pipeline for the same reason.

**Shape, needs judgement.** Eight reply-shaped tells the prose scanner cannot see, with examples in
`.claude/skills/plain-speech-convention/references/chat-tells.md`:

1. **The delayed reveal.** "It was there the whole time", "that is why X happened". Fact first.
2. **Fragment as drumroll.** "Found it." "Conclusive." Write the sentence.
3. **Bolding the punchline every paragraph.** One per section, a number or name only.
4. **A table for two facts.** Tables start earning their place around five rows.
5. **Counting findings into a pattern.** "Three bugs, all the same shape".
6. **The closing aphorism.** End when the information ends.
7. **Narrating the investigation.** "Chasing that, I found". Report what is true now.
8. **Headers on a four-paragraph answer.**

### How to write it instead

Lead with the plain answer in an ordinary sentence. Give the cause in sentences that connect. Say
what it means for the reader and what is left to do. Keep numbers inline. Prefer the shortest true
sentence, and cut any clause that only adds drama. Ask whether you would say it out loud to a
colleague standing at your desk.

### What must not be lost

Plain-spoken is not vague. `file:line` references, exact figures, blunt "I was wrong about X"
corrections, what was and was not verified, open items and their owners all survive the edit. A
reply that reads well and drops a number has failed this convention, not satisfied it.
<!-- END plain-speech convention -->

<!-- BEGIN cycle-back convention (managed; append idempotently, do not duplicate) -->
## Cycle-Back — never lose a deliberately-parked topic (Required)
- When a thread is **deferred rather than finished** — the user says "circle back / come back to this
  later / park this", OR you decide to defer (e.g. "give the admin time, work on X meanwhile") — record it
  with **`/cycle-back add`** (skill `cycle-back`, agent `cycle-back-agent`). It writes a **resume-complete**
  entry to the project-local **`.chat-history/cycle-back.md`**: where-in-chat pointer, why parked, resume
  trigger, exact state to rehydrate, next action.
- **Why:** long sessions get **compacted** and open threads can silently drop. A SessionStart hook
  (`cycle-back-surface.sh`) re-surfaces OPEN/BLOCKED items every session, so parked threads re-enter context
  even after compaction. Enforce the **cold-resume test** (a zero-memory reader could continue) on every
  entry — real shas/URLs/paths + decisions already made, no "see above".
- **Non-destructive:** `/cycle-back resolve` marks `RESOLVED ✓` (never deletes); `/cycle-back list` shows
  open threads; `/cycle-back check` tests whether a resume-trigger is now met. The **log is project-local
  (never synced)**; only the component syncs. Full protocol: `.docs/runbooks/development/cycle-back.md`.
<!-- END cycle-back convention -->
