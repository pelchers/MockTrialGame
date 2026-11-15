# `.githooks/` — our tracked git hooks (syncable component)

Tracked, version-controlled git hooks that stamp our contributor attribution. This is our-side mirror
of the upstream **FahimCode** attribution convention (their `.githooks/prepare-commit-msg` appends
`Made-by: FahimCode`); ours appends **`Made-By: pelchers`**.

## Hooks
| Hook | What it does |
|------|--------------|
| `prepare-commit-msg` | **Strips** AI co-author / marketing trailers (`Co-Authored-By: Claude…`, `Generated with Claude Code`) **and appends** `Made-By: pelchers` (idempotent, fail-safe; skips merge/squash). |

## Install (per clone — required, one-time)
`core.hooksPath` is intentionally **NOT** repointed here: this repo already has an active
`.git/hooks/post-merge` (the branched-logs auto-merge) and setting `core.hooksPath .githooks` would
bypass it. Install by **copying** the hook so existing `.git/hooks/*` are preserved:

```bash
cp .githooks/prepare-commit-msg .git/hooks/prepare-commit-msg && chmod +x .git/hooks/prepare-commit-msg
```

Verify: `git commit --allow-empty -m "test"` → `git log -1 --format=%B` shows the `Made-By: pelchers` trailer.

## Cross-repo sync
This directory is a **reusable component** listed in `SYNC-REPOS.md` → propagate to every sync target,
then run the install copy-step in each clone. Do **not** blanket-set `core.hooksPath` in a target that
has its own `.git/hooks/*`.

## Attribution stripping (per user, 2026-08-17)
This hook **strips** AI co-author / marketing lines (`Co-Authored-By: Claude…`, `Generated with Claude Code`)
from **every local commit**, so CC-Local history carries only `Made-By: pelchers`. It's enforced by the hook —
even if a tool adds the line, the hook removes it before the commit is written. This also aligns with
**upstream promotion**, where AI co-author lines must be stripped anyway (see
`.docs/runbooks/development/pre-pr-checklist.md` §7). Fahim's repo owns its own `Made-by: FahimCode` convention.
