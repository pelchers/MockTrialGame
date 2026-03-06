# Orchestration Queue

Copy `next_phase.template.json` to `next_phase.json` in this directory to trigger a subagent spawn.

The `orchestrator-poke.ps1` hook will read the file and run `codex exec` with the
provided prompt. If `agent` is set, the hook prefixes the prompt with the agent file path.
Completed queue items are moved to `.codex/orchestration/history/`.

Example:
```
{
  "session": "<SESSION_KEY>",
  "phase": "phase_<N>",
  "agent": "longrunning-worker-subagent",
  "workdir": "",
  "fullAuto": true,
  "autoSpawn": true,
  "dryRun": false,
  "prompt": "Complete phase <N> of <SESSION_KEY> using longrunning-session workflow."
}
```

Note: When `workdir` is empty, `orchestrator-poke.ps1` defaults to the repo root (derived from its own script location).
