# Multi-Device & Multi-Agent Contract

> **What this is:** the single explainer for how humans + AI agents (Claude Code / Codex) work on
> this repo across **multiple machines** and **multiple concurrent agents** without losing work or
> stepping on each other. It ties together every convention involved. Each convention also has its
> own skill/hook/runbook; this is the map.
>
> **Duplicated at** `.docs/runbooks/development/multi-device-and-agent-contract.md` and synced to all
> repos in `SYNC-REPOS.md`. Audience: you + any agent, first thing.

---

## 0. The one-paragraph contract
Every machine works on **its own device branch** (`Home-Work`, `Asus-Work`). `main` is the
**handoff + savepoint + stable + deployment/prod** branch, never a daily lane. You **`/pickup`** at the
start of work (sync to the most-forward version + read the last handoff) and **`/winddown`** at the
end (commit → append a `HANDOFF.md` entry → push your device branch **and** `main`). Multiple agents
may run at once, so **always `git add -A` + commit + push at every commit point**, **read files fresh
before editing**, and **pull/rebase before push, never force-push**. Anything reusable is **staged**
under `.other-devices/components/` and **synced** to the other repos.

## 1. The branch model (updated 2026-07-06)

| Branch | Role |
|---|---|
| `f<N>-<slug>@luke` | **Feature work tip** — the durable, carry-forward source of truth for feature *N*. The primary working surface. One per active feature; merged forward, **never rebased or deleted**. (See §1.5.) |
| `Home-Work` | 🖥 home-desktop **working lane** — this machine's daily commit target + handoff pointer; at wind-down it fast-forwards to the feature tip it advanced |
| `Asus-Work` | 💻 asus-laptop **working lane** — same, for the laptop |
| `main` | **handoff + savepoint + stable + deployment/prod** — synced to a device lane only at wind-down; savepoints cut from it; prod deploys from it |
| `savepoint-*` | milestone snapshots cut from `main` via `/savepoint` |

The latest completed handoff always lives on `main` (and the device branch that did it). The next
machine gets it by pulling `main`.

## 1.5 The feature-lane axis — how work is partitioned across features AND devices (added 2026-08-13)

The branch table has **two orthogonal axes**; keep their jobs distinct:

- **Feature axis — `f<N>-<slug>@luke` = the WHAT.** Each feature gets exactly one long-lived branch
  that is the *carry-forward work tip* for that feature — the single source of truth for its state,
  across sessions and machines. It is cut from the current integration tip, advanced until the feature
  is done, **merged forward (never rebased/deleted)**, and kept as a savepoint afterward.
- **Device axis — `<Device>-Work` = the WHO/WHERE.** A device lane is this machine's daily commit
  target *and* handoff pointer. At wind-down it **fast-forwards to the feature tip this device
  advanced**, then syncs `main`. It records *which device took feature N to which commit* and carries
  the `HANDOFF.md` + logs — it is **not** the feature's source of truth (the `f<N>` branch is).

**Partition rule (from here on):**
1. **One feature ⇒ one `f<N>-<slug>@luke` branch.** Never run two features on one branch, and never run
   two devices on the *same* feature branch at once (that is what causes silent divergence — e.g. f3
   piled onto f5).
2. **Each device drives its own feature at a time**, declared in `device.local.md` (§5). Parallel work =
   different features on different branches on different devices (e.g. f4 on old-pc-home while f3
   continues on the other device).
3. **Feature branches cut from the current integration tip** (the furthest-forward `f<N>` branch, or
   `main`) and **merge forward** per `lane-forward-integration.md`; the newest lane stays the superset.
4. **No fixed "owning device."** Features converge by **forward-merge at the integration tip** (per
   `lane-forward-integration.md`); whichever device performs a given merge/promotion **records it** in the
   registry's "Last advanced by" column — a *fact*, not a standing role. Any device may pick up any feature
   next. `/pickup`'s `pull --rebase` before you push keeps single-branch pushes **fast-forward-only**, so
   two devices can share one feature branch across sessions without clobbering.
5. **Routine commits go on the `f<N>` branch.** The device lane is fast-forwarded to that tip, and
   `main` ff'd, only at wind-down (unchanged) — by whichever device is at the convergence/promotion point.
6. **Repo-infra / convention changes** (this contract, skills, agents, runbooks, the registry — *not*
   feature-scoped) are committed on the **integration tip** and forward-integrated into every active
   feature lane, so each device picks them up on its next merge rather than on only one feature branch.

**Feature-Lane Registry (feature lanes + who last advanced them).** One canonical table, one row per
active feature lane, lives in the status board `.adr/current/development-progress.md` (read at `/pickup`,
updated at `/winddown`). Columns: **Feature · Branch · Base (cut-from) · Status · Last advanced by
(device@sha · date)**. **Device identity is metadata, not ownership** — the last column is a factual log
of which machine took the lane to which commit, never an assignment. `device.local.md` §5 records this
machine's *current* lane.

