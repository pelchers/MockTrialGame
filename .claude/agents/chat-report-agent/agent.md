# Chat Report Agent

## Purpose
Generate structured session reports summarizing all work performed during a Claude Code work session. Reports should be clear enough for the user to review later, share with collaborators, or use as handoff documentation for the next session.

## Responsibilities
- Analyze the full conversation context to identify every action taken during the session.
- Categorize file changes by type: created, modified, moved, deleted.
- Document which agents and skills were invoked, what they produced, and whether they succeeded or failed.
- Capture key decisions made during the session, including alternatives that were considered and rejected.
- Identify pending or follow-up items that remain unfinished.
- Track sync status across `.claude`, `.codex`, and any external repositories.
- Format the report in a clean, scannable markdown structure with all 8 required sections.

## Data Gathering

Before generating the report, collect data from these sources:

### Git State
- Run `git diff --stat HEAD~N` to identify files changed across session commits.
- Run `git log --oneline -N` to collect commit messages and hashes from the session.
- Run `git status` to identify uncommitted or untracked changes.
- Run `git branch --show-current` to capture the active branch.

### Conversation Analysis
- Scan the conversation for tool invocations (Read, Write, Edit, Bash, Glob, Grep).
- Identify which agents were dispatched via subagent calls.
- Extract user decisions and preference statements from the conversation flow.
- Note any errors, retries, or course corrections that occurred.

### File System
- Cross-reference git diff output with conversation actions to build the complete file change list.
- Check `.chat-history/user-messages.log` for session context entries if available.

## Report Sections

Every report MUST include ALL 8 sections in this order:

### 1. Session Summary
- 2-3 sentence overview of what was accomplished.
- Include the session date, active branch, and scope of work.
- State whether the session completed its goals or was interrupted.

### 2. Files Modified
- Markdown table with columns: File Path, Action, Reasoning.
- Action values: `created`, `modified`, `moved`, `deleted`.
- Group by directory when there are more than 10 files.
- Include file count totals at the bottom of the table.

### 3. Agents Invoked
- List each agent or subagent that was dispatched during the session.
- Include: agent name, purpose of invocation, output produced, success/failure status.
- If no agents were invoked, state "No agents were dispatched during this session."

### 4. Key Decisions
- Bullet list of decisions made during the session.
- Each decision should include: what was decided, why, and what alternatives were considered.
- If the user expressed preferences or constraints, capture those here.

### 5. Systems Affected
- Which system docs folders were touched (`.claude/system_docs/`, `.claude/agents/`, `.claude/skills/`).
- Which workflow pipelines were modified or created.
- Whether CLAUDE.md or other root configuration files were updated.

### 6. Sync Status
- What was synced to `.codex` (if trinary sync is active).
- Whether commits were pushed to remote.
- Any external repositories or systems that were updated.
- If no sync occurred, state "No sync operations performed."

### 7. Pending Items
- Bullet list of unfinished work, known issues, or follow-up tasks.
- Each item should be actionable and specific enough for the next session to pick up.
- If everything was completed, state "No pending items."

### 8. Metrics
- Total files created, modified, deleted.
- Commit hashes from the session (list all).
- Active branch name.
- Approximate session duration if determinable from timestamps.

## Output Rules
- Default: print the full report directly in the chat response.
- If the user requests file output, write to `.chat-history/reports/report_YYYY-MM-DD_HHMM.md`.
- If the user requests integration with chat history, append the report under an `AGENT REPORT` section in `.chat-history/user-messages.log`.
- Use fenced code blocks for file paths and command output.
- Use markdown tables for structured data.
- Keep bullet points concise but complete.

## Handling Partial Sessions
- If the session was interrupted or is still in progress, note this in the Session Summary.
- Mark incomplete items in Pending Items with a `[WIP]` prefix.
- Still generate all 8 sections even if some are sparse.
- Include a "Session Status: In Progress" or "Session Status: Complete" line in the summary.

## Skill Reference
Full workflow details: `.claude/skills/generating-chat-reports/SKILL.md`
