---
name: log-improvement
description: Record how the agents actually performed — append a verifiable entry (benefit + bug/gap + verified + commit) for the latest subagent/action to `.self-improving-ai/log/<topic>.md`, promote a durable learning to the ledger, or list recent entries + standing rules. Writes to the project-local `.self-improving-ai/`.
invocable: true
---

# /log-improvement — log agent performance & distill learnings

Runs the `self-improvement-logging` convention (skill `self-improvement-logging`, agent
`self-improvement-logger-agent`) against the project-local log `.self-improving-ai/`. Use it to capture how
a piece of work actually went — the benefit, the bug/gap, how it was verified, the commit — so future
agents compound on it. The durable layer beneath `chat-history` (which logs the turns verbatim).

`$ARGUMENTS` selects the operation:

- `/log-improvement add <topic>` — log the latest subagent/action/decision: append a verifiable entry
  (when/what, commit/PR/files, benefit, bug/gap, verified) to `.self-improving-ai/log/<topic>.md`. If
  `<topic>` is omitted, use the body of work just finished (create the log file with a header if new).
  Newest row at the bottom of its section.
- `/log-improvement promote <learning>` — distill a durable learning into `.self-improving-ai/ledger.md`
  under the right heading (Patterns that pay off / Recurring bugs / traps / Standing rules), with a pointer
  back to where it was learned.
- `/log-improvement list` (or `show`) — show the most recent log entries (or a named topic's timeline) +
  the ledger's standing rules.

## Instructions for Claude

1. Invoke the **`self-improvement-logging`** skill and follow it. For `add`/`promote`, hand off to the
   **`self-improvement-logger-agent`** for the full reconstruction + verifiable write; `list`/`show` can be
   done inline.
2. Operate ONLY within `.self-improving-ai/` (create `log/<topic>.md` with a header if missing; the folder
   itself already exists). It is **project-local — never sync its contents**, and the folder is **ours** —
   never ship it to the product subtree (`CC/`).
3. Reconstruct from **evidence, not memory** — the subagent's report, the commit/diff, live CI. Enforce the
   **verifiable test** on every `add`: real shas/paths/test-counts, never vague praise. **Never fabricate**
   a benefit or a bug — "none" is a valid, honest value.
4. **Append, don't rewrite** — correct a past assessment with a new entry; promote learnings append-only.
5. Report what changed (entry added / learning promoted / list).

## Notes
- Two hooks keep it paced with the work: the **SessionStart** banner
  (`.claude/hooks/scripts/self-improvement-surface.sh`) flags the log is active, and the
  **PostToolUse(Task)** reminder (`.claude/hooks/scripts/self-improvement-log-reminder.sh`) nudges you to
  log a subagent's outcome right after it finishes — this command is the manual driver.
- Live format spec + standing rules: `.self-improving-ai/README.md` + `.self-improving-ai/ledger.md`.
  Companion: `chat-history-convention` (logs every turn) · `cycle-back` (parks deferred threads).

$ARGUMENTS
