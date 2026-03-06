# Subagent Spawning

## Overview

The orchestrator session delegates each phase to an isolated subagent. Spawning is
mediated by a queue file and a PowerShell hook script that invokes `claude exec`.
This architecture keeps each phase in a fresh context window while the orchestrator
maintains session continuity.

## Spawning Architecture

```
  Orchestrator Chat
       |
       | 1. Writes next_phase.json
       v
  .claude/orchestration/queue/next_phase.json
       |
       | 2. Hook script reads queue
       v
  orchestrator-poke.ps1
       |
       | 3. Runs claude exec with prompt
       v
  New Claude Subagent
       |
       | 4. Executes phase work
       v
  Poke Back (structured report)
       |
       | 5. Returns to orchestrator
       v
  Orchestrator processes poke
```

## Queue File Format

The queue file is written to `.claude/orchestration/queue/next_phase.json`:

```json
{
  "phase": 3,
  "prompt": "Execute phase 3: implement user profile CRUD operations...",
  "agent": "longrunning-worker-subagent",
  "autoSpawn": true,
  "dryRun": false,
  "sessionDir": "orchestration/current",
  "timestamp": "2025-02-28T12:00:00Z"
}
```

### Field Reference

| Field        | Type    | Required | Description                                         |
|--------------|---------|----------|-----------------------------------------------------|
| `phase`      | number  | yes      | Phase number being dispatched                       |
| `prompt`     | string  | yes      | Full prompt for the subagent                        |
| `agent`      | string  | no       | Agent name; hook prefixes prompt with agent path    |
| `autoSpawn`  | boolean | yes      | If true, hook spawns subagent immediately           |
| `dryRun`     | boolean | yes      | If true, hook logs but does not execute             |
| `sessionDir` | string  | no       | Path to orchestration session directory             |
| `timestamp`  | string  | no       | ISO 8601 timestamp of queue write                   |

## Hook Mechanism

### orchestrator-poke.ps1

The PowerShell hook script performs these steps:

1. **Read** the queue file from `.claude/orchestration/queue/next_phase.json`.
2. **Check** the `autoSpawn` and `dryRun` flags.
3. **Build** the `claude exec` command:
   - If `agent` is set, prefix the prompt with the agent file path
     (e.g., `--agent .claude/agents/longrunning-worker-subagent/AGENT.md`).
   - Pass the full `prompt` field as the exec argument.
4. **Execute** `claude exec` to spawn a new subagent session.
5. **Move** the queue file to `queue/history/` with a timestamped filename.
6. **Log** the spawn event for audit.

### Invocation

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/scripts/orchestrator-poke.ps1
```

This command is typically run by the orchestrator after writing the queue file, or
triggered automatically via a PostToolUse hook.

## Poke-Back Requirements

After completing a phase, the subagent must return a structured "poke" to the
orchestrator containing exactly these fields:

```
+---------------------------+
|        Poke Report        |
+---------------------------+
| 1. Completed tasks        |
|    - Task descriptions    |
|    - Pass/fail status     |
+---------------------------+
| 2. Files changed          |
|    - Tree snippet of      |
|      new/modified files   |
+---------------------------+
| 3. Validation results     |
|    - Test outcomes         |
|    - Screenshot status    |
+---------------------------+
| 4. Commit confirmation    |
|    - Commit hash          |
|    - Push status          |
+---------------------------+
| 5. Next-phase readiness   |
|    - Ready / blocked      |
|    - Blockers (if any)    |
+---------------------------+
```

### Poke Template

A poke template is available at:
`.claude/skills/orchestrator-session/templates/poke_template.md`

### Poke Processing

When the orchestrator receives a poke:

1. **Parse** the completed tasks and validation results.
2. **Update** the primary task list with phase status.
3. **Review** the previous phase review file.
4. **Prepare** the next phase plan.
5. **Write** the next queue file if more phases remain.
6. **Spawn** the next subagent via the hook.

## Agent Prefixing

When the `agent` field is set in the queue file, the hook script prepends the
agent file path to the `claude exec` invocation. This loads the agent's YAML
frontmatter (model, permissions, tools, skills) into the subagent context.

| Queue `agent` value     | Resolved agent path                                 |
|-------------------------|-----------------------------------------------------|
| `longrunning-worker-subagent`     | `.claude/agents/longrunning-worker-subagent/AGENT.md`         |
| `longrunning-orchestrator-agent`    | `.claude/agents/longrunning-orchestrator-agent/AGENT.md`        |
| `research-docs-agent`   | `.claude/agents/research-docs-agent/AGENT.md`       |

## Error Handling

- If the queue file is missing or malformed, the hook logs an error and exits.
- If `dryRun` is `true`, the hook logs the would-be command but does not execute.
- If `claude exec` fails, the queue file remains in `queue/` (not moved to history)
  so it can be retried.
- The orchestrator should check for stale queue files on session start.

## Security

- Queue files should not contain secrets or credentials.
- The hook runs with the caller's permissions; no privilege escalation occurs.
- Agent paths are validated against the `.claude/agents/` directory.
