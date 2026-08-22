---
name: chat-history-convention
description: Append every user message to .chat-history/user-messages.md with timestamp, role, raw message body, a MANDATORY VERBATIM USER PROMPT(S) block storing each user message exactly as typed, a MANDATORY VERBATIM AGENT REPLY(S) block storing the agent's substantive chat reply so it survives cross-device handoff, and structured USER INTENT analysis for project-local chat continuity (all recoverable from the session transcript JSONL).
---

# Chat History Convention

Use this skill whenever the user asks for message logging, session continuity, or project-local chat transcripts.

## Storage model — device-branched (multi-device, 0-loss)

Chat history is a **device-branched append-log**. Each machine appends ONLY to its own segment file
`.chat-history/user-messages.<device>.md` (its "branch"); the human/AI-facing
`.chat-history/user-messages.md` is a **derived merged view**, regenerated deterministically
(chronological, deduped, carrying BOTH devices' entries). Writes are physically disjoint per device, so a
`git pull`/merge never conflicts and never loses an entry. You still **read** the single
`user-messages.md` as always — the segments are write-side plumbing.

- **Append:** `scripts/append-user-message.ps1` resolves this device from `device.local.md`, writes the
  entry to `user-messages.<device>.md`, and regenerates `user-messages.md` (via `branched-log-merge.py`).
  Do **NOT** hand-append to `user-messages.md` — it is regenerated and a direct edit would be overwritten.
- **Merge/pull:** the `post-merge` hook auto-runs `branched-logs.sh merge-all`; `/pickup` runs
  `branched-logs.sh absorb-all <other-device> origin/main` to pull the other device's entries in. The logs
  **ALWAYS union both devices (0 loss)** regardless of the code-merge mode (`both`/`theirs`/`ours`).
- Each entry carries a hidden `<!-- ENTRY ts=… device=… id=… -->` marker (invisible when rendered) for
  deterministic sort + content-hash dedup. Same mechanism protects `HANDOFF.md`; `component-sync-log.md`
  (a table/prose ledger) uses `merge=union`. Engine + success metrics: `.codex/system_docs/branched_logs/`.

## Workflow
1. Ensure `.chat-history/` exists at repo root.
2. Ensure `.chat-history/user-messages.md` exists.
3. Resolve the current authoring agent (`codex` or `claude`) and the current most recent commit
   (`git rev-parse --short HEAD` + `git log -1 --pretty=%s`).
4. Append each incoming user message with the **full entry format** below.
5. Separate entries with `---`.

## Entry Format

Every log entry MUST include ALL of the following sections:

```text
---
[TIMESTAMP] role=user
Authored by: codex | claude
Most recent commit: <short-hash> (<commit subject>)

<raw user message — preserved verbatim, typos and all>

VERBATIM USER PROMPT(S):            # MANDATORY — see Section Rules (recover from transcript JSONL if missed)
(a fenced code block — opened/closed with triple backticks — holding EACH raw user message this
 entry covers, EXACTLY as typed: unedited, typos/casing/punctuation/whitespace/pasted-noise preserved)
[1] (<ISO-timestamp>) <verbatim user message 1 — raw, unedited>
[2] (<ISO-timestamp>) <verbatim user message 2 — raw, unedited, if the entry batches several>

VERBATIM AGENT REPLY(S):            # MANDATORY (added 2026-08-18) — the agent's substantive chat reply(ies)
(a fenced code block holding the agent's DELIVERED chat prose for this entry — the actual text the user
 saw, near-verbatim; recover from the transcript JSONL assistant turns if not captured live. This is the
 content that must survive a device handoff, e.g. a model-effectiveness comparison the next agent needs.)
[reply to 1] <the agent's substantive reply — numbers, tables, links, determinations preserved intact>

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

### VERBATIM USER PROMPT(S) — MANDATORY (required on EVERY entry)
- Every entry MUST include a **VERBATIM USER PROMPT(S)** block that stores the EXACT raw text of each
  user message the entry covers — unedited, with typos, casing, punctuation, line breaks, and any pasted
  noise preserved. This is REQUIRED in **addition** to the `USER MESSAGES` / `USER INTENT` /
  `KEY DECISIONS` / `AGENT REPORT` sections. Those sections may summarize, number, or paraphrase; the
  VERBATIM block NEVER does — it is the exact source-of-truth transcript of what the user typed.
- Put the raw messages inside a fenced code block so whitespace/formatting survives intact. One numbered
  item per user message, in chronological order, each prefixed with its ISO-8601 timestamp:

  ```text
  [1] (2026-08-13T16:10:06Z) come back to that info above - we will readress it ... (verbatim, typos and all)
  [2] (2026-08-13T16:16:09Z) make sure that table is somewhere in the features user documentation ...
  ```

- ⛔ **EXCLUSIONS — the ONLY permitted deviations from verbatim** (added 2026-08-17). Omit the content and
  leave a one-line marker in its place; never reproduce it:
  - **Accidental / mis-pasted content** the user flags as a paste bug or asks to exclude
    → `[1] (ts) [excluded — accidental paste, per user]`
  - **Third-party PII** — a real person's name + personal details who is NOT the user (job candidates,
    customers, employees: contact info, pay, interview notes, health, addresses)
    → `[2] (ts) [excluded — third-party PII]`
  - **Secrets** — API keys, tokens, passwords, connection strings → `[3] (ts) [redacted — secret]`
  These files are **committed and synced across repos**, so anything captured here is permanent and shared.
  When in doubt, exclude and note it. Everything else stays byte-exact.
- **Source of truth = the raw prompt as the user typed it.** When logging live, pass the message through
  UNCHANGED (the `append-user-message.ps1` `$Message` arg is already stored verbatim — do NOT
  pre-summarize it before handing it over).
- **If the live hook did NOT capture it** (e.g. an entry was written with only paraphrased snippets, or a
  batched winddown entry), RECOVER the verbatim text from the session transcript JSONL at
  `~/.claude/projects/<project-slug>/<session-id>.jsonl`. Each genuine user turn is a line with
  `"type":"user"` + `message.role == "user"` whose `content` is a plain string (or a `text` block).
  EXCLUDE: `tool_result` blocks; `<system-reminder>` / `<command-*>` / `<local-command-*>` /
  `<task-notification>` wrappers; the compaction "This session is being continued…" summary; and the
  auto-generated `[Request interrupted by user]` / `Continue from where you left off.` control markers
  (these are not user words). `promptSource` `typed`/`queued` marks user-originated turns.
- Redact only secret VALUES (keys/tokens) — replace with a `‹redacted: shape/location›` note and keep
  everything else verbatim.

### VERBATIM AGENT REPLY(S) — MANDATORY (added 2026-08-18; required on EVERY entry that got a substantive reply)
- Every entry MUST also capture the agent's **substantive chat reply(ies)** — the actual prose delivered to
  the user — NOT only the paraphrased `AGENT REPORT`. **Why this exists:** a summarized report LOSES the
  content a cross-device pickup needs. When the user switched devices, the prior agent's model-effectiveness
  comparison had only been said in chat (never written here), so the next agent could not see it and the user
  could not reassess it. The reply text itself must travel with the log.
- Put the reply in a fenced code block, **near-verbatim** — light trimming of pure tool-call chatter is fine,
  but the SUBSTANCE (numbers, tables, links, determinations, recommendations, comparisons) is preserved
  intact. One block per user message the entry answers.
- **If not captured live, RECOVER from the transcript JSONL:** assistant turns are lines with
  `"type":"assistant"` whose `message.content` holds `text` blocks — concatenate the text blocks of the
  final substantive reply for that turn; exclude `tool_use`/`tool_result` plumbing.
- This is REQUIRED in addition to `AGENT REPORT` (which stays a concise plan/completion summary). The
  autonomous-report-log complements it, but the KEY user-facing replies (comparisons, determinations,
  answers to direct questions) MUST land here too.

### Authorship + Commit Metadata
- Every entry MUST include `Authored by: codex` or `Authored by: claude` immediately under the
  `[TIMESTAMP] role=user` line.
- Every entry MUST include `Most recent commit: <short-hash> (<commit subject>)` immediately under
  the authored-by line.
- Resolve the commit from the repo at logging time. If git is unavailable, write
  `Most recent commit: unavailable (<reason>)`.
- These fields are mandatory for posterity and for reconstructing which AI surface authored a log
  entry after cross-tool handoffs.

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
- The first two metadata lines after the timestamp are mandatory:
  `Authored by: <codex|claude>` and `Most recent commit: <short-hash> (<subject>)`
- Every entry MUST carry a **VERBATIM USER PROMPT(S)** fenced block holding the exact raw text of each
  user message it covers (see Section Rules). If the live hook did not capture it, recover the verbatim
  text from the session transcript JSONL — never leave an entry with only paraphrased snippets.
- Keep USER INTENT bullets concise but complete — each should be independently understandable
- If the user sends a very short message (e.g., "yes", "looks good"), still include all sections but keep them proportionally brief

## Autonomous Run Report Log (required during long autonomous runs)

During a **long / autonomous agent run** — multi-hour, self-directed work where the operator sets a
mandate up front and interjects intermittently — the agent MUST maintain a live, timestamped
**autonomous run report log** at `.chat-history/autonomous-report-log.md`, alongside `user-messages.md`.
It is the operational narrative of the run (what happened, when, findings, decisions) and complements the
structured per-message transcript.

**When it's required:** any run the operator frames as "proceed autonomously", "document as you go", a
multi-phase build to a deadline, or similar standing mandate. Skip it for ordinary interactive turns.

**File rules (append-only — operator requirement):**
1. **Document as you go, timestamped.** Every entry opens with `### YYYY-MM-DD HH:MM · <short title>`.
   Log meaningful steps/findings AS THEY HAPPEN, not in bulk afterward.
2. **Note agent + branch on every entry:** `Agent: <claude|codex> · Branch: <working-lane>` (the device
   working lane resolved from `device.local.md`).
3. **Interject user prompts verbatim.** When the operator sends a prompt mid-run, append it under a
   `### YYYY-MM-DD HH:MM · 👤 USER PROMPT` heading (quoted exactly), then the agent's actions/response below it.
4. **Append-only.** Never rewrite past entries; correct via a new dated entry.

**Relationship to `user-messages.md`:** a mid-run operator prompt is recorded in BOTH — verbatim under a
`👤 USER PROMPT` heading in the report log (for the run narrative), and as a full structured entry in
`user-messages.md` (for the durable transcript). The report log is per-run and operational;
`user-messages.md` is the cross-session record. The report log is **project data, not a reusable
component** — it is NOT cross-repo synced (only this convention's rules are).

## Optional Script
Use `scripts/append-user-message.ps1` when shell automation is preferred.
