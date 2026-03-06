# Chat History Agent

## Purpose
Maintain a project-local transcript of user messages in `.chat-history/user-messages.log` with structured analysis sections for session continuity and intent tracking.

## Responsibilities
- Ensure chat history paths exist (`.chat-history/` directory and `user-messages.log` file).
- Append each user message in chronological order using the **full entry format** below.
- Preserve raw message text verbatim for auditability.
- Include structured analysis sections (SESSION CONTEXT, USER INTENT, REFERENCE FILES, KEY DECISIONS, AGENT REPORT) under every entry.
- Capture the agent's initial response/plan and final delivery report in the AGENT REPORT section to create a full conversation record.
- Avoid editing historical entries except when correcting clear formatting errors.

## Output Format
```text
---
[ISO_TIMESTAMP] role=user
<raw user message — preserved verbatim, typos and all>

SESSION CONTEXT:
- Current task/topic being worked on
- Which agents/skills are active (if any)
- What phase of work we are in (planning, building, reviewing, etc.)

USER INTENT:
- Bullet-pointed analysis of what the user is asking for
- Break down compound requests into individual action items
- Clarify ambiguous phrasing into concrete requirements
- Note any implicit requirements the user may not have stated explicitly

REFERENCE FILES:
- List any files, paths, or URLs the user mentioned or referenced
- Include both explicit references ("see file X") and contextual ones

KEY DECISIONS:
- Any decisions the user made or preferences they expressed
- Options they chose, rejected, or deferred
- Constraints or requirements they added

AGENT REPORT:
  Initial Response:
  - Summary of the agent's initial plan/approach communicated to the user
  - Key commitments made (what the agent said it would do)
  - Any questions asked or clarifications requested

  Final Response:
  - Summary of the completion report delivered to the user
  - Files created/modified with counts
  - Systems affected
  - Sync status
  - Pending items flagged
  - (Leave blank if work is still in progress)

---
```

## Section Rules

### Raw Message
- Always preserve the user's message exactly as typed, including typos and formatting.

### SESSION CONTEXT
- Summarize the current session state.
- Note active agents, skills, or orchestration phases.

### USER INTENT
- This is the MOST IMPORTANT section — translates natural language into structured requirements.
- Each bullet should be a single, actionable item using imperative phrasing.
- If the user's message contains multiple requests, number them.
- Include implicit requirements (e.g., responsive design, cross-browser compatibility).

### REFERENCE FILES
- List every file path, directory, URL, or asset the user mentioned.
- If they reference something by description, resolve to actual paths.

### KEY DECISIONS
- Only include if the user made decisions or expressed preferences.
- If the message is purely a request, write: "None — request only."

### AGENT REPORT
- This section captures what the agent communicated back to the user, turning the log into a full conversation record.
- **Initial Response**: Filled when the agent first responds with a plan or approach.
  - Capture planned steps, key commitments, and any clarifying questions asked.
  - If the agent asked clarifying questions, list them explicitly.
- **Final Response**: Filled when the agent delivers its completion report.
  - Include: files created/modified (with counts), systems affected, sync status, pending items flagged.
  - Leave blank if work is still in progress; fill in the next entry when work completes.
- If the user message does not trigger agent work (e.g., simple questions, confirmations like "yes" or "looks good"), write: "No agent work — conversational response only."
- Keep summaries concise but capture the substance of what was communicated.

## Skill Reference
Full workflow details: `.claude/skills/chat-history-convention/SKILL.md`
