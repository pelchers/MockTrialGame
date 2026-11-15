# NOTES — `cycle-back`

## Why it exists
Context **compaction** summarizes the agent's working memory; threads that weren't active at that instant
can silently drop. Chat-history is a transcript (you'd have to re-read it to notice a lost thread). This
component is the deliberate short-list of **parked** threads, each resume-complete, plus a SessionStart
banner so open items re-enter context automatically after compaction.

## Design decisions
- **Log is project-local** (`.chat-history/cycle-back.md`), mirroring `pr-watch-log.md`. Parked topics are
  per-project; only the *component* travels between repos. This is the single most important invariant —
  never add the log to a sync set.
- **Non-destructive** — `RESOLVED ✓` instead of delete, so the reasoning (and the fact we handled it) is
  preserved. Deleting a message/record is also against the agent's own action rules; marking resolved fits.
- **Surfacing hook = the keystone.** Without it, the convention depends on the compaction summary keeping a
  pointer — exactly the failure mode it's meant to fix. The hook re-injects open items every SessionStart
  (and when a compacted context re-initializes), independent of the summary.
- **Cold-resume test** is the quality bar. A vague "revisit X later" is worse than nothing (false
  confidence). Entries must carry real pointers: chat-history file + locator, exact shas/URLs/paths, and
  the decisions already made.
- **States** OPEN / BLOCKED / RESOLVED. BLOCKED = waiting on an external dependency (a person, a deploy);
  OPEN = ours to pick back up when we choose.

## Gotchas
- The surfacing hook strips the `### ` markdown prefix with `sed 's/^#\{1,\} //'` — bash `${var#### }`
  parameter expansion is ambiguous with leading `#` and does NOT strip it (learned during build).
- Keep the SessionStart banner quiet when empty; cap the list (8) so a long backlog doesn't flood the
  banner. `CYCLE_BACK_SURFACE=off` disables it.
- The command mirrors to `.codex` with only the header line changed (`Instructions for Claude` → `Codex`),
  same as `/promote-pr` and `/pr-watch`.

## Relationships
- Beneath it: `chat-history-convention` (logs every turn).
- Sibling precedent: `pr-shepherd` (`pr-watch-log.md` is a domain-specific parked-state log).
- The convention block in the four instruction files makes it first-class (loaded every session), and the
  skill's trigger phrases ("circle back", "park this", "come back to later") make it auto-discoverable.
