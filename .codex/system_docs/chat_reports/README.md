# Chat Reports System

System documentation for the session report generation agent and skill.

## Purpose

Generates structured markdown reports summarizing all work performed during a Claude Code work session. Reports capture file changes, agent invocations, decisions made, sync status, and pending follow-up items. Designed for post-session review, team handoff, and continuity across sessions.

## When to Use

- After long or multi-step work sessions to capture what happened.
- After orchestrator runs that dispatch multiple subagents.
- Before clearing or compacting chat history (pairs with `ingesting-agent-history`).
- When handing off to another person or starting a new session.
- On explicit user request ("give me a session report", "summarize what we did").

## Architecture

```
┌─────────────────────────────────┐
│       Chat Report Agent         │
│  (Data Gatherer / Formatter)    │
├─────────────────────────────────┤
│  1. Collects git state          │
│  2. Analyzes conversation       │
│  3. Cross-references changes    │
│  4. Formats 8-section report    │
│  5. Outputs to chat or file     │
└─────────────────────────────────┘
         │
         ▼
  ┌──────────────────┐
  │  Output Target   │
  │  - Chat (default)│
  │  - File (.chat-history/reports/)
  │  - Appended to user-messages.log
  └──────────────────┘
```

## Report Format (8 Sections)

Every report contains these sections in order:

| # | Section | Content |
|---|---------|---------|
| 1 | Session Summary | 2-3 sentence overview with date, branch, completion status |
| 2 | Files Modified | Table of file paths, actions (created/modified/moved/deleted), reasoning |
| 3 | Agents Invoked | List of agents dispatched, their purpose, output, and success/failure |
| 4 | Key Decisions | Decisions made with rationale and alternatives considered |
| 5 | Systems Affected | Which `.codex/` subsystems, workflows, or root configs were touched |
| 6 | Sync Status | `.codex` mirror state, remote push state, external system updates |
| 7 | Pending Items | Actionable follow-up items with enough context to resume |
| 8 | Metrics | File counts, commit hashes, branch name, approximate duration |

## Output Locations

| Mode | Location | When |
|------|----------|------|
| Chat (default) | Printed in conversation | Always, unless user specifies otherwise |
| File | `.chat-history/reports/report_YYYY-MM-DD_HHMM.md` | When user requests a saved report |
| Chat history | Appended to `.chat-history/user-messages.log` | When user wants report in the chat log |

## Integration with Other Systems

- **chat-history-convention**: Reports can be appended to `user-messages.log` under an `AGENT REPORT` section header, using the same timestamp and separator format.
- **ingesting-agent-history**: Both capture session state, but reports are more detailed and structured. Use ingest summaries for quick context restoration; use reports for thorough documentation.
- **savepoint-branching**: Report metrics include savepoint branch names when savepoints were created during the session.
- **maintaining-trinary-sync**: Report sync status tracks whether `.codex` mirrors were updated during the session.

## Agent & Skill Locations

| Component | Path |
|-----------|------|
| Agent | `.codex/agents/chat-report-agent/agent.md` |
| Skill | `.codex/skills/generating-chat-reports/SKILL.md` |
| System Docs | `.codex/system_docs/chat_reports/README.md` |

## Example Report Structure

```markdown
# Session Report — 2026-02-28

**Branch:** `master`
**Session Status:** Complete
**Duration:** ~2h 15m

---

## 1. Session Summary
Created the chat report agent and skill system for generating structured
session reports. All three files (agent, skill, system docs) were written
and verified. No subagents were dispatched.

## 2. Files Modified
| File Path | Action | Reasoning |
|-----------|--------|-----------|
| `.codex/agents/chat-report-agent/agent.md` | created | New agent definition |
| `.codex/skills/generating-chat-reports/SKILL.md` | created | New skill definition |
| `.codex/system_docs/chat_reports/README.md` | created | System documentation |

**Totals:** 3 created, 0 modified, 0 deleted

## 3. Agents Invoked
No agents were dispatched during this session.

## 4. Key Decisions
- **Report structure uses 8 mandatory sections** — covers all aspects of
  session work without being overwhelming. Alternatives: free-form summary
  (rejected: too unstructured), 4-section minimal format (rejected: misses
  sync and metrics).

## 5. Systems Affected
- `.codex/agents/` — new agent added
- `.codex/skills/` — new skill added
- `.codex/system_docs/` — new system doc added

## 6. Sync Status
No sync operations performed.

## 7. Pending Items
No pending items — all work completed.

## 8. Metrics
- **Files:** 3 created, 0 modified, 0 deleted
- **Commits:** `a1b2c3d`
- **Branch:** `master`
- **Session duration:** ~2h 15m
```
