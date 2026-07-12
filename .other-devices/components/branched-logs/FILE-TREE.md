# branched-logs — FILE-TREE

Files this component adds/edits in a consuming repo:

```
<repo>/
├── .claude/
│   ├── hooks/scripts/branched-log-merge.py .......... NEW  (engine: merge/migrate/absorb one log)
│   ├── hooks/scripts/branched-logs.sh ............... NEW  (orchestrator over the log registry)
│   └── skills/chat-history-convention/
│       ├── SKILL.md .............................. EDIT (+ device-branched storage-model section)
│       └── scripts/append-user-message.ps1 ....... EDIT (write to device segment + regenerate)
├── .codex/
│   ├── hooks/scripts/branched-log-merge.py ......... NEW  (mirror)
│   ├── hooks/scripts/branched-logs.sh .............. NEW  (mirror)
│   ├── skills/chat-history-convention/ ............. EDIT (mirror)
│   └── system_docs/branched_logs/
│       ├── README.md ............................. NEW
│       └── tests-explained.md .................... NEW  (success metrics M1–M5)
├── .gitattributes ................................... EDIT (merged views merge=ours; segments merge=union)
├── .chat-history/
│   ├── user-messages.md ............................. DERIVED merged view (regenerated; AI reads this)
│   └── user-messages.<device>.md .................... NEW  per-device segment ("branch")
├── HANDOFF.md ....................................... DERIVED merged view (newest on top)
└── HANDOFF.<device>.md .............................. NEW  per-device segment
```

Depends on `device-sync-protocol` (post-merge hook install + `/pickup absorb-all`) and
`device.local.md` (device resolution). `component-sync-log.md` stays `merge=union` (table/prose ledger).
