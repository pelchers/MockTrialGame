---
name: feature-review
description: Refresh or read the root FEATURE-REVIEW.md quick-review index — per feature, its state, the URLs and admin paths to review it at, the paths that carry it, and its PR with live CI/review state. Ship state comes from merged upstream PRs, never from ADR checkboxes.
invocable: true
---

# /feature-review — the one-page feature state + review index

Runs the `feature-review` convention (skill `feature-review`, agent `feature-review-agent`) against
the root **`FEATURE-REVIEW.md`**. That file is what a reviewer opens to find out what exists, where
to look at it, and what is still owed — without reading `.adr/`, `HANDOFF.md` and the PR list.

`$ARGUMENTS` selects the operation (default `refresh`):

- `/feature-review` or `/feature-review refresh` — re-derive every feature's state from the **merged
  PR list** (the authoritative signal), re-check the open PRs' CI and review state, verify every URL
  and path, update the affected sections **in place**, and append one dated Progress-log entry.
- `/feature-review status` — print the current index to chat. Read-only; changes nothing.
- `/feature-review check` — report drift only: PRs whose state moved, paths that no longer exist,
  features with code but no entry (or an entry with no code). Writes nothing.
- `/feature-review <feature>` — refresh just that feature's section, e.g.
  `/feature-review f12-programmatic-lifecycle-engine@luke` or just `f12`.

## Instructions for Claude

1. **Read `FEATURE-REVIEW.md` first.** Never regenerate it: the ⚠️ gap notes and the Progress log
   are hand-written and a rewrite would destroy them.
2. **Dispatch the `feature-review-agent`** for `refresh` and `check`. For `status`, just print the
   file — no agent needed.
3. **Relay only what moved.** A refresh that changed nothing is reported in one line, not a dump of
   the whole table.

## Guardrails

- Ship state is **merged PRs**, never ADR checkboxes — `f2`, `f3`, `f4`, `f6` and `f10` are all in
  production with zero ticked phases, so the checkboxes would report them as unstarted.
- A feature with code and no PR is **`BUILT — NOT SUBMITTED`** and reviewable **on local only**.
  Saying otherwise sends the user hunting on a deployment that does not have it.
- Report ADR-vs-code drift; never tick an ADR checkbox to make it agree.
- The file stays at the repo root and never moves under `CC/` (only `CC/` reaches the production
  repo).
- This command never opens, updates or merges a PR — that is `/promote-pr`.
- **The file must stay readable in a plain text editor.** Never inline a link in a table cell —
  define it at the bottom and cite the short form (`[#319]`). Keep every line under 100 characters,
  table cells to about 40, paths in fenced code blocks, and gaps in blockquotes. The first draft
  folded into unreadability with rows of 315, 339 and 446 characters. Full rules: the skill's
  **Layout contract**.

Auto-refreshed by the `feature-review-refresh.sh` SessionStart hook, which flags when the index
looks stale against the PR list. Full behaviour: the `feature-review` skill.
