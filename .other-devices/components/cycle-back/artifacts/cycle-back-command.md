---
name: cycle-back
description: Park a conversation topic to resume later (survives context compaction), list open parked threads, mark one resolved, or check whether any parked item is ready to resume. Writes to the project-local `.chat-history/cycle-back.md`.
invocable: true
---

# /cycle-back — park & resume conversation topics

Runs the `cycle-back` convention (skill `cycle-back`, agent `cycle-back-agent`) against the project-local
log `.chat-history/cycle-back.md`. Use it to deliberately defer a thread with enough context to resume it
cold — the durable layer that survives context **compaction**.

`$ARGUMENTS` selects the operation:

- `/cycle-back add <topic>` — park `<topic>`: write a resume-complete entry (where-in-chat pointer, why
  parked, resume trigger, state to rehydrate, next action). If `<topic>` is omitted, park the thread just
  under discussion. Newest entry goes on top.
- `/cycle-back list` (or `open`) — show current `[OPEN]` + `[BLOCKED]` entries (title + resume trigger).
- `/cycle-back resolve <title>` — mark that entry `RESOLVED ✓` with the date + outcome (never deletes).
- `/cycle-back check` — re-evaluate open entries against their resume triggers; surface any now ready to
  resume, and (if asked) resume one — re-verifying its cited state first.

## Instructions for Claude

1. Invoke the **`cycle-back`** skill and follow it. For `add`/`check`-then-resume, hand off to the
   **`cycle-back-agent`** for the full reconstruction + resume-complete write; `list`/`resolve` can be done
   inline.
2. Operate ONLY on `.chat-history/cycle-back.md` (create it from the skill's template header if missing).
   It is **project-local — never sync it**.
3. Enforce the **cold-resume test** on every `add`: the entry must let a zero-memory context continue
   correctly. Fill every field with real pointers (chat-history file + locator, exact shas/URLs/paths,
   decisions already made) — no "see above".
4. **Never delete** entries — `resolve` marks them `RESOLVED ✓`; prune only if the user explicitly asks.
5. Report what changed (entry added / list / resolved / triggers now met).

## Notes
- The **SessionStart hook** (`.claude/hooks/scripts/cycle-back-surface.sh`) auto-surfaces open items each
  session, so parked threads re-enter context even after compaction — this command is the manual driver.
- Companion: `chat-history-convention` (logs every turn). Full protocol:
  `.docs/runbooks/development/cycle-back.md`.

$ARGUMENTS
