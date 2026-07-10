# Sync Repos â€” Asus Laptop (`C:\inetpub\Work`)

> Device-local sync list for the **ðŸ’» asus-laptop** (hostname `LUKE`). These are the repos/folders
> under `C:\inetpub\Work` that reusable components (skills, hooks, commands, the device-branch
> routing component, multi-agent conventions, etc.) should be propagated to from this machine.
>
> This complements the global `SYNC-REPOS.md` (template + cross-machine destinations). Use this
> file for **same-machine, same-parent-folder** propagation. Source of truth on this laptop:
> **`C:\inetpub\Work\DualLeads`**.

## Targets

| Folder | Path | Git repo? | Branch | `.claude`/`.codex`? | Role |
|--------|------|-----------|--------|---------------------|------|
| **Work umbrella** | `C:\inetpub\Work` | âœ… yes | `Asus-Work` | âŒ none | Manifest/device-convention sync root only; owns submodule pointers and non-standalone template/config directories |
| **DualLeads** (source) | `C:\inetpub\Work\DualLeads` | âœ… yes | `Asus-Work` | âœ… yes | Source of truth on this laptop |
| **promgmnt** | `C:\inetpub\Work\promgmnt` | âœ… yes | `Asus-Work` | âœ… yes | Sync target âœ… synced |
| **Needsboard** | `C:\inetpub\Work\Needsboard` | âœ… yes | `Asus-Work` | âœ… yes | Sync target âœ… synced |
| **Price-Indexing** | `C:\inetpub\Work\Quickies\Data\Price-Indexing` | âœ… yes | `Asus-Work` | âœ… yes | Sync target âœ… added 2026-06-22 (was missed â€” nested under organizational `Quickies\Data`) |
| **Outreach-Automation** | `C:\inetpub\Work\Outreach-Automation` | âœ… yes | `Asus-Work` | âœ… yes | Sync target âœ… added 2026-06-22 (Work-root sibling; `CC-Work` submodule) |
| **Data-Tracker** | `C:\inetpub\Work\Quickies\Data\Data-Tracker` | âœ… yes | `Asus-Work` | âœ… yes | Sync target âœ… added 2026-06-22 (under `Quickies\Data`; `CC-Work-Data` submodule, sibling of Price-Indexing) |
| **Warehouse-Lots** | `C:\inetpub\Work\Visuals\Physical\Warehouse-Lots` | git worktree under `C:\inetpub\Work` | `Asus-Work` | âœ… yes | Sync target added 2026-06-29 (existing manifest copy; Visuals/Physical workspace) |
| **ASUS-TEMPLATE** | `C:\inetpub\Work\ASUS-TEMPLATE` | no dedicated `.git` | umbrella `Asus-Work` | âœ… yes | Sync target added 2026-06-29 (template root; not a standalone repo) |
| **ASUS-TEMPLATE v1** | `C:\inetpub\Work\ASUS-TEMPLATE\v1` | no dedicated `.git` | umbrella `Asus-Work` | âœ… yes | Sync target added 2026-06-25 (local reusable-agent/template baseline) |
| **CarAggregator** | `C:\inetpub\Work\CarAggregator` | no dedicated `.git` | umbrella `Asus-Work` | âœ… yes | Sync target added 2026-06-29 (local agent/config directory; not a standalone repo yet) |
| Quickies / Quickies\Data | `C:\inetpub\Work\Quickies(\Data)` | Data = umbrella repo `CC-Work-Data` | `Asus-Work` | âŒ none | **Organizational/manifest sync only** â€” the AI repos are **Price-Indexing** + **Data-Tracker** inside. `Quickies\Data` is the `CC-Work-Data` submodule-umbrella (no `.claude`/`.codex`) but still receives sync manifests and records submodule pointers. |

