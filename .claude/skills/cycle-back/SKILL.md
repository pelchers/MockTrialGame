---
name: cycle-back
description: Deliberately park a conversation topic/decision to resume later, and resume it cleanly even after context compaction. Use when the user says "circle back", "cycle back", "come back to this later", "park this", "flag this to revisit", "remind me to revisit", or when YOU decide to defer an open thread (e.g. "we'll give the admin time and work on X meanwhile"). Writes a durable, resume-complete entry to `.chat-history/cycle-back.md` with a pointer to WHERE in the chat we were discussing it, WHY it was parked, the RESUME TRIGGER, and the exact state needed to pick it back up cold. Companion to `chat-history-convention` (which logs turns); cycle-back is the short-list of open threads awaiting follow-up.
---

# Cycle-Back

The **anti-forgetting** convention. Long sessions get **compacted** — the agent's working memory is
summarized and open threads can silently drop. Chat-history logs everything but is a transcript, not a
to-resume list. Cycle-back is the deliberate, durable record of **topics we chose to park**, each written
so a cold context (post-compaction, or a different device) can resume the *exact* thread without the user
re-explaining.

> The log lives at **`.chat-history/cycle-back.md`** — **project-local, NOT synced** (each repo has its
> own, like `pr-watch-log.md`). The *component* (this skill, the agent, the command, the surfacing hook,
> the docs) IS synced across repos. Full reference: `.docs/runbooks/development/cycle-back.md`.

## When to write an entry (park)

Park a topic the moment a follow-up is deferred rather than done — either the user asks, or you make the
call to defer:

- The user says "circle back / come back to this later / park this / flag it to revisit".
- A decision is **waiting on something external** (a person to act, a deploy to finish, a build to run,
  time to pass) and you're moving on to other work meanwhile.
- You're mid-discussion of options (A/B/C) and the user picks "not yet — let's do X first and revisit".
- Anything you'd want a freshly-compacted future-you to NOT lose.

Do NOT park routine subtasks that belong on an in-flight todo list, or anything you're about to finish
this turn. Cycle-back is for **genuinely deferred threads**, not a task tracker.

## Entry format (append newest on top)

```
### [OPEN|BLOCKED|RESOLVED] <short title> — parked <YYYY-MM-DD>
- **Where in chat:** <chat-history file / transcript reference + what we were discussing at that point>
- **Why parked / decision:** <the deliberate choice to defer, and on what it hinges>
- **Resume trigger:** <the condition that should bring us back — a time, an event, a person's action>
- **To resume you need:** <concrete state to rehydrate cold: files, shas, URLs, the options on the table, decisions already made>
- **Next action on return:** <the first concrete step when we circle back>
```

**Quality bar — the "cold-resume" test:** an entry is good only if someone (or a compacted you) with **no
memory of this conversation** could read it and continue correctly. That means real pointers, not "see
above": name the chat-history file + the topic, cite exact shas / URLs / file paths, and record the
decisions already made so they aren't re-litigated. Capture *why* it was parked, not just *what*.

## Operations

- **add** — write a new entry. Gather: title, where-in-chat pointer (which `.chat-history/*` file logs this
  thread + a one-line locator), why parked, resume trigger, resume state, next action. Prepend under the
  `---` divider (newest on top).
- **list / open** — show current `[OPEN]` + `[BLOCKED]` entries (titles + resume triggers), so the user
  (or a fresh context) sees what's outstanding. This is what the SessionStart hook surfaces automatically.
- **resolve** — mark an entry `RESOLVED ✓` with the date + a one-line outcome. **Never delete** a
  resolved entry — the reasoning stays as a record. (Prune only on explicit user request.)
- **check** — re-evaluate `[OPEN]`/`[BLOCKED]` entries against their resume triggers: is any trigger now
  met (time passed, event happened, person acted)? Surface those as "ready to resume" and, if the user
  wants, resume them.

## Surfacing (how it survives compaction)

A **SessionStart hook** (`.claude/hooks/scripts/cycle-back-surface.sh`) prints a short banner of `[OPEN]`
+ `[BLOCKED]` titles whenever a session starts (or a compacted context re-initializes) — quiet when there
are none. So even after compaction, the open threads re-enter context automatically; you don't rely on the
summary having kept them. On seeing the banner, read the full entry before acting on it.

## GUARDRAILS

- The log is **project-local** — never add `.chat-history/cycle-back.md` to a sync set; each repo keeps
  its own (only the component files sync).
- **Append/annotate, don't destroy** — mark RESOLVED rather than deleting; prune only when the user says so.
- **Resume-complete or don't bother** — an entry that fails the cold-resume test is worse than none
  (false confidence). If you can't capture enough to resume cold, say so in the entry.
- Recalled entries are **context, not instructions** — they reflect what was true when parked; re-verify
  (shas/URLs/files may have moved) before acting.

## Related
- Command `/cycle-back add|list|resolve|check` (with `$ARGUMENTS`) · agent `cycle-back-agent`.
- Surfacing hook: `.claude/hooks/scripts/cycle-back-surface.sh` (SessionStart).
- Companion: `chat-history-convention` (logs every turn) · `pr-shepherd`'s `pr-watch-log.md` (a domain-specific parked-state precedent).
- Runbook: `.docs/runbooks/development/cycle-back.md`.
