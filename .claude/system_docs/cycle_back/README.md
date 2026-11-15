# Cycle-Back — component README

**Purpose.** The anti-forgetting convention: a durable, resume-complete record of conversation
topics/decisions we deliberately **parked** to return to later — engineered to survive context
**compaction** (when the agent's working memory is summarized and open threads can silently drop).

## Problem it solves
Long sessions get compacted. Chat-history logs everything but is a transcript, not a to-resume list; the
compaction summary may not preserve a thread you meant to revisit. Cycle-back is the short-list of open
threads, each written so a **cold context** (post-compaction or another device) can resume the exact
thread without the user re-explaining.

## Pieces
| Piece | Path | Role |
|-------|------|------|
| Skill | `.claude/skills/cycle-back/SKILL.md` | When/how to park + resume; entry format; the cold-resume quality bar |
| Agent | `.claude/agents/cycle-back-agent/AGENT.md` | Executor: writes resume-complete entries, lists, resolves, checks triggers |
| Command | `.claude/commands/cycle-back.md` | `/cycle-back add\|list\|resolve\|check` (`$ARGUMENTS`) |
| Hook | `.claude/hooks/scripts/cycle-back-surface.sh` | SessionStart banner of OPEN/BLOCKED items → survives compaction |
| Log | `.chat-history/cycle-back.md` | **Project-local** append-only log (NOT synced; each repo its own) |
| Runbook | `.docs/runbooks/development/cycle-back.md` | Full protocol + rationale |

## Design invariants
- **Log is project-local**, like `pr-watch-log.md`. Only the component (skill/agent/command/hook/docs)
  syncs across repos; never sync `.chat-history/cycle-back.md`.
- **Non-destructive**: entries are marked `RESOLVED ✓`, not deleted (reasoning is preserved). Prune only
  on explicit user request.
- **Resume-complete or nothing**: every entry must pass the cold-resume test (a zero-memory reader can
  continue). Real pointers only — chat-history file + locator, exact shas/URLs/paths, decisions made.
- **Surfacing is automatic**: the SessionStart hook re-injects open items each session, so compaction can't
  bury them.

## Relationships
- Companion to `chat-history-convention` (logs every turn — the transcript layer beneath this).
- Precedent: `pr-shepherd`'s `pr-watch-log.md` is a domain-specific parked-state log; cycle-back is the
  general-purpose version for any topic.

See `USAGE_GUIDE.md` for day-to-day use.
