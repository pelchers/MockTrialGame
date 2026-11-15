---
name: declare-repo
description: Create or update repo.local.md — declare whether we OWN this repo or only CONTRIBUTE to it, and record the working remote + upstream/production remotes. Read by contributor-conventions (SessionStart banner + pre-push guard) to know where it is safe to push.
invocable: true
---

# /declare-repo — declare this repo's ownership + remotes

Creates or updates **`repo.local.md`** at the repo root (sibling to `device.local.md`) so agents know
our relationship to this repo and where it is safe to push. Uses the `contributor-conventions` skill.

`$ARGUMENTS` = the ownership + remotes to record, e.g.:
`contributor working=https://github.com/pelchers/CC-Local.git upstream=https://github.com/fmchisti/collectibleclassics.git base=website@dev live=website@live subtree=CC/`
or simply `owner` for a sole-dev repo.

## Instructions for Claude

When `/declare-repo` is invoked:

1. **Parse `$ARGUMENTS`** for the ownership word (`owner` | `contributor`) and any of
   `working=` (→ `working_remote` + derive `working_repo_id`), `upstream=` (→ `upstream_remote` +
   derive `upstream_repo_id`), `base=` (→ `upstream_base`), `live=` (→ `upstream_live`),
   `subtree=` (→ `app_subtree`). Anything not supplied → leave as a placeholder / carry over the
   existing value if `repo.local.md` already exists.
2. **Write `repo.local.md`** using the template shape below:
   - Section 1 checks **exactly one** of `owner` / `contributor` per the parsed ownership.
   - Section 2 records the working remote (our CC-Local-style mirror; the DEFAULT push target).
   - Section 3 records the upstream/production remotes + `upstream_base` / `upstream_live` /
     `app_subtree`.
   - If updating an existing file, preserve unspecified fields; never blow away a filled-in remote.
3. **Keep it tracked + committed** (sibling to `device.local.md`; no-ignore policy). Do not gitignore it.
4. **Report** the resulting ownership + remotes, and remind:
   - `owner` → contributor-conventions are inert; commit + push everywhere as normal.
   - `contributor` → default push = `working_remote`; upstream is PR-only into `upstream_base` via
     `/promote-pr`.

## repo.local.md template

```
# THIS REPO — ownership + remotes declaration
# Declares our relationship to THIS repo + its remotes so agents know where it is safe to push.
# Read by contributor-conventions (SessionStart banner + pre-push guard). Sibling to device.local.md
# (which answers "which device"); this answers "what is our relationship to this repo?". Tracked + committed.

## 1. Ownership (check exactly ONE)
- [ ] owner        # sole dev/owner — contributor-conventions do NOT apply; normal commit+push everywhere
- [ ] contributor  # contributor — upstream is PR-only; dev on the working remote

## 2. Working remote (our CC-Local-style mirror — DEFAULT push target; write in as soon as it exists)
working_remote = <working_remote>
working_repo_id = <owner/repo>

## 3. Upstream / production repo (HOLD pushes until user-request + PR-ready + feature-complete)
upstream_remote = <upstream_remote>
upstream_repo_id = <owner/repo>
upstream_base    = <upstream_base>        # PR base (dev) branch — NEVER push straight here
upstream_live    = <upstream_live>        # production branch — maintainer-only
app_subtree      = <app_subtree>          # path that maps to the upstream repo root
```

## Notes

- On an unclear/missing `repo.local.md`, contributor-conventions fail-safe to `contributor` (the
  stricter hold). Run this command to make ownership explicit.
- Full protocol: `.docs/runbooks/development/contributor-conventions.md`. Promote later: `/promote-pr`.

$ARGUMENTS
