# NOTES — `contributor-conventions` (development context)

## Problem it solves
On a repo we **own**, "commit + push as you work" is always safe. On a repo we only **contribute** to,
that same reflex is dangerous — an accidental push to the live product repo (or straight to its dev/live
branch) is exactly the kind of mistake that must be impossible to make by habit. This component keeps
the fast owner-style flow where it is safe (our own **CC-Local-style working remote**) and makes an
upstream push a **deliberate, gated, PR-shaped** act that happens **only on explicit request**.

It generalizes the repo-specific `production-pr-on-request` house rule (built for Collectible Classics)
into a **reusable, per-repo-declared** component: any contributor repo declares itself in
`repo.local.md`, and the same skill/agent/commands/hooks apply.

## Key design decisions
- **Per-repo declaration in `repo.local.md`.** A tracked root file, sibling to `device.local.md`.
  Section 1 is a one-of-two checkbox (`owner` / `contributor`); Sections 2–3 record the working +
  upstream remotes, the PR base (dev) branch, the live (prod) branch, and the app subtree. `device.local.md`
  answers *which device*; `repo.local.md` answers *what our relationship to this repo is*.
- **Applies ONLY to `contributor` repos.** On `owner`, the whole component is inert — normal
  commit-and-push everywhere. This keeps sole-dev repos completely unaffected.
- **Two-remote model.** Default push = the working remote (a CC-Local-style mirror: root
  `.adr/` `.docs/` `.chat-history/` + the app subtree). Upstream = PR-only into the dev branch.
- **Every contributor repo gets its own working-remote mirror**, written into `repo.local.md` as
  `working_remote` as soon as it exists. We validate there first; upstream comes later.
- **Only the app subtree goes upstream.** Root `.adr/` `.docs/` `.chat-history/` never leave the working
  remote. Everything upstream stays additive / non-breaking.
- **Promotion is a one-way gated valve:** patch → fresh clone → branch off current dev → `git apply
  --3way` (union additive conflicts) → typecheck via `turbo` → push a **feature branch** → open a **PR**
  into the dev branch. We never merge upstream; the maintainer merges.
- **Escape hatch `CONTRIBUTOR_PUSH_OK=1`** marks a deliberately-authorized upstream push. Only
  `/promote-pr` / `contributor-promotion-agent` set it.
- **Layered assurance:** declaration file → SessionStart banner → fail-open pre-push guard → skill →
  governance line. No single mechanism is the gate; each layer narrows the path and fails safe.

## Why the two hooks are ORCHESTRATOR-OWNED (built this way on purpose)
The two hooks (`contributor-repo-check.sh` SessionStart banner; `contributor-push-guard.sh` PreToolUse
fail-open guard) and their `settings.json` registration are **safety-critical** — a mis-built guard
could either fail closed (blocking legitimate working-remote pushes) or fail open in the wrong way. So
this component **did not create the scripts and did not edit `settings.json`.** It **specifies both
precisely** in `HOOKS-TODO.md` (and `snippets/sessionstart-hook-note.md`) and leaves the build +
registration + testing to the orchestrator. The skill + declaration file govern behavior in the
meantime; the hooks are the automated backstop.

## Gotchas when porting
- **`repo.local.md` is per-repo and tracked** (no-ignore policy) — do NOT gitignore it, and do NOT
  overwrite another repo's committed copy. Each repo declares its own ownership + remotes.
- **Fail-safe on an unclear declaration** — missing / ambiguous / neither box checked → treat as
  `contributor` (the stricter hold) and ask the user to `/declare-repo`. Never guess permissive.
- **The guard is fail-open** — it only ever blocks a high-confidence upstream match lacking the marker.
  Any uncertainty → allow. It never touches working-remote pushes. This is deliberate: it is the *last*
  safety net, not the *only* one.
- **Never a direct push to `upstream_base` / `upstream_live`; never merge upstream ourselves.** Always a
  feature-branch PR the maintainer merges.
- **Only the app subtree upstream** — exclude root `.adr/` `.docs/` `.chat-history/` from every patch.
- **Keep `.claude` ⇄ `.codex` in sync** (`syncing-claude-codex`) — mirrors differ only in path strings
  and the command header (`Instructions for Claude` vs `Instructions for Codex`).
- **Don't forget the orchestrator hand-off** — the component is not "done" until the orchestrator has
  built + wired + tested the two hooks. See `HOOKS-TODO.md`.

## Why staged here
Per the `.other-devices/` convention: anything reusable/template-worthy built on a device is staged as a
portable package so it can be synced to template repos / other machines. This component pairs with
`device-sync-protocol` (the reference example) and layers the contributor two-remote model on top of the
`production-pr-on-request` house rule.
