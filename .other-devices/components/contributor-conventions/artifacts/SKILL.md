---
name: contributor-conventions
description: How we work on repos where we are a CONTRIBUTOR (not sole owner). Applies ONLY when repo.local.md declares `contributor`. Dev day-to-day pushes go to our own CC-Local-style WORKING remote; the upstream/production repo is PR-only — HELD until an explicit user request AND the feature is PR-ready, then promoted via a feature-branch PR into the upstream DEV branch (never a direct push, never merged by us). Use when deciding where a push may go, when the user says "promote"/"push the PR"/"open the PR", when declaring a repo's ownership, or when a SessionStart banner reports a contributor repo.
---

# Contributor Conventions

The rules for working on a repo where **we are a contributor, not the sole owner**. It answers one
question every push must clear: *is this a repo we own outright, or one we only contribute to — and if
the latter, where is it safe to push right now?*

> **Scope gate — read FIRST.** This whole skill applies **ONLY when `repo.local.md` declares
> `contributor`.** On an **`owner`** (sole-dev) repo it is inert: the normal commit-and-push-as-you-work
> flow applies everywhere and none of the holds below fire. Companion to `device-sync-protocol`
> (which answers *which branch on this machine*); this answers *which relationship to this repo*.
> Full reference: `.docs/runbooks/development/contributor-conventions.md`.

## Ownership check (always step 0)

Read **`repo.local.md`** at the repo root (sibling to `device.local.md`):

- **Section 1 `owner` checked** → contributor-conventions do **NOT** apply. Commit + push freely to the
  repo's own remote(s), exactly as an owner would. Stop here.
- **Section 1 `contributor` checked** → the two-remote model below is in force. Continue.
- **Missing / ambiguous / neither box checked** → **treat as `contributor`** (fail-safe: the stricter
  hold) and tell the user to run `/declare-repo` to make it explicit. Never guess a permissive answer.

`repo.local.md` also carries the remotes the rest of this skill needs:
`working_remote` / `working_repo_id`, `upstream_remote` / `upstream_repo_id`, `upstream_base` (the PR
dev branch), `upstream_live` (maintainer-only prod branch), and `app_subtree` (the path that maps to
the upstream repo root, e.g. `CC/`).

## The two-remote model (contributor repos)

| Remote | Role | When we push |
|---|---|---|
| **Working remote** (`working_remote`) — our **CC-Local-style mirror** | DEFAULT push target. Same structure as this repo: root `.adr/` `.docs/` `.chat-history/` **+ the app subtree**. | **Commit + push as you work**, exactly like an owner repo. |
| **Upstream / production** (`upstream_remote`) | The live product repo. From our side it is **read-only** by default. | **HOLD all pushes** until (a) an explicit user request in that same message AND (b) the work is **PR-ready / feature-complete**. Then a **feature-branch PR into `upstream_base`** — never a direct push, never merged by us. |

### Every contributor repo gets a working-remote mirror
For **every** repo we contribute to, we create our **own same-structure working remote** (a
CC-Local-style mirror: root `.adr/` `.docs/` `.chat-history/` + the app subtree) and **write it into
`repo.local.md` as `working_remote` as soon as it exists.** That mirror — not the upstream — is the
default push target for all day-to-day work. We iterate and validate on the working remote first;
promotion to upstream happens only later, on explicit direction, once the work is deemed appropriate.

### What may go upstream
Only the **app subtree** (`app_subtree`, e.g. `CC/`) is upstream-relevant. The root
`.adr/` `.docs/` `.chat-history/` (and everything else outside the app subtree) is **ours** and
**never** goes upstream. Everything that does land upstream stays **strictly additive / non-breaking**.

## Upstream promotion flow (proven mechanics)

Runs **ONLY** on an explicit user request (e.g. "push the PR now") AND when the feature is complete.
Executed by `/promote-pr` or the `contributor-promotion-agent`:

1. **Patch:** prepare the additive changeset as an **`<app_subtree>`-relative patch** (see
   `.docs/pr/<feature>/`). Only app-subtree paths; root `.adr/` `.docs/` `.chat-history/` are excluded.
2. **Clone upstream fresh:** clone `upstream_remote` into a scratch dir (never reuse the working tree).
3. **Branch off current dev:** check out `upstream_base` (the current dev branch), then
   `git checkout -b <feature>@<handle>` off it.
4. **Apply:** `git apply --3way <patch>` → **resolve conflicts by UNIONing the additive edits** (keep
   both sides; never delete or reformat existing upstream code).
5. **Typecheck:** run the repo's typecheck via `turbo` (e.g. `turbo run typecheck`/`build`) — green
   before pushing.
6. **Push the feature branch:** `git push <upstream> <feature>@<handle>` (a feature branch only —
   never `upstream_base` / `upstream_live`).
7. **Open a PR** from that feature branch **into `upstream_base`** (via `gh pr create`, the GitHub API,
   or a surfaced compare URL). The PR **body points to the feature's integration guide**.
8. **Stop.** A PR **proposes**; the **maintainer merges**. We never merge into `upstream_base` /
   `upstream_live` ourselves, and never push straight to either.

## Hooks (assurance layer — orchestrator-owned scripts)

Two hooks back this skill (scripts built + registered + tested by the orchestrator; see
`.codex/system_docs/contributor_conventions/HOOKS-TODO.md`):

- **`contributor-repo-check.sh`** (SessionStart) — reads `repo.local.md`; on `contributor` prints a
  banner naming the working remote as the default push target and reminding that upstream is PR-only
  into `upstream_base` via `/promote-pr`.
- **`contributor-push-guard.sh`** (PreToolUse on Bash/PowerShell) — **fail-open** guard that blocks a
  `git push` **only** when the repo is `contributor` AND the target is the upstream remote (or a remote
  named `upstream`/`prod`/`production`) AND the escape-hatch marker is absent. Any uncertainty → allow.
  Working-remote pushes are never touched.

### Escape hatch
A deliberately-authorized upstream push (i.e. the promotion flow, on explicit user go) sets the marker
**`CONTRIBUTOR_PUSH_OK=1`** in the command environment. The push-guard allows any `git push` carrying
`CONTRIBUTOR_PUSH_OK=1`; without it, an upstream-targeted push is blocked. Only `/promote-pr` /
`contributor-promotion-agent` set it, and only on an explicit request.

## Guardrails

- **Default remote is always the working remote.** Never push to upstream during normal development.
- **Upstream = user-request-only.** No upstream push without an explicit request in that same message
  AND a PR-ready feature. Absent that, upstream is read-only.
- **Never a direct push to `upstream_base` / `upstream_live`; never merge upstream ourselves** — always
  a feature-branch PR that the maintainer merges.
- **Additive / non-breaking upstream** — only the app subtree, unioned into existing code, no
  destructive edits.
- **`owner` repos are exempt** — this skill is inert there; commit + push everywhere as normal.
- **Fail-safe on an unclear `repo.local.md`** — treat as `contributor` and ask the user to
  `/declare-repo`.

## Related

- Commands: `/promote-pr` (run the promotion), `/declare-repo` (create/update `repo.local.md`).
- Agent: `contributor-promotion-agent` (executes the promotion on explicit go).
- Hooks: `contributor-repo-check.sh` (SessionStart), `contributor-push-guard.sh` (PreToolUse).
- Declaration file: `repo.local.md` (repo root; sibling to `device.local.md`).
- Runbook: `.docs/runbooks/development/contributor-conventions.md`.
- Portable package: `.other-devices/components/contributor-conventions/`.
