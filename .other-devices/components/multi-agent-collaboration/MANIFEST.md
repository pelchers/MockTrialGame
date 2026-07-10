# Component — multi-agent-collaboration

| Field | Value |
|---|---|
| **Name** | `multi-agent-collaboration` |
| **Purpose** | Convention for safe concurrent work when multiple agents/devices edit the same repo: always add-all + commit + push, read-before-write-freshly, pull/rebase, per-device branch lanes, SHA-pinned submodules. |
| **Type** | Convention block (instruction-file snippet) + docs. No hook, no skill required. |
| **Source authored** | `Needsboard` (2026-06-22), propagated to all in-sync targets. |
| **Companion** | Composes with `device-branch-routing` (per-device branches) and the "Reusable Artifact Staging / Propagate + log" sync rule. |

## Files
- `snippets/convention-snippet.md` — the managed convention block to append (idempotently) to each
  repo's instruction files: root `CLAUDE.md` (where present), `.claude/CLAUDE.md`, `.codex/AGENTS.md`,
  `.codex/CODEX.md`.
- `MANIFEST.md` / `FILE-TREE.md` / `NOTES.md` — this package.

## How to install in a target repo
1. Append `snippets/convention-snippet.md` to each instruction file (idempotent — skip if the
   `BEGIN multi-agent-collaboration convention` marker already present).
2. Commit + push on the device branch (`add -A`).
3. Log it in `sync-repos-asus-laptop.md` (Sync log + Components tracked).

## Policy note (device.local.md)
This component sets the standing decision that **`device.local.md` is TRACKED (committed per-branch), not gitignored** — superseding the original `device-branch-routing` gitignore rule. Each device commits to its own branch lane, so each lane carries its own `device.local.md` and is self-describing/"understood" across devices. The `device-branch-routing` `gitignore-snippet.txt` is updated accordingly and `.gitignore` is removed (no-ignore policy).
