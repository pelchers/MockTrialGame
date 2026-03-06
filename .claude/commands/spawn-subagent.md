---
name: spawn-subagent
description: Queue and spawn the next phase subagent via orchestrator hook.
invocable: true
---

# Spawn Subagent (Orchestrator)

Queue the next phase subagent by creating `.claude/orchestration/queue/next_phase.json` and then
invoke the orchestrator poke hook.

## Steps
1) Copy `.claude/orchestration/queue/next_phase.template.json` to `next_phase.json`.
2) Edit `next_phase.json` with session, phase, prompt, and agent.
3) Set `autoSpawn: true` to allow the hook to spawn.
4) Run:
   - `powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/scripts/orchestrator-poke.ps1`

## Notes
- Set `dryRun: true` to print the command without launching the subagent.
- If `agent` is set, the hook prefixes the prompt with the agent file path.
- The queue file will be moved to `.claude/orchestration/history/` after each run.
