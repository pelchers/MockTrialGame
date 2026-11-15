---
name: promote-pr
description: Promote a contributor repo's completed feature to upstream — prepare an app-subtree patch, clone upstream fresh, branch off the dev branch, apply + typecheck, push a feature branch, and open a PR into the upstream dev branch. Upstream pushes happen ONLY on this explicit invocation. Never a direct push to dev/live; never merged by us.
invocable: true
---

# /promote-pr — open a feature-branch PR into the upstream dev branch

Runs the upstream **promotion** flow from the `contributor-conventions` skill, executed by the
`contributor-promotion-agent`. This is the **only** way we push to the upstream/production repo — and
**upstream pushes happen ONLY on this explicit invocation** (an explicit user request), never during
normal development.

`$ARGUMENTS` = `<feature>` and optionally `<base>` (e.g. `simple-affiliate-system website@dev`). If
`<base>` is omitted, use `upstream_base` from `repo.local.md`.

## Instructions for Claude

When `/promote-pr` is invoked:

1. **Gate check (STOP if any fails):**
   - Read `repo.local.md`. It must declare **`contributor`**. If `owner` → refuse (no upstream to
     promote to; normal push flow applies). If missing/ambiguous → treat as `contributor` but ask the
     user to `/declare-repo` first.
   - Confirm this invocation **is** the explicit user request to promote, and the feature is
     **PR-ready / complete**. If mid-flight, stop and say so.
2. **Resolve remotes** from `repo.local.md`: `working_remote`, `upstream_remote`, `upstream_base`
   (or the `<base>` in `$ARGUMENTS`), `upstream_live`, `app_subtree`.
3. **Patch:** prepare the additive changeset as an `<app_subtree>`-relative patch under
   `.docs/pr/<feature>/`. App-subtree paths only — root `.adr/` `.docs/` `.chat-history/` are excluded.
4. **Clone upstream fresh** into a scratch dir (never the working tree).
5. **Branch off current dev:** `git checkout <base>` then `git checkout -b <feature>@<handle>`.
6. **Apply + resolve:** `git apply --3way <patch>`; resolve conflicts by **unioning the additive edits**
   (keep both sides; never delete/reformat existing upstream code).
7. **Typecheck** via `turbo` (e.g. `turbo run typecheck`/`build`) — green before pushing.
8. **Push the feature branch** with the escape hatch:
   `CONTRIBUTOR_PUSH_OK=1 git push <upstream> <feature>@<handle>` (feature branch only — never
   `<base>` / `upstream_live`).
9. **Open the PR** from the feature branch **into `<base>`** via `gh pr create`, the GitHub API, or a
   surfaced compare URL. PR body points to the feature's integration guide.
10. **Report + stop.** Surface the PR/compare URL. **Do not merge** — a PR proposes; the maintainer
    merges. Never push straight to `<base>` / `upstream_live`.
11. **Hand the PR to the shepherd** — once the PR is open, register it for auto-watch + remediation:
    `/pr-watch add <#N> <feature>@<handle>` (skill `pr-shepherd`). From then on the PR Shepherd watches its
    CI + the maintainer's comments and auto-remediates each gating failure additively on the feature branch
    until it merges — so the user need not babysit the round-trips. Skip only if the user asks not to watch it.

## Notes

- Hand off to the `contributor-promotion-agent` for the autonomous run.
- The `contributor-push-guard.sh` hook blocks upstream pushes that lack `CONTRIBUTOR_PUSH_OK=1`; this
  command is the only sanctioned setter of that marker.
- Full protocol: `.docs/runbooks/development/contributor-conventions.md`. Declare a repo: `/declare-repo`.

$ARGUMENTS
