# Cycle-Back — usage guide

## Park a topic
- **Natural:** "circle back to this later", "park this", "flag it to revisit", "come back to this after X".
- **Command:** `/cycle-back add <topic>` (omit `<topic>` to park the thread under discussion).
- The agent writes a resume-complete entry to `.chat-history/cycle-back.md` (newest on top):

```
### [OPEN] <short title> — parked <YYYY-MM-DD>
- **Where in chat:** <chat-history file + locator: date + what we were discussing>
- **Why parked / decision:** <the deliberate defer + what it hinges on>
- **Resume trigger:** <time / event / person acted>
- **To resume you need:** <exact shas, URLs, paths, options on the table, decisions already made>
- **Next action on return:** <first concrete step>
```

**The cold-resume test:** before saving, confirm a zero-memory reader could continue from the entry
alone. No "see above" — name files, cite shas/URLs, record decisions already made.

## See what's outstanding
- `/cycle-back list` (or `open`) — prints OPEN/BLOCKED titles + triggers.
- **Automatic:** the SessionStart hook prints a banner of open items at the start of every session
  (including after compaction). Read the full entry in `.chat-history/cycle-back.md` before acting.

## Resume a parked topic
- `/cycle-back check` — evaluates each open item's resume trigger against reality; surfaces any now ready.
- To resume: re-read "To resume you need" + "Next action", **re-verify** the cited state (shas/URLs/files
  may have moved), then continue.

## Close it out
- `/cycle-back resolve <title>` — marks `RESOLVED ✓ (<date>) — <outcome>`. **Never deletes**; the body
  stays as a record. Prune only if you explicitly ask.

## Good vs bad entries
- ✅ "Re-verify dev deploy after admin redeploys — was serving pre-merge code; merge shas `24b893b`/
  `6cf0ad8`; re-probe `/articles`+`/portal` should be 404; note drafted at scratchpad/…; if still stale,
  send via option a/b/c." → resumes cold.
- ❌ "Check the deploy thing later." → fails the cold-resume test; useless after compaction.

## When NOT to use it
- Routine in-flight subtasks → a normal todo list.
- Anything you'll finish this turn.
- Cycle-back is for **genuinely deferred threads** that must not be lost to compaction.

## Toggle
- `CYCLE_BACK_SURFACE=off` disables the SessionStart banner (the log + command still work).