> **Notes:**
> - `C:\inetpub\Work` itself is the umbrella git repo **`CC-Work`** (submodules) â€” committed/pushed on `Asus-Work`, but not a `.claude`/`.codex` sync target.
> - **Branches:** all targets are now on **`Asus-Work`** (this laptop's device lane). Resolved 2026-06-22 (promgmnt/Needsboard were renamed earlier; Price-Indexing + the `CC-Work`/`CC-Work-Data` umbrellas renamed 2026-06-22).
> - **device-branch-routing in Price-Indexing:** Price-Indexing is now a target, but the *full* `device-branch-routing` component (skills/hooks/`device.local.example.md`/SessionStart wiring) is **not yet installed** there â€” only the `multi-agent-collaboration` convention is. Full install pending (next propagation pass).

## What to sync (per reusable component)

Sync the component's files to each target's matching paths (see the component's
`.other-devices/components/<name>/MANIFEST.md` + `FILE-TREE.md`):

- `sync-repos-asus-laptop.md` (repo/root sync manifest) and any future `sync-repos-<device>.md`
  variant. **Sync manifests are themselves required sync artifacts.**
- `SYNC-REPOS.md` (global/cross-machine sync manifest) when present.
- `device.local.example.md` (repo root)
- `.claude/skills/<name>/SKILL.md` + `.codex/skills/<name>/SKILL.md`
- `.claude/hooks/scripts/<name>.sh` + `.codex/hooks/scripts/<name>.sh`
- `.claude/commands/<name>.md` + `.codex/commands/<name>.md`
- `.codex/system_docs/<name>/README.md`
- `.docs/runbooks/.../<name>.md` + `.docs/planning/plans/<n>-<name>.md`
- `.other-devices/components/<name>/**` (the portable package)
- Idempotent wiring: convention pointer in `CLAUDE.md`/`.claude/CLAUDE.md`/`.codex/CODEX.md`/
  `.codex/AGENTS.md`; `SessionStart` hook in `.claude/settings.json`. **No `.gitignore`** (no-ignore policy â€” see below).

> **Policy (updated 2026-06-22; clarified 2026-06-29):** `device.local.example.md` is a required
> sync artifact for every sync target. `device.local.md` is **TRACKED, not gitignored** (no-ignore
> policy), but it is target-specific: each repo/root keeps its own checked device lane and hostname.
> **Never blindly overwrite a target's `device.local.md` from DualLeads.** If a target is missing it,
> create it from `device.local.example.md`, set `asus-laptop` + `device-default`, and commit it on
> that target's `Asus-Work` lane. Still: don't overwrite a target's project-specific `CLAUDE.md`
> wholesale â€” **append** convention blocks idempotently. See
> `.other-devices/components/multi-agent-collaboration/`.

## â­ Standing rule (REQUIRED)

**Any time you fix or change something covered by these conventions â€” a `.claude`/`.codex` artifact,
a tracked component, a convention block, a hook, etc. â€” you MUST, before the work is done:**
1. **Propagate** the change to every in-sync target in the Targets table above (copy the changed
   files; keep the wiring idempotent; `sync-repos-asus-laptop.md` / `SYNC-REPOS.md` / future
   sync manifests must sync; `device.local.example.md` must sync; `device.local.md` is tracked
   but per-target â€” don't overwrite a target's own checked device lane).
2. **Log it** in the Sync log below (date Â· what changed Â· which targets Â· verification).
3. Re-verify each target with `bash .claude/hooks/scripts/device-sync-check.sh`.
4. **Always `git add -A` + commit + push** on the device branch (`Asus-Work`) â€” see the `multi-agent-collaboration` convention.

This keeps the targets from drifting. A fix that lands only in DualLeads is **not** finished.

## Components tracked

| Component | Staged at | Targets in sync | Last synced |
|-----------|-----------|-----------------|-------------|
| `sync-manifests` | `sync-repos-asus-laptop.md` + `SYNC-REPOS.md` | Work umbrella, DualLeads, promgmnt, Needsboard, Quickies/Data, Price-Indexing, Outreach-Automation, Data-Tracker, Warehouse-Lots, ASUS-TEMPLATE, ASUS-TEMPLATE v1, CarAggregator | 2026-06-29 |
| `device-branch-routing` | `.other-devices/components/device-branch-routing/` | DualLeads, promgmnt, Needsboard, Price-Indexing âš ï¸ (full install pending), Outreach-Automation, Data-Tracker, Warehouse-Lots, ASUS-TEMPLATE, ASUS-TEMPLATE v1, CarAggregator | 2026-06-29 |
| `multi-agent-collaboration` | `.other-devices/components/multi-agent-collaboration/` | DualLeads, promgmnt, Needsboard, Price-Indexing, Outreach-Automation, Data-Tracker, Warehouse-Lots, ASUS-TEMPLATE, ASUS-TEMPLATE v1, CarAggregator | 2026-06-29 |
| `chat-history-convention` | `.other-devices/components/chat-history-convention/` | DualLeads, promgmnt, Needsboard, Price-Indexing, Outreach-Automation, Data-Tracker, Warehouse-Lots, ASUS-TEMPLATE, ASUS-TEMPLATE v1, CarAggregator | 2026-06-29 |
| `device-sync-protocol` + `multi-device-and-agent-contract.md` | `.other-devices/components/device-sync-protocol/` | (home-desktop propagation) all 14 SYNC-REPOS targets — Template/All, Dispatch/All, MockTrial, AppDock, PortfolioV1, IDEA-MANAGEMENT, Markdown Mermaid Editor, Campus, Restaurant-MarTech, Brand-MarTech, OutreachAI, DualLeads, HealthApps, LivBeyond | 2026-07-07 |

## Sync log

| Date | Change | Targets | Verified |
|------|--------|---------|----------|
| 2026-06-22 | Initial sync of `device-branch-routing` component (11 files + portable package + wiring) | promgmnt, Needsboard | hook banner âœ“ |
| 2026-06-22 | Hook fix: robust to unborn/detached HEAD (`git symbolic-ref`) | promgmnt, Needsboard | clean `branch=` âœ“ |
| 2026-06-22 | Gitignore comment standardized to "REQUIRED (per convention) + why" | promgmnt, Needsboard | (later superseded by no-ignore policy) |
| 2026-06-22 | Renamed `Work` â†’ `Asus-Work` in both targets (align with device convention) | promgmnt, Needsboard | `branch=Asus-Work` âœ“ |
| 2026-06-22 | Embedded **Propagate + log** standing rule into the staging convention in every instruction file | DualLeads, promgmnt, Needsboard | rule present âœ“ |
| 2026-06-22 | **Branch strategy:** renamed `Work`â†’`Asus-Work` in Price-Indexing + umbrellas `CC-Work-Data`/`CC-Work`; all repos push on `Asus-Work` | Price-Indexing, CC-Work-Data, CC-Work | `branch=Asus-Work` âœ“ |
| 2026-06-22 | **No-ignore policy:** removed `.gitignore`; `device.local.md` now TRACKED per-branch; `device-branch-routing/gitignore-snippet.txt` flipped to "tracked, do not ignore" | DualLeads, promgmnt, Needsboard | no `.gitignore`; device.local.md tracked âœ“ |
| 2026-06-22 | **New component `multi-agent-collaboration`** (always add-all+commit+push, read-fresh, per-device lanes); convention block appended to all instruction files; package staged | DualLeads, promgmnt, Needsboard, Price-Indexing | block in 13 files âœ“ |
| 2026-06-22 | **Added Price-Indexing as a sync target** (was missed â€” nested under organizational `Quickies\Data`) | Price-Indexing | listed in Targets âœ“; device-branch-routing full-install pending |
| 2026-06-22 | **New repos added as sync targets:** `Outreach-Automation` (Work-root â†’ `CC-Work` submodule) + `Data-Tracker` (`Quickies\Data` â†’ `CC-Work-Data` submodule); scaffolded from template with the `multi-agent-collaboration` component + conventions + device files | Outreach-Automation, Data-Tracker | listed in Targets âœ“ |
| 2026-06-22 | **Doc reconciliation to no-ignore policy:** flipped all stale "device.local.md is gitignored/per-machine/never-commit" wording â†’ "tracked & committed per-branch" across the `device-branch-routing` component (SKILL Ã—2, runbook, system_docs, commands Ã—2, template, FILE-TREE/MANIFEST/NOTES, convention block in instruction files) + added a SUPERSEDED banner to plan 2. Swept all repos; the older-template scaffolds (Outreach-Automation, Data-Tracker) still had the pre-flip wording and were reconciled too | DualLeads, promgmnt, Needsboard, Outreach-Automation, Data-Tracker | only the plan's historical body retains "gitignored" (carries the SUPERSEDED banner) âœ“ |
| 2026-06-24 | **Built-app ignore EXCEPTION (user-approved):** added a narrow `.gitignore` to the app repos covering ONLY regenerable installed-deps/build output (`node_modules/`, `.pnpm-store/`, `dist/`, `build/`, `out/`, `.next/`, `.vite/`, `.turbo/`, `coverage/`). Committing those bloats repos (node_modules â‰ˆ 135k files). This is the ONLY sanctioned ignore â€” everything else (incl. `device.local.md`) stays TRACKED. **Do NOT strip these `.gitignore`s during no-ignore reconciliation.** | DualLeads, promgmnt, Needsboard, Outreach-Automation, Price-Indexing, Data-Tracker | `.gitignore` present + node_modules excluded âœ“ |
| 2026-06-25 | **Chat history component update:** entries now require `Authored by: <codex\|claude>` + `Most recent commit: <short-hash> (<subject>)`; scripts resolve commit metadata automatically; system docs + portable package updated; ASUS-TEMPLATE v1 added as a sync target. | DualLeads, promgmnt, Needsboard, Price-Indexing, Outreach-Automation, Data-Tracker, ASUS-TEMPLATE v1 | source verified; target propagation in this commit pass |
| 2026-06-29 | **ASUS sync manifest expansion:** added `Work` umbrella, `Warehouse-Lots`, `ASUS-TEMPLATE` root, and `CarAggregator`; clarified that `sync-repos-asus-laptop.md`, `SYNC-REPOS.md`, future sync manifests, and `device.local.example.md` must sync to all ASUS targets while `device.local.md` remains tracked but per-target and must not be blindly overwritten. Manifests copied to every target path listed above, including manifest-only git roots. | Work umbrella, DualLeads, promgmnt, Needsboard, Quickies/Data, Price-Indexing, Outreach-Automation, Data-Tracker, Warehouse-Lots, ASUS-TEMPLATE, ASUS-TEMPLATE v1, CarAggregator | manifest present; git status reviewed; dirty target repos not add-all committed |
| 2026-07-07 | **NEW component `device-sync-protocol`** (cross-device pickup/wind-down: `/pickup` + `/winddown` + skill + `device-sync-agent` + extended SessionStart hook + `HANDOFF.md` + runbook + system_docs + staged package) **+ `multi-device-and-agent-contract.md`** (root + runbook) **+ main-repositioning** of `device-branch-routing` (both devices default to working lanes; `main` = handoff/savepoint/stable/prod). Propagated from **home-desktop (VENGEANCE)** to all 14 `SYNC-REPOS.md` targets — **COPY + WIRE + LOG only, LEFT UNCOMMITTED per user directive** (23 reusable files + `.other-devices` package each; convention block appended idempotently to CLAUDE.md/CODEX.md/AGENTS.md; `HANDOFF.md` seeded from template where missing; per-target `device.local.md` NOT overwritten). | Template/All, Dispatch/All, MockTrial, AppDock, PortfolioV1, IDEA-MANAGEMENT, Markdown Mermaid Editor, Campus, Restaurant-MarTech, Brand-MarTech, OutreachAI, DualLeads, HealthApps, LivBeyond | files present + hook runs (AppDock spot-check ✓); blocks idempotent; targets left dirty for per-repo commit |

## How

- Same-machine copy (this file's targets): copy per the component MANIFEST; verify with the
  component's `bash .claude/hooks/scripts/device-sync-check.sh`.
- `.claude/` â‡„ `.codex/` parity within a repo: `syncing-claude-codex` skill.
- Cross-machine / template destinations: `SYNC-REPOS.md` + `maintaining-trinary-sync` skill.
