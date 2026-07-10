# Design note — Device Sync & Handoff Protocol (`device-sync-protocol`)

> **Status:** ✅ Built + staged (2026-07-06). Portable package:
> `.other-devices/components/device-sync-protocol/`.
> **Goal:** make multi-device development (🖥 home-desktop ⇄ 💻 asus-laptop) coherent — every agent
> starts on the most-forward-*appropriate* version and always leaves a clean, machine-readable handoff
> for the next machine.
> **Companion to:** `device-branch-routing` (that convention says *where to commit*; this one says
> *how to get in sync before* and *how to hand off after*). The full user-facing explanation is the
> runbook `.docs/runbooks/development/device-sync-and-handoff-protocol.md` (copied into `artifacts/`).

---

## 0. Decisions (locked)

| # | Question | Decision |
|---|----------|----------|
| D1 | Where does the latest work live between machines? | **`main`.** `main` becomes the **handoff + savepoint + stable + deployment/prod** branch. The most recent handoff always lives on `main` (and on the device branch that did it), so the next machine pulls `main` to resume. |
| D2 | Do devices still commit to `main` daily? | **No** (changed 2026-07-06). BOTH devices default to their own **working lane** (home→`Home-Work`, asus→`Asus-Work`). `main` is updated only at a **handoff** (wind-down) or a **savepoint**. |
| D3 | How is "most-forward" decided at pickup? | **ADR/planning/HANDOFF-informed judgment — NOT raw commit count.** Read `.adr/current/development-progress.md` + `.docs/planning/*` + newest `HANDOFF.md` entry + the diverging commits. If two lanes advanced *different* ADR areas → integrate **both**; never discard a lane. |
| D4 | Handoff log format | **Append-only, per-device `HANDOFF.md`** (newest on top), same spirit as the `chat-history` convention. Each entry: synced-from · what changed · where I stopped/state · next actions · blocked-on · gotchas · branch@sha. |
| D5 | How does the agent know to sync? | **Extend the existing `device-sync-check.sh` SessionStart hook** (from device-branch-routing) rather than add a new hook. It now flags when `main`/the other lane is ahead + prints HANDOFF freshness → tells you to `/pickup`. |
| D6 | Divergence safety | **Never force-push a shared branch; never discard a lane's commits.** Genuine divergence (both lanes have unique commits) → STOP and reconcile with the user. `<Device>-Work:main` must be a fast-forward. |
| D7 | Codex parity | **Yes** — mirror skill, both commands, agent, extended hook, and system_docs into `.codex/`; append the convention block to `.codex/CODEX.md` + `.codex/AGENTS.md` (syncing-claude-codex). |

---

## 1. Branch model (updated 2026-07-06)

| Branch | Role |
|--------|------|
| `Home-Work` | 🖥 home-desktop **working lane** — default commit target on the home desktop |
| `Asus-Work` | 💻 asus-laptop **working lane** — default commit target on the Asus laptop |
| `main` | **handoff + savepoint + stable + deployment/prod** — NOT a daily lane; synced at wind-down only |

```
   home-desktop (Home-Work) ──/winddown: push branch + main (sync)──┐
                                                                     ▼
                                              main (handoff · savepoint · stable · prod)
                                                                     ▲
   asus-laptop  (Asus-Work) ──/winddown: push branch + main (sync)──┘
        ▲ /pickup: pull latest handoff from main            ▲ /pickup: pull latest handoff from main
```

## 2. The two rituals

- **PICKUP (`/pickup`, start of work):** fetch all lanes → determine most-forward-appropriate state
  (ADR/planning/HANDOFF-informed) → adopt into your working branch (`--ff-only` behind main only /
  `pull --rebase` if local work + main moved / surface-and-ask if the other lane is ahead / STOP if
  truly diverged) → read newest `HANDOFF.md` + status board → summarize → proceed.
- **WIND-DOWN (`/winddown`, end of work):** commit everything to your lane → prepend a `HANDOFF.md`
  entry → update chat-history + status board → `git push origin <Device>-Work` then
  `git push origin <Device>-Work:main` (fast-forward only) → optional `/savepoint` at a milestone →
  verify `origin/main...HEAD` = `0 0`.

## 3. Component build sheet

| Component | Path | Responsibility |
|---|---|---|
| **Skill** `device-sync-protocol` | `.claude/skills/device-sync-protocol/SKILL.md` (+ `.codex/`) | The pickup + wind-down step logic an agent follows. |
| **Command** `/pickup` | `.claude/commands/pickup.md` (+ `.codex/`) | Run the pickup ritual. |
| **Command** `/winddown` | `.claude/commands/winddown.md` (+ `.codex/`) | Run the wind-down ritual. |
| **Agent** `device-sync-agent` | `.claude/agents/device-sync-agent/AGENT.md` (+ `.codex/`) | Executes the sync/handoff autonomously. |
| **Hook (extended)** | `.claude/hooks/scripts/device-sync-check.sh` (+ `.codex/`) | SessionStart banner: cross-device ahead/behind + HANDOFF freshness → tells you to `/pickup`. |
| **Log** | `HANDOFF.md` (repo root, tracked) | Append-only, per-device handoff log. |
| **Convention block** | `.claude/CLAUDE.md` · `.codex/CODEX.md` · `.codex/AGENTS.md` (+ root `CLAUDE.md`) | Always-loaded pointer to this protocol. |
| **Runbook** | `.docs/runbooks/development/device-sync-and-handoff-protocol.md` | The full explanation (the design doc). |
| **System docs** | `.codex/system_docs/device_sync_protocol/README.md` + `USAGE_GUIDE.md` | Component reference + usage. |

## 4. Relationship to device-branch-routing

`device.local.md` still resolves *which device this is* → *which working lane* is the default target,
but the default is now the device's **working lane** (home→`Home-Work`, asus→`Asus-Work`), and
"release to main" now means **handoff-sync + savepoint**, not a daily push. This protocol layers the
cross-device **sync + handoff** on top of that resolver.

## 5. Validation checklist

- [ ] `bash .claude/hooks/scripts/device-sync-check.sh` prints device + branch + `main`-ahead + HANDOFF freshness.
- [ ] `/pickup` fetches, reports divergence, and (fast-forward case) updates the device branch to `main`.
- [ ] `/winddown` commits, appends a HANDOFF entry, and pushes device branch + `main` in sync.
- [ ] `.claude` ⇄ `.codex` mirrors aligned; system_docs entry exists; package staged in `.other-devices/`.

## 6. Portability staging

Per `.other-devices/README.md`, this component is staged as a self-contained, installable package so
it can be synced to template repos / other machines from the main PC. See this package's `FILE-TREE.md`
(what it touches) + `MANIFEST.md` (where it goes) + `NOTES.md` (rationale + gotchas).
