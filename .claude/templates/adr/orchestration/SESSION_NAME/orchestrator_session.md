# Orchestrator Session Template

Session: SESSION_NAME
Date: YYYY-MM-DD

## Phase handoff rules
- Each phase uses a fresh subagent.
- Each phase ends with a structured poke back to the orchestrator.

## Required artifacts per phase
- Phase plan in current
- Phase review in history
- Task list phase checkoff
- Commit + push
