# Orchestrator Loop Reference

This pattern mirrors a multi-agent loop used in other IDE copilots (e.g., Claude Code).
The key idea is to have a persistent orchestrator that spins up a fresh subagent per phase
and requires a structured "poke" back after completion. The "Ralph" loop pattern is a
related approach that emphasizes tight scope, short-lived workers, and explicit handoffs.

Key requirements:
- Each phase has its own subagent.
- The subagent finishes with a structured report and commit/push.
- The orchestrator immediately starts the next phase with a new subagent.

Sources:
- https://github.com/snarktank/ralph
- https://github.com/vercel-labs/ralph-loop-agent
- https://github.com/mikeyobrien/ralph-orchestrator
- https://github.com/frankbria/ralph-claude-code
