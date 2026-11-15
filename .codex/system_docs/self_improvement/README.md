# Self-Improvement Logging — component README

**Purpose.** The compounding convention: a durable, verifiable record of **how the agents actually
performed** on real work — per meaningful action, the benefit (what worked), the bug/gap (what broke, was
missed, or was deferred, and how handled), each tied to a commit/PR/file and to how it was verified — so
the team and future agents get better over time instead of relearning the same lessons.

## Problem it solves
Most of what an agent learns in a session evaporates when the context is summarized or the session ends.
Chat-history logs everything but is a transcript, not a performance ledger; a win with no evidence and a
bug with no record both vanish. Self-improvement logging is the short, chaseable record of how work went,
written so a future agent starts smarter — and so a human can audit the claim.

## Pieces
| Piece | Path | Role |
|-------|------|------|
| Skill | `.claude/skills/self-improvement-logging/SKILL.md` | When/how to log + promote; entry format; the verifiable quality bar |
| Agent | `.claude/agents/self-improvement-logger-agent/AGENT.md` | Executor: writes verifiable entries, promotes learnings, lists state |
| Command | `.claude/commands/log-improvement.md` | `/log-improvement add\|promote\|list\|show` (`$ARGUMENTS`) |
| Hook (surface) | `.claude/hooks/scripts/self-improvement-surface.sh` | SessionStart banner (log active + standing-rule count + newest topic) |
| Hook (reminder) | `.claude/hooks/scripts/self-improvement-log-reminder.sh` | PostToolUse(Task) nudge after a subagent finishes |
| Log — README | `.self-improving-ai/README.md` | **Project-local** format spec + conventions (the live reference) |
| Log — ledger | `.self-improving-ai/ledger.md` | **Project-local** distilled learnings: patterns, recurring bugs, standing rules |
| Log — timelines | `.self-improving-ai/log/<feature-or-topic>.md` | **Project-local** per-body-of-work timeline (one row per action) |

## Design invariants
- **Log is project-local**, like `.chat-history/cycle-back.md` / `pr-watch-log.md`. Only the component
  (skill/agent/command/hooks/system-docs) syncs across repos; never sync `.self-improving-ai/` contents.
- **Ours, never shipped** — `.self-improving-ai/` is root-level (like `.docs`/`.adr`); it records
  agent-process learnings, not product data, and never travels to the product subtree (`CC/`).
- **Verifiable or nothing** — every entry must pass the verifiable test (real shas/paths/test-counts a
  reader can chase). No vague praise.
- **Never fabricate** — a benefit, a bug, a sha, or a test count is never invented; "none" / "not verified"
  are honest, respected values.
- **Non-destructive + append-only** — correct a past assessment with a new entry; promote learnings
  alongside existing ones, don't rewrite the record.
- **Surfacing is automatic** — the SessionStart banner keeps the log in view each session (even after
  compaction) and the PostToolUse(Task) reminder nudges a log the instant a subagent finishes.

## Format at a glance
Each log entry (one table row, or a bullet block for a one-off) carries five fields: **when/what**,
**commit/PR/files**, **benefit**, **bug/gap** ("none" valid), **verified**. The ledger distills recurring
learnings into three sections: **Patterns that pay off**, **Recurring bugs / traps**, **Standing rules**.
The canonical, live spec is `.self-improving-ai/README.md`.

## Relationships
- Companion to `chat-history-convention` (logs every turn verbatim — the transcript layer beneath this).
- Sibling to `cycle-back` (parks deferred threads) and `pr-shepherd`'s `pr-watch-log.md` (domain-specific
  parked state) — all project-local logs with a synced component, same split.

See `USAGE_GUIDE.md` for day-to-day use.
