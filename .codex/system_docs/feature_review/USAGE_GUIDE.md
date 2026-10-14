# Feature Review — usage guide

## The short version

```bash
/feature-review            # refresh the index from the PR list + verify links (default)
/feature-review status     # print it; change nothing
/feature-review check      # report drift only; write nothing
/feature-review f12        # refresh one feature's section
```

The artifact is **`FEATURE-REVIEW.md`** at the repo root.

## When it refreshes without being asked

The skill treats these as triggers, so the index does not drift between deliberate refreshes:

| Event | Becomes |
|---|---|
| a feature or workstream finishes locally | `BUILT — NOT SUBMITTED` + "local only" review note |
| an upstream PR is opened / force-pushed / remediated | `IN REVIEW` + number, base, head sha, CI state |
| a CI run concludes, or a review arrives | the CI / review note is updated |
| a PR merges | `LIVE` |
| a PR closes unmerged | back to `BUILT — NOT SUBMITTED`, **with the reason** |
| a gap is found or closed | a ⚠️ line is added or removed |

## Reading a status correctly

- **`LIVE`** — merged; on `collectibleclassics.com`.
- **`IN REVIEW`** — PR open. Reviewable on **local** and, once the maintainer merges to the dev
  branch, on the dev deployment. Not on production.
- **`BUILT — NOT SUBMITTED`** — **local only.** No PR exists, so it is on neither deployment. If a
  link here points at a deployment, that is a bug in the index.
- **`PARTIAL`** — read which workstream is parked; the entry names it and points at
  `.chat-history/cycle-back.md`.
- **`PLANNED`** — nothing is built. An ADR scaffold is not progress.

## What the SessionStart hook tells you

It prints only when the index looks stale, and never edits anything:

```
[feature-review] FEATURE-REVIEW.md may be stale — refresh with /feature-review:
           - open PR(s) not in the index: #319
           - CC/ changed on 2026-10-12; index last refreshed 2026-09-01
```

The first reason needs `FEATURE_REVIEW_HOOK_NET=on` (off by default so a banner can never hang a
session on the GitHub API). The second works offline and compares the header date against the newest
commit touching `CC/`.

Env switches:

| Variable | Effect |
|---|---|
| `FEATURE_REVIEW_REFRESH=off` | silence the hook entirely |
| `FEATURE_REVIEW_HOOK_NET=on` | allow the hook to query `gh` for open PRs |

If the file is missing altogether the hook says so once, because a reviewer with no index is the
state this component exists to prevent.

## Keeping it honest

Four failure modes to watch for, each of which the skill forbids:

1. **Trusting ADR checkboxes.** They are stale by default. `f2`, `f3`, `f4`, `f6` and `f10` are in
   production with zero ticked phases. Ship state comes from merged PRs, full stop.
2. **Regenerating the file.** The ⚠️ gap notes and Progress log are hand-written. Update sections in
   place.
3. **Folding the tables.** An inline PR link is ~60 characters inside a cell; a row carrying four
   measured 446. Define links at the bottom, cite `[#319]`, keep lines under 100 characters. Check
   with:

   ```bash
   awk '/^\|/ && length>120 {c++} END {print (c+0)" wide rows"}' FEATURE-REVIEW.md
   ```

4. **Writing an unverified link.** Check PR numbers with `gh pr view` and paths against the
   filesystem first. A trusted index that 404s is worse than no index.

## Cross-device

`/winddown` should leave the index current, because `/pickup` on the other device reads it cold —
it is often the fastest way to re-enter context after a gap. The component (skill, agent, command,
hook, these docs) syncs to the other repos via `/sync-component`; the **`FEATURE-REVIEW.md` file
itself does not** — each repo has its own features.
