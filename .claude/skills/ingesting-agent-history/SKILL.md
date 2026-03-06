---
name: ingesting-agent-history
description: Creates agent ingest summaries in .adr/agent_ingest after chat history clears/compacts. Use when closing or resetting a session to preserve context, app state, and next steps.
---

# Ingesting Agent History

Creates a timestamped session summary file in `.adr/agent_ingest/` whenever a chat is cleared or compacted.

## When to Use

- End of a long session.
- Before clearing/compacting memory.
- Before handing off to a new agent.

## Output Requirements

1. **Create a new ingest file** in `.adr/agent_ingest/` using the template:
   - Template: `.claude/templates/agent-ingest/agent-ingest-entry.md`
2. **File naming**: `ingest_YYYY-MM-DD_HHMM_<short-commit>.md`
3. **Fill all placeholders** with current state:
   - Branch, commit, ADR phase, app state, last user request/response.
4. **Keep it concise but specific** so the next agent can resume without guesswork.

## Minimum Content Checklist

- Timestamp, branch, commit.
- Last user request + last assistant response (short paraphrases).
- App state (frontend/Convex/containers) and seed status.
- Known issues or risks.
- Key files touched.
- Next 1-3 steps.

## Resources

- Template: `.claude/templates/agent-ingest/agent-ingest-entry.md`
