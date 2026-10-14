---
name: feature-review
description: Maintain the root `FEATURE-REVIEW.md` quick-review index — the one page that says what state every feature is in, where to look at it (live / dev deploy / local URLs), which paths carry it, and which PR it rides. Use whenever a feature's state MOVES, both pre-PR (built locally, not submitted) and post-PR (opened, remediated, CI green, merged, closed): after finishing a feature or workstream, after opening or updating an upstream PR, after a CI or review outcome, and after a merge. Also use when the user asks where to review a feature, for a status readout across features, or for links to test something. Ship state is taken from MERGED PRs, never from ADR checkboxes (which are systematically stale). Append-or-update, never rewrite; the Progress log is append-only.
---

# Feature Review

The **single page a reviewer can open** to answer three questions without archaeology:

1. What state is each feature in?
2. Where do I look at it — which URL, which admin tab?
3. Which PR carries it, and what is that PR's state?

Lives at the repo root in **`FEATURE-REVIEW.md`**. Root level on purpose: it is the first thing a
reviewer (or a cold agent on another device) should find, and it describes the whole repo rather than
any one feature's planning folder.

> **This file is ours, not the product's.** Like `.adr/` and `.docs/`, it never travels to the
> production repo — only the `CC/` subtree does. Do not move it under `CC/`.

## The one rule that matters: ship state comes from merged PRs

**Never derive "is this done" from ADR checkboxes.** Measured on 2026-10-13: `f2`, `f3`, `f4`, `f6`
and `f10` all ship in production while their `primary_task_list.md` files show **zero** ticked
phases. The checkboxes record planning intent and are not maintained through a merge.

So:

- **Ship state** → `gh pr list --repo <upstream> --author "@me" --state all`. Merged ⇒ LIVE.
- **Pre-PR state** → the code exists and passes locally, and there is no PR. That is
  `BUILT — NOT SUBMITTED`, and it must say so plainly, because such a feature is reviewable **only
  on local** — it is on neither deployment.
- **ADR phase counts** may be shown, but only in a Planning column and only labelled as intent,
  with the staleness caveat attached.

If a feature's ADR and its merged code disagree, record the disagreement as a ⚠️ line rather than
silently picking one. `f14` is the live example: 114 shipped TypeScript files against a task list
reading 0 done / 173 open.

## Layout contract — the file must stay readable in a PLAIN TEXT editor

This is not cosmetic. The first draft of this index rendered as a wall of folded columns because
table cells carried inline links; three rows measured **315, 339 and 446 characters**. In anything
that does not render markdown tables — a terminal, a diff, a plain editor — that is unreadable, and
an unreadable index does not get used.

**Hard rules, all of them checkable:**

1. **Never inline a link inside a table cell.** Use a reference definition at the bottom of the
   file and cite the short form: `[#319]` in the cell, `[#319]: https://…` once at the end. An
   inline GitHub PR link is ~60 characters per cell; as a reference it is 5.
2. **Keep every line ≤ 100 characters**, table rows included. Verify:
   `awk '{print length}' FEATURE-REVIEW.md | sort -rn | head -3`
3. **Keep table cells short** — roughly 40 characters. A cell needing a sentence means the content
   belongs in the feature's prose, not the table.
4. **Four columns maximum** in the at-a-glance table, and two in a per-feature detail table (a
   borderless label/value pair, `| | |`).
5. **Paths go in a fenced code block, one per line** — never `·`-separated prose, which wraps badly
   and cannot be copied cleanly.
6. **Gaps go in a blockquote** (`> ⚠️ **…**`), never as a table cell or a buried bullet. A gap a
   reader skims past is the failure this file exists to prevent.
7. **Status is an emoji plus a word** (🟢 Live, 🟡 In review, 🔵 Built, 🟠 Partial, ⚪ Planned) so a
   state is scannable down the column. In the PR column, ✓ = merged, ↗ = open.
8. **One PR per at-a-glance row** — the newest meaningful one. The rest live in that feature's
   section.
9. **Verify before committing:** every used reference has a definition, and no table row exceeds
   120 characters:
   ```bash
   awk '/^\|/ && length>120 {c++} END {print (c+0)" wide rows"}' FEATURE-REVIEW.md
   for n in $(grep -oE "\[#[0-9]+\]" FEATURE-REVIEW.md | sort -u | tr -d '[]#'); do
     grep -q "^\[#$n\]: https" FEATURE-REVIEW.md || echo "MISSING DEF #$n"
   done
   ```

A refresh that lengthens rows past these limits has regressed the file, whatever else it got right.

## Status vocabulary

| Status | Means |
|---|---|
| `LIVE` | merged upstream; running in production |
| `IN REVIEW` | PR open; note its number, base, head sha and CI state |
| `BUILT — NOT SUBMITTED` | code exists, passes locally, no PR; local-only review |
| `PARTIAL` | some workstreams shipped, others parked — **name the parked part** |
| `PLANNED` | ADR scaffold only; nothing implemented |

`PARTIAL` and `PLANNED` are the two that get misread as progress. Be explicit: a planned feature has
*nothing* built, and a partial one must say which workstream is missing and where it is parked
(usually `.chat-history/cycle-back.md`).

## What every active-feature entry carries

- **PR** — number, link, base branch, head sha, CI state. All of it, not just the number.
- **Review at** — the exact URL or admin path. For `BUILT — NOT SUBMITTED`, say "local only" and
  why, so nobody hunts for it on a deployment.
- **Key paths** — the two or three directories that carry the feature, `CC/`-prefixed.
- **Runbook / decisions** — the operational doc and the ADR notes file, if they exist.
- **⚠️ Known gaps** — anything built-but-inert, untested, or contradicted by its own docs. A gap
  that exists and is unstated is the failure this file is meant to prevent.

## Behaviour rules

1. **Append-or-update, never rewrite.** Update a feature's section in place; never regenerate the
   whole file from scratch, which would drop hand-written gap notes. Add one **Progress log** entry
   per state change, newest first, dated.
2. **Verify before writing.** Every URL, path and PR number is checked: `gh pr view` for PR state,
   a filesystem check for paths. A link in a review index that 404s is worse than no link, because
   it is trusted.
3. **Refresh the header** — `Last refreshed`, device and lane — on every edit.
4. **Never invent a status.** If a feature's state cannot be determined, write
   `UNKNOWN — needs a check` and say what to run. Do not guess, and do not round "probably done"
   up to LIVE.
5. **No secrets, no tokens, no customer data.** URLs and paths only.
6. **Do not tick ADR checkboxes** as a side effect. Reconciling an ADR to its code is a separate,
   deliberate audit; this skill reports the drift and stops.

## Triggers

Refresh on any of these, without being asked:

- a feature or workstream is finished locally (⇒ `BUILT — NOT SUBMITTED`)
- an upstream PR is opened, force-pushed, or remediated (⇒ `IN REVIEW` + sha + CI)
- a CI run concludes, or a review arrives (⇒ update the CI/review note)
- a PR merges or closes (⇒ `LIVE`, or back to `BUILT — NOT SUBMITTED` with the reason)
- a gap is discovered or closed (⇒ add/remove the ⚠️ line)

And on request: `/feature-review` (see the command), or any ask like "where can I review X",
"status on the features", "give me links to test these".

## Companions

- `contributor-conventions` — owns PR promotion; this skill only *reports* PR state.
- `cycle-back` — owns parked threads; link to it rather than duplicating the detail.
- `device-sync-protocol` — `/winddown` should leave this file current, since the other device reads
  it cold.
