# Cycle-Back — runbook

The **anti-forgetting** convention. A durable, resume-complete record of conversation topics/decisions we
deliberately **parked** to revisit later — engineered to survive context **compaction**.

## Why this exists

Long agent sessions get **compacted**: working memory is summarized into a shorter form, and open threads
that weren't "active" at that moment can silently drop. `.chat-history/user-messages.md` and the per-domain
logs capture the *transcript*, but a transcript is not a to-resume list — you'd have to re-read everything
to notice a dropped thread. Cycle-back is the **short-list of open threads awaiting follow-up**, each
written so a **cold context** (a compacted you, or another device) can resume the exact thread without the
user re-explaining.

It complements `chat-history-convention` (the transcript layer) and mirrors the precedent set by
`pr-shepherd`'s `pr-watch-log.md` (a domain-specific parked-state log) — generalized to any topic.

## Architecture

```
user says "circle back" / agent decides to defer a thread
        │
        ▼
  /cycle-back add  ──►  cycle-back skill ──►  cycle-back-agent
        │                                        │ writes resume-complete entry (newest on top)
        ▼                                        ▼
  .chat-history/cycle-back.md   ◄── project-local, append-only, NOT synced
        ▲
        │  every SessionStart (incl. after compaction)
  cycle-back-surface.sh  ──►  banner: "N parked topic(s) …"  ──►  re-enters context automatically
```

## The log — `.chat-history/cycle-back.md`

- **Project-local. Never synced.** Each repo keeps its own (same rule as `pr-watch-log.md`). Only the
  *component* files sync (see below).
- **Append-only, newest on top.** Entries are marked `RESOLVED ✓` when done, never deleted (the reasoning
  is a record). Prune only on explicit user request.
- **States:** `[OPEN]` (awaiting follow-up), `[BLOCKED]` (waiting on an external dependency), `[RESOLVED]`.

### Entry format
```
### [OPEN|BLOCKED|RESOLVED] <short title> — parked <YYYY-MM-DD>
- **Where in chat:** <chat-history file / transcript reference + what we were discussing there>
- **Why parked / decision:** <the deliberate defer + what it hinges on>
- **Resume trigger:** <the condition to come back — time / event / person acted>
- **To resume you need:** <exact state to rehydrate cold: files, shas, URLs, options, decisions made>
- **Next action on return:** <first concrete step>
```

### The cold-resume test (quality bar)
An entry is acceptable **only** if a reader with zero memory of the conversation could continue correctly
from it alone. Enforce it on every write:
- Real pointers — name the `.chat-history/*` file + a locator (date + topic), not "see above".
- Exact identifiers — shas, URLs, file paths, PR numbers.
- Decisions already made — so they aren't re-litigated on resume.
- Capture **why** it was parked, not only what.
- If something genuinely can't be captured (e.g. a scratchpad file that won't persist), **say so** in the
  entry rather than implying completeness.

## Operations (`/cycle-back <op>`)

| Op | Effect |
|----|--------|
| `add <topic>` | Write a resume-complete entry (defaults to the thread under discussion). |
| `list` / `open` | Show current `[OPEN]` + `[BLOCKED]` entries (title + trigger + next action). |
| `resolve <title>` | Mark `RESOLVED ✓ (<date>) — <outcome>`. Never deletes. |
| `check` | Re-evaluate open entries vs their resume triggers; surface any now ready; optionally resume one (re-verify cited state first). |

## Surfacing across compaction

`.claude/hooks/scripts/cycle-back-surface.sh` runs at **SessionStart** (registered in
`.claude/settings.json`). It prints a short banner of `[OPEN]`/`[BLOCKED]` titles, or nothing when there
are none. Because SessionStart fires on a fresh session and when a compacted context re-initializes, open
threads re-enter context automatically — you don't depend on the summary having kept them.
- Quiet when empty. Caps the list at 8 with a "+N more".
- Disable with `CYCLE_BACK_SURFACE=off`.

## What syncs vs what doesn't

| Path | Synced? |
|------|---------|
| `.claude/skills/cycle-back/` + `.codex/…` | ✅ component |
| `.claude/agents/cycle-back-agent/` + `.codex/…` | ✅ component |
| `.claude/commands/cycle-back.md` + `.codex/…` | ✅ component |
| `.claude/hooks/scripts/cycle-back-surface.sh` + `.codex/…` | ✅ component |
| `.claude/system_docs/cycle_back/` + `.codex/…` | ✅ component |
| `.docs/runbooks/development/cycle-back.md` | ✅ component |
| `.other-devices/components/cycle-back/` | ✅ portable package |
| **`.chat-history/cycle-back.md`** | ❌ **project-local — never sync** |

Registered in `.claude/hooks/scripts/sync-flush.sh` (PATHS) so `/sync-flush` propagates the component (not
the log) to every `SYNC-REPOS.md` target + the `.codex` mirror.

## Guardrails
- Log is project-local — never add it to a sync set.
- Non-destructive — mark RESOLVED, don't delete; prune only when the user says so.
- Resume-complete or flag the gap — a hollow entry is false confidence.
- Parked entries are **context, not standing orders** — re-verify (shas/URLs/files may have moved) on resume.

## Related
- `chat-history-convention` (transcript layer) · `pr-shepherd` / `pr-watch-log.md` (domain-specific precedent).
- Command `/cycle-back` · agent `cycle-back-agent` · skill `cycle-back`.
