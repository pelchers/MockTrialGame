# Feature Review — component README

**Purpose.** Keep one page at the repo root — **`FEATURE-REVIEW.md`** — that answers "what state is
each feature in, where do I look at it, and which PR carries it?", refreshed whenever a feature's
state moves, both **pre-PR** and **post-PR**.

## Problem it solves

Answering "can I review feature X, and where?" previously meant reading `.adr/orchestration/<f>/`,
the newest `HANDOFF.md` entry, `.chat-history/pr-watch-log.md` and the upstream PR list, then
reconciling them. Three things made that unreliable:

1. **ADR checkboxes are not a completion signal.** Measured 2026-10-13: `f2`, `f3`, `f4`, `f6` and
   `f10` all ship in production while their `primary_task_list.md` files show **zero** ticked
   phases. Anyone trusting the ADR would conclude five live features were never started.
2. **Built-but-unsubmitted work is invisible.** A feature with code and no PR is on neither
   deployment, so a reviewer sent to a URL finds nothing and concludes it is broken rather than
   unmerged.
3. **Gaps live in people's heads.** "f12's click-id capture is inert", "f13's mobile walk was never
   done" — real, decision-changing, and nowhere a reviewer would look.

## Pieces

| Piece | Path | Role |
|-------|------|------|
| Skill | `.claude/skills/feature-review/SKILL.md` | When to refresh; the merged-PR rule; status vocabulary; what each entry must carry |
| Agent | `.claude/agents/feature-review-agent/AGENT.md` | Executor: derives state from PRs, verifies links/paths, updates in place, appends the log |
| Command | `.claude/commands/feature-review.md` | `/feature-review refresh\|status\|check\|<feature>` (`$ARGUMENTS`) |
| Hook | `.claude/hooks/scripts/feature-review-refresh.sh` | SessionStart staleness banner; never edits the file |
| Index | `FEATURE-REVIEW.md` | **Repo root.** The artifact itself — ours, never shipped to the product repo |

## Design invariants

- **Ship state = merged PRs.** The only authoritative signal. ADR phase counts may be displayed but
  only as planning intent, with the staleness caveat attached. The component **never** ticks an ADR
  checkbox — reconciling an ADR to its code is a separate, deliberate audit.
- **Append-or-update, never rewrite.** Sections are edited in place and the Progress log is
  append-only, because the ⚠️ gap notes are hand-written knowledge a regeneration would destroy.
- **Every link is verified before it is written.** A dead link in an index a reviewer trusts is
  worse than no link.
- **`BUILT — NOT SUBMITTED` must say "local only".** Getting this wrong sends someone hunting on a
  deployment that does not have the feature — the single most misleading error available here.
- **`UNKNOWN — needs a check` is a valid status.** Never guess, and never round "probably done" up
  to LIVE.
- **Root level, never under `CC/`.** Only the `CC/` subtree reaches the production repo; this file
  is ours, like `.adr/` and `.docs/`.
- **The hook is read-only and network-optional.** `gh` is called only when
  `FEATURE_REVIEW_HOOK_NET=on`, so a SessionStart banner can never hang a session on a slow or
  rate-limited API. Silent when the index looks current. Disable with `FEATURE_REVIEW_REFRESH=off`.
- **Readable as plain text, not only as rendered markdown.** No inline links in table cells (use
  reference definitions at the bottom), every line under 100 characters, cells about 40, paths in
  fenced code blocks, gaps in blockquotes, status as emoji + word. The first draft shipped rows of
  315, 339 and 446 characters because cells carried inline PR links — unreadable in a terminal or a
  diff, and an unreadable index does not get used. The skill's **Layout contract** has the checks.
- **No secrets, tokens or customer data** — URLs and paths only.

## Relationship to neighbouring components

- `contributor-conventions` / `/promote-pr` own PR promotion. This component only **reports** PR
  state and must never open, update or merge a PR.
- `cycle-back` owns parked threads. Feature Review **links** to a parked item rather than
  duplicating its detail.
- `device-sync-protocol` — `/winddown` should leave this index current, since the other device
  reads it cold at `/pickup`.
- `feature-user-docs` builds a per-feature *reading map*; this is the cross-feature *state index*.
  Different questions: "what should I read inside f12" vs "what state is everything in".
