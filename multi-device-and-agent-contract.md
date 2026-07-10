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
| `Home-Work` | 🖥 home-desktop **working lane** — default commit target on the home desktop |
| `Asus-Work` | 💻 asus-laptop **working lane** — default commit target on the laptop |
| `main` | **handoff + savepoint + stable + deployment/prod** — synced to a device lane only at wind-down; savepoints cut from it; prod deploys from it |
| `savepoint-*` | milestone snapshots cut from `main` via `/savepoint` |

The latest completed handoff always lives on `main` (and the device branch that did it). The next
machine gets it by pulling `main`.

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
