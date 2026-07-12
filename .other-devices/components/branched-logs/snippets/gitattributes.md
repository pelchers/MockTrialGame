# .gitattributes snippet — append when a target ADOPTS branched logs (after `migrate-all`)

```gitattributes
# Branched append-logs (branched-log-merge.py / branched-logs.sh)
.chat-history/user-messages.md merge=ours
.chat-history/user-messages.*.md merge=union
HANDOFF.md merge=ours
HANDOFF.*.md merge=union
component-sync-log.md merge=union
```

> Apply ONLY after running `branched-logs.sh migrate-all <device>` so the per-device segments exist and
> the `post-merge` regenerator is active. Before that, keep `HANDOFF.md merge=union` (safe default) —
> `merge=ours` on an un-migrated merged view would keep the local copy and drop the incoming side.
