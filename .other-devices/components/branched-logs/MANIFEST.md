# branched-logs — MANIFEST

Device-branched append-log system: each device appends to its own segment `<base>.<device>.md`; the
merged view `<base>.md` is regenerated (chronological, deduped, 0-loss). Companion to
`device-sync-protocol` + `chat-history-convention`.

## Install map (source artifact → target path)
| Artifact | Target path | Action |
|---|---|---|
| `artifacts/branched-log-merge.py` | `.claude/hooks/scripts/branched-log-merge.py` · `.codex/…` | overwrite (the engine) |
| `artifacts/branched-logs.sh` | `.claude/hooks/scripts/branched-logs.sh` · `.codex/…` | overwrite (orchestrator: merge-all / migrate-all / absorb-all) |
| `artifacts/append-user-message.ps1` | `.claude/skills/chat-history-convention/scripts/append-user-message.ps1` · `.codex/…` | overwrite (writes to device segment + regenerates) |
| `artifacts/system-doc-README.md` | `.codex/system_docs/branched_logs/README.md` | create |
| `artifacts/tests-explained.md` | `.codex/system_docs/branched_logs/tests-explained.md` | create |
| `snippets/gitattributes.md` | append the merge rules to the target's `.gitattributes` | append (only when adopting branched logs) |

## Dependencies
- `device-sync-protocol` — its `device-sync-check.sh` (SessionStart) installs the git `post-merge` hook
  that runs `branched-logs.sh merge-all`; its `/pickup` runs `absorb-all`. `device.local.md` resolves the device.
- Python 3 (engine). PowerShell 7 (append script). git-bash (`MSYS_NO_PATHCONV=1` for blob reads).

## Adopt on a target (one-time)
1. Copy artifacts (via `/sync-component`) + append `snippets/gitattributes.md` to `.gitattributes`.
2. `bash .claude/hooks/scripts/branched-logs.sh migrate-all <device>` — splits existing single-file logs
   into per-device segments + regenerates the merged views (verify 0 loss).
3. Commit. From then on, appends + pulls keep both devices' logs unioned automatically.

> Until a target runs `migrate-all`, leave its `HANDOFF.md merge=union` (safe default). The `merge=ours`
> rule for merged views is only correct once segments exist + the post-merge regenerator is active.

## Validation
`ds-testlab/test-logs.sh` (21/21 engine) + `ds-testlab/test-log-pull.sh` (15/15 live-pull). See `tests-explained.md`.
