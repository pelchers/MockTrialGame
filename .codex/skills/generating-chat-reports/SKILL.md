---
name: generating-chat-reports
description: Generate structured markdown session reports summarizing files changed, agents invoked, decisions made, sync status, and pending items after long agent work sessions.
---

# Generating Chat Reports

Use this skill to produce a structured session report after long work sessions, multi-step agent workflows, or whenever the user requests a summary of what was accomplished.

## When to Generate Reports

- At the end of a long or multi-step work session.
- After an orchestrator dispatches multiple subagents and all work completes.
- When the user explicitly asks for a session summary or report.
- Before clearing or compacting chat history (pairs well with `ingesting-agent-history`).
- When handing off work to another person or session.

## Data Gathering Workflow

### Step 1: Git Analysis
Run these commands to collect the raw data for the report:

```bash
# Identify the session's commits (adjust -N to cover the session)
git log --oneline -20

# See aggregate file changes across recent commits
git diff --stat HEAD~5

# Check for uncommitted work
git status

# Get the current branch
git branch --show-current

# Get the latest commit hash
git rev-parse --short HEAD
```

Adjust the commit range (`HEAD~5`, `-20`) based on how many commits the session produced. If unsure, start broad and narrow down.

### Step 2: Conversation Analysis
Scan the conversation for:
- Every `Write`, `Edit`, `Read`, `Bash`, `Glob`, `Grep` tool call and its target file.
- Any `Task` or subagent dispatches and their return values.
- User messages that contain decisions, preferences, or constraints.
- Error messages, retries, or corrective actions taken.
- Explicit user requests that were fulfilled or deferred.

### Step 3: Cross-Reference
- Match git diff output against conversation actions to build a complete picture.
- Identify files that were changed by subagents (may not appear in direct conversation).
- Check if `.claude` mirrors were updated (trinary sync).
- Note any files that were created but not committed.

## Report Template

Use this exact structure for every report. All 8 sections are mandatory.

```markdown
# Session Report — YYYY-MM-DD

**Branch:** `<branch-name>`
**Session Status:** Complete | In Progress | Interrupted
**Duration:** ~Xh Ym (approximate if determinable)

---

## 1. Session Summary

<2-3 sentences describing what was accomplished, the scope of work, and whether goals were met.>

---

## 2. Files Modified

| File Path | Action | Reasoning |
|-----------|--------|-----------|
| `path/to/file.ext` | created | <why this file was created> |
| `path/to/other.ext` | modified | <what was changed and why> |

**Totals:** X created, Y modified, Z deleted

---

## 3. Agents Invoked

- **<Agent Name>** — <purpose of invocation>
  - Output: <what was produced>
  - Status: Success | Failure | Partial

<If no agents were invoked: "No agents were dispatched during this session.">

---

## 4. Key Decisions

- **<Decision>** — <rationale>. Alternatives considered: <list>.
- **<Decision>** — <rationale>.

<If no decisions were made: "No significant decisions were made — session was execution-only.">

---

## 5. Systems Affected

- <Which `.codex/` subsystems were touched>
- <Whether CLAUDE.md or root config was updated>
- <Which workflow pipelines were modified>

---

## 6. Sync Status

- `.claude` mirror: <updated / not updated / not applicable>
- Remote push: <pushed / not pushed / partial>
- External systems: <details or "none">

<If no sync: "No sync operations performed.">

---

## 7. Pending Items

- [ ] <Actionable follow-up item with enough context to resume>
- [ ] <Another item>
- [WIP] <Item that was started but not finished>

<If nothing pending: "No pending items — all work completed.">

---

## 8. Metrics

- **Files:** X created, Y modified, Z deleted
- **Commits:** `abc1234`, `def5678`, ...
- **Branch:** `<branch-name>`
- **Session duration:** ~Xh Ym
```

## Formatting Rules

### Tables
- Use markdown tables for the Files Modified section.
- Left-align all columns.
- Wrap file paths in backtick code formatting.
- Keep the Reasoning column concise (under 80 characters per cell).

### Code Blocks
- Use fenced code blocks for file paths, command outputs, and commit hashes.
- Use `bash` language tag for command examples.
- Use `text` language tag for raw output.

### Bullet Points
- Each bullet should be independently understandable.
- Use bold for decision names or item labels.
- Keep bullets to one line when possible; use sub-bullets for details.

### Metrics
- Always include commit hashes even if there is only one commit.
- Use short hashes (7 characters) from `git rev-parse --short`.
- Approximate session duration from the first and last commit timestamps if conversation timestamps are unavailable.

## Output Location

### Default: Chat Output
Print the full report directly in the chat response. This is the default behavior when the user asks for a report or summary.

### Optional: File Output
If the user requests a saved report:
1. Ensure `.chat-history/reports/` directory exists.
2. Write the report to `.chat-history/reports/report_YYYY-MM-DD_HHMM.md`.
3. Use the current date and time for the filename.
4. Confirm the file path to the user after writing.

### Optional: Chat History Integration
If the user wants the report appended to the chat log:
1. Open `.chat-history/user-messages.log`.
2. Append the report under an `AGENT REPORT` header with a timestamp separator:

```text
---
[TIMESTAMP] role=agent-report

AGENT REPORT:
<full report content>

---
```

This integrates with the `chat-history-convention` skill's entry format.

## Handling Edge Cases

### Partial Sessions (Work in Progress)
- Set Session Status to "In Progress" in the header.
- Prefix incomplete items in Pending Items with `[WIP]`.
- Still populate all 8 sections; use "N/A — session still in progress" for sections that cannot be determined yet.
- Note the interruption reason in the Session Summary if known.

### No Git Commits
- If the session produced no commits (e.g., research-only or planning), state this in Metrics.
- Use `git status` and conversation analysis as the primary data sources instead.
- List modified but uncommitted files in the Files Modified table with a note.

### Subagent-Heavy Sessions
- When an orchestrator dispatched multiple subagents, list each one individually in Agents Invoked.
- Include the subagent's target (e.g., "pass-3 of brutalist style") and its output directory.
- Note any subagents that failed or required retries.

### Very Short Sessions
- If the session was brief (single file edit, one question answered), still generate all 8 sections.
- Keep sections proportionally brief. Use "N/A" or "None" where appropriate rather than omitting sections.

## Integration Points

| System | How It Connects |
|--------|-----------------|
| `chat-history-convention` | Reports can be appended to `user-messages.log` under AGENT REPORT section |
| `ingesting-agent-history` | Reports complement ingest summaries; both capture session state but reports are more detailed |
| `savepoint-branching` | Report Metrics section should include savepoint branch names if any were created |
| `maintaining-trinary-sync` | Report Sync Status section tracks `.claude` mirror updates |

## Agent Reference
Agent definition: `.codex/agents/chat-report-agent/AGENT.md`