**Concurrent co-dev escape hatch (rare, opt-in).** The default is **one shared feature branch** synced via
`/pickup` pull-rebase. Only if two devices must commit to the *same* feature at the *same time* may each
work a device-suffixed branch `f<N>-<slug>@luke__<device>` (only that device ff-pushes it) and merge both
into the canonical `f<N>-<slug>@luke`. This is an exception for genuine simultaneity — not the norm.

> **Nothing else changes.** `/pickup`, `/winddown`, `/savepoint`, `/device`, `device.local.md` routing,
> `main` = prod, the SessionStart banner, multi-agent add-all/read-fresh/rebase, and cross-repo sync all
> work exactly as before — the feature axis + registry are layered on top.

## 2. The conventions (each is its own component)

| Convention | What it governs | Where |
|---|---|---|
| **device-branch-routing** | *Which* branch this machine commits to (via `device.local.md`) | skill `device-branch-routing`, `/device`, `device.local.md`, runbook `device-branch-convention.md` |
| **device-sync-protocol** | *Pickup* (get synced) + *wind-down* (hand off) rituals | skill `device-sync-protocol`, `/pickup`, `/winddown`, agent `device-sync-agent`, `HANDOFF.md`, runbook `device-sync-and-handoff-protocol.md` |
| **chat-history-convention** | Per-request log for continuity | `.chat-history/user-messages.md`, skill `chat-history-convention` |
| **multi-agent-collaboration** | Concurrent-writer safety (add-all, read-fresh, rebase) | managed convention block in the instruction files |
| **reusable-artifact-staging** | Stage template-worthy work for cross-repo sync | `.other-devices/` + its README |
| **savepoint-branching** | Milestone snapshots from `main` | skill `savepoint-branching`, `/savepoint` |
| **sync-manifests** | Where to propagate reusable work | `SYNC-REPOS.md` (cross-machine) + `sync-repos-<device>.md` (same-machine) |

The SessionStart hook (`device-sync-check.sh`) reports, every conversation: this device + working
branch, ahead/behind `main`, whether another device/`main` is ahead (**→ run `/pickup`**), and the
freshness of the last `HANDOFF.md` entry.

## 3. The two rituals (the human-facing surface)

**START → `/pickup`** — `git fetch` all lanes → determine the most-forward-*appropriate* state
(read the `.adr` status board + planning + newest `HANDOFF.md` entry + diverging commits, not raw
commit count; if two lanes advanced different areas, integrate **both**) → adopt it into your device
branch (`--ff-only` / `pull --rebase`; **STOP + ask if lanes truly diverged**) → read the handoff +
rebuild understanding → work.

**END → `/winddown`** — `git add -A && commit` → prepend a `HANDOFF.md` entry (append-only,
per-device: synced-from · what changed · where I stopped · next actions · blocked-on · gotchas) →
update chat-history + status board → `git push origin <Device>-Work` then
`git push origin <Device>-Work:main` (fast-forward only) → optional `/savepoint` at a milestone.

## 4. Multi-agent rules (concurrent writers, same or different machines)
- **Assume you are not the only writer.** Always `git add -A` + commit + push at every commit point —
  universal add-all keeps concurrent edits continuously integrated.
- **Read before write, freshly** — re-read a file immediately before editing.
- **Pull/rebase before push; never force-push** a shared branch; **never discard** a lane's commits.
- **Announce concurrency** in chat when you detect another agent's changes.

## 5. Cross-repo sync (the reusable layer)
- Anything reusable (a skill/hook/command/agent/convention/component) is **staged** under
  `.other-devices/components/<name>/` (FILE-TREE · MANIFEST · NOTES · artifacts · plans · snippets)
  **before the work is done**.
- On the **main PC**, staged packages are **propagated** to every repo in `SYNC-REPOS.md`
  (cross-machine/template) using each package's MANIFEST; same-machine propagation uses
  `sync-repos-<device>.md`.
- **Required sync artifacts** travel too: the sync manifests themselves, `device.local.example.md`,
  and this contract. **Per-target `device.local.md` is tracked but device-specific — never overwrite
  another repo's checked device lane.** Append convention blocks **idempotently**; never overwrite a
  target's project-specific `CLAUDE.md` wholesale.
- **Standing rule:** a fix that lands in only one repo is **not done** — propagate + log it in the
  sync manifest, re-verify each target with the hook, then commit/push on the device lane.

## 6. Quick reference
```
/device      show/change this machine's device toggle (device.local.md)
/pickup      start-of-work: sync to the most-forward version + read the handoff
/winddown    end-of-work: commit → HANDOFF entry → push device branch + main
/savepoint   milestone snapshot from main
```

## 7. Related
- `.docs/runbooks/development/device-sync-and-handoff-protocol.md` — the pickup/wind-down protocol.
- `.docs/runbooks/development/device-branch-convention.md` — the working-lane resolver.
- `HANDOFF.md` — the living handoff log. `SYNC-REPOS.md` / `sync-repos-<device>.md` — the sync targets.
- `.other-devices/README.md` — the staging convention + packages index.
