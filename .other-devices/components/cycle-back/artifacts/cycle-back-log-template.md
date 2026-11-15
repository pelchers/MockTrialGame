# Cycle-Back Log — topics to deliberately return to

Append-only log of **conversation topics/decisions we consciously parked** to resume later — the
continuity layer that survives context **compaction** (when the agent's working memory is summarized,
open threads can silently drop; this file is the durable record so we can pick the exact thread back up).

Complements — does not replace — `.chat-history/user-messages.md` (every user turn) and the per-domain
logs (`pr-watch-log.md`, `qna.md`, `autonomous-report-log.md`). Those are transcripts; **this is the
short-list of things awaiting a follow-up**, each with enough context to resume cold.

> Written/maintained by the **`cycle-back`** component (skill `cycle-back`, agent `cycle-back-agent`,
> command `/cycle-back add|list|resolve|check`). Convention: newest entry on top. Mark an item
> `RESOLVED ✓` (with date + outcome) rather than deleting, so the reasoning is preserved.

## Entry format
```
### [OPEN|BLOCKED|RESOLVED] <short title> — parked <YYYY-MM-DD>
- **Where in chat:** <chat-history file / transcript + what we were discussing at that point>
- **Why parked / decision:** <the deliberate choice to defer, and on what>
- **Resume trigger:** <the condition that should bring us back — a time, an event, a person's action>
- **To resume you need:** <the concrete state to rehydrate: files, shas, URLs, the options on the table>
- **Next action on return:** <the first thing to do when we circle back>
```

---

<!-- first entry goes here, newest on top -->
