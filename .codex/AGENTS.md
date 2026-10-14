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
