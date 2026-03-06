---
name: chat-history-convention
description: Append every user message to .chat-history/user-messages.log with timestamp, role, raw message body, and structured USER INTENT analysis for project-local chat continuity.
---

# Chat History Convention

Use this skill whenever the user asks for message logging, session continuity, or project-local chat transcripts.

## Workflow
1. Ensure `.chat-history/` exists at repo root.
2. Ensure `.chat-history/user-messages.log` exists.
3. Append each incoming user message with the **full entry format** below.
4. Separate entries with `---`.

## Entry Format

Every log entry MUST include ALL of the following sections:

```text
---
[TIMESTAMP] role=user
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
- Always preserve the user's message exactly as typed, including typos and formatting
- Do not edit, clean up, or paraphrase the raw message

### SESSION CONTEXT
- Summarize what's currently happening in the session
- Include active session ID if one exists
- Note the general phase: ideation, planning, building, reviewing, debugging, etc.

### USER INTENT
- This is the MOST IMPORTANT section — it translates the user's natural language into structured requirements
- Each bullet should be a single, actionable item
- Use imperative phrasing: "Create X", "Fix Y", "Update Z to include..."
- If the user's message contains multiple requests, number them
- If the user references prior context ("do what we discussed"), expand it into explicit requirements
- Include implicit requirements (e.g., if user says "make a website", implicit requirements include responsive design, cross-browser compatibility, etc.)

### REFERENCE FILES
- List every file path, directory, URL, or asset the user mentioned
- If they reference something by description ("the globe designs I liked"), resolve it to actual paths
- Format: `path/to/file` — brief description of what it is

### KEY DECISIONS
- Only include if the user made decisions, expressed preferences, or set constraints
- If the user's message is purely a request with no decisions, write: "None — request only."
- Track decision evolution: if a user changes their mind, note what changed

### AGENT REPORT
- This section turns the log from a user-only transcript into a full conversation record
- **Initial Response** is filled when the agent first responds with a plan or approach
  - Capture the substance of what the agent communicated: planned steps, commitments, questions asked
  - If the agent asked clarifying questions, list them here
- **Final Response** is filled when the agent delivers its completion report
  - Include: files created/modified (with counts), systems affected, sync status, pending items
  - If work is still in progress, leave Final Response blank and fill it in the next entry
- If the user message doesn't trigger agent work (e.g., simple questions, confirmations, "yes", "looks good"), write: "No agent work — conversational response only."
- Keep summaries concise but capture the substance of what was communicated

## Example Entry

```text
---
[2026-02-25T14:15:00Z] role=user
good also lets diagnose an issue with the chat history convention agent. does it require sectional content under my verbose message such as USER INTENT:
- Modify the subagent and/or skill definitions so that EVERY subagent pass includes a mandatory self-validation loop
- The loop should be: plan → generate → validate (Playwright) → check results → fix issues → re-validate → repeat until satisfactory
- This prevents broken output from being "completed" and handed off to the next pass
- The validation-fix cycle should be built INTO the agent/skill, not done manually after the fact
- This is an agent/skill architecture improvement, not just a one-time fix as the agent understands my message. the formatting is nice to see for all my messages and the agent should know to include this. does it as of now, and if not how could you fix the agent and skill for better archival of chats? and yes. that is a great plan. once you fix the chat agent we can proceed

SESSION CONTEXT:
- Working on general-purpose frontend design agent/skill system
- Portfolio generation (16 passes) approved but paused pending this fix
- Phase: system improvement / skill maintenance

USER INTENT:
1. Diagnose whether the chat-history-convention skill includes structured USER INTENT sections
2. If not, fix the skill to include structured analysis under every raw message
3. The structured sections should include: USER INTENT bullets, context, references
4. This is a prerequisite — fix this before proceeding with portfolio generation
5. User confirmed the portfolio generation plan ("yes. that is a great plan")

REFERENCE FILES:
- `.claude/skills/chat-history-convention/SKILL.md` — the skill being diagnosed
- Example of desired format shown inline (USER INTENT bullet list from a prior session)

KEY DECISIONS:
- Chat history skill MUST include structured analysis sections, not just raw messages
- Portfolio generation is approved but blocked on this fix
- User prefers the verbose format with bullet-pointed intent analysis

AGENT REPORT:
  Initial Response:
  - Agent proposed a two-step plan: (1) diagnose the chat-history-convention skill for missing structured sections, (2) fix the skill and agent definitions to include USER INTENT, SESSION CONTEXT, REFERENCE FILES, and KEY DECISIONS under every entry
  - Committed to updating both `.claude/skills/chat-history-convention/SKILL.md` and `.claude/agents/chat-history-agent/AGENT.md`
  - No clarifying questions — user intent was clear

  Final Response:
  - Updated 2 files: SKILL.md (added structured section requirements, section rules, and example) and AGENT.md (added matching output format and section rules)
  - Systems affected: chat-history-convention skill, chat-history-agent agent
  - Sync status: changes committed
  - Pending items: portfolio generation (16 passes) ready to proceed after this fix

---
```

## Formatting Notes
- Use `---` as the entry separator (three dashes on their own line)
- Timestamps should be ISO 8601 format: `[YYYY-MM-DDTHH:MM:SSZ]`
- Keep USER INTENT bullets concise but complete — each should be independently understandable
- If the user sends a very short message (e.g., "yes", "looks good"), still include all sections but keep them proportionally brief

## Optional Script
Use `scripts/append-user-message.ps1` when shell automation is preferred.
