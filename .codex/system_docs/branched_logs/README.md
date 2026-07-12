# Branched Logs System

## Overview
Append-only, multi-device logs (chat history, HANDOFF) break when two machines both append to ONE file
and then git-merge — a conflict (a careless resolve drops a side) or a `merge=union` that jumbles order
and duplicates on re-merge. **Branched logs** fix this the way git itself stays safe: make the WRITES
physically disjoint. Each device appends only to its own **segment** `<base>.<device>.md` (its "branch");
the human/AI-facing **merged view** `<base>.md` is regenerated deterministically from all segments.

Companion to `device-sync-protocol` (cross-device pickup/wind-down) and `chat-history-convention`
(entry format). Logs ALWAYS union both devices' entries — **0 chat-history loss** — regardless of the
code-merge mode chosen at `/pickup`.

## Components
| Piece | Path | Role |
|---|---|---|
| **Engine** | `.claude/hooks/scripts/branched-log-merge.py` (· `.codex/…`) | merge / migrate / absorb one log |
| **Orchestrator** | `.claude/hooks/scripts/branched-logs.sh` (· `.codex/…`) | run merge-all / migrate-all / absorb-all across the registry |
| **Append** | `.claude/skills/chat-history-convention/scripts/append-user-message.ps1` | write a new chat entry → device segment → regenerate |
| **Auto-fire** | git `post-merge` hook (installed by `device-sync-check.sh`) | regenerate every merged view after any pull/merge |
| **Pickup step** | `/pickup` step 7 | `absorb-all <other-device> origin/main` then `merge-all` (every mode) |
| **Merge protection** | `.gitattributes` | merged views `merge=ours` (derived) · segments `merge=union` · `component-sync-log.md merge=union` |
| **System docs** | `.codex/system_docs/branched_logs/README.md` (this) · `tests-explained.md` | overview + success metrics |

## Registry (which logs are branched)
| Log | Dir | Order | Model |
|---|---|---|---|
| `user-messages` | `.chat-history` | asc (newest last) | segment engine |
| `HANDOFF` | repo root | desc (newest on top) | segment engine |
| `component-sync-log` | repo root | — | **`merge=union`** (mixed table/prose ledger — markers between table rows would break the table) |

## Entry marker
Each entry in a segment/merged view carries a hidden HTML-comment marker (invisible when rendered):
```
<!-- ENTRY ts=2026-07-12T14:30:00-04:00 device=home-desktop id=8f8809b6 -->
<original entry body, verbatim>
<!-- /ENTRY -->
```
- **ts** — whitespace-free sort key (lexical = chronological).
- **device** — which segment/lane the entry belongs to.
- **id** — first 8 hex of `sha1(normalized body)` → deterministic **dedup** (re-merges never duplicate;
  shared-ancestor entries present in both devices' files collapse to one).

## How a cross-device pull resolves (the happy path)
1. **Other device** hands off → its log entries reach `main` (or its lane).
2. **This device `/pickup`:** `absorb-all <other> origin/main` reads the other branch's log files via
   `git show <ref>:<path>` (with `MSYS_NO_PATHCONV=1`), extracts entries **not already present** (by id),
   writes them into the OTHER device's segment, and regenerates the merged view.
3. Result: `<base>.md` chronological, deduped, **both devices' entries** — 0 loss. Works even when the
   other device is still on the OLD single-file format (legacy `---`/`##` parsers handle it).

## Guarantees
- **0 loss** — append-only disjoint segments; the regenerator never drops an unparseable block (it
  quarantines it); the merged view is fully regenerable from segments (a corrupted merged file recovers).
- **Idempotent** — `merge-all` run twice ⇒ byte-identical; re-`absorb` of the same source ⇒ no dupes.
- **AI-readable** — you read one file, `<base>.md`, exactly as before; markers are invisible comments.
- **Mode-independent** — logs union in `both`/`theirs`/`ours`; the mode only changes which app code is adopted.

## Notes
- Mirrored `.claude ⇄ .codex`; the `post-merge` hook + `/pickup` try both script locations.
- Windows: engine forces UTF-8 stdout + ASCII status text; `git show` blob reads use `MSYS_NO_PATHCONV=1`.
- Proven end-to-end by `ds-testlab` (`test-logs.sh` 21/21, `test-log-pull.sh` 15/15). See `tests-explained.md`.
