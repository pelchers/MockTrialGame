# Hooks System

## Overview

Claude Code hooks are event-driven automation scripts that execute at specific points
in the coding workflow. They enable validation, automation, safety checks, and workflow
customization without modifying Claude Code itself.

## Hook Types

| # | Type               | When It Fires                     | Can Block? | Typical Use                       |
|---|--------------------|-----------------------------------|------------|-----------------------------------|
| 1 | `SessionStart`     | Claude Code session begins        | No         | Welcome messages, env checks      |
| 2 | `UserPromptSubmit` | Before Claude processes user input| Yes        | Input validation, content filter  |
| 3 | `PreToolUse`       | Before a tool executes            | Yes        | Command validation, safety checks |
| 4 | `PostToolUse`      | After a tool succeeds             | No         | Auto-format, tests, logging       |
| 5 | `Stop`             | Claude finishes responding        | No         | Reminders, status updates         |
| 6 | `SessionEnd`       | Session ends                      | No         | Cleanup, final status             |
| 7 | `Notification`     | On notification events            | No         | Custom notification handling      |

### Blocking vs Non-Blocking

Only `UserPromptSubmit` and `PreToolUse` can block operations (via exit code 2).
All other hook types are informational -- they run but cannot prevent the action.

## Exit Codes

| Code | Meaning  | Behavior                                            |
|------|----------|-----------------------------------------------------|
| 0    | Success  | Continue normally, no interruption                  |
| 1    | Warning  | Show error message to user, but continue execution  |
| 2    | Block    | Prevent the operation, show error message to Claude  |

### Usage Examples

```bash
# Allow operation
exit 0

# Warn but continue
echo "Warning: This might cause issues" >&2
exit 1

# Block operation
echo "BLOCKED: Cannot execute this command" >&2
exit 2
```

## Matchers

Matchers filter which tools trigger a hook. They are specified as a string in the
hook configuration:

| Matcher          | Triggers On                    |
|------------------|--------------------------------|
| `"Bash"`         | Bash commands only             |
| `"Edit\|Write"`  | File modifications             |
| `"Read"`         | File reads                     |
| `"Grep\|Glob"`   | Search operations              |
| `""`             | All tools (empty string)       |

Matchers use pipe `|` for OR logic. Multiple matchers can be defined as separate
entries in the hook array.

## Hook Input

Hooks receive JSON via stdin describing the tool invocation:

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  }
}
```

Parse with `jq`:

```bash
COMMAND=$(jq -r '.tool_input.command')
FILE_PATH=$(jq -r '.tool_input.file_path')
```

## Settings Configuration

### File Locations

| Level         | Path                         | Scope                    | Committed |
|---------------|------------------------------|--------------------------|-----------|
| Project       | `.codex/settings.json`      | All users of this repo   | Yes       |
| User          | `~/.codex/settings.json`    | All projects for user    | N/A       |
| Local override| `.codex/settings.local.json`| This repo, this user only| No        |

### Structure

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "path/to/script.sh",
            "description": "Optional description"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".codex/hooks/scripts/validator.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": ".codex/hooks/scripts/format.sh"
          }
        ]
      }
    ]
  }
}
```

## Implementation Patterns

### Pattern 1: Safety Validation (PreToolUse)

Block dangerous bash commands before they execute:

```bash
#!/bin/bash
CMD=$(jq -r '.tool_input.command')

if echo "$CMD" | grep -qE '^rm\s+-rf\s+/'; then
  echo "BLOCKED: Cannot rm -rf from root" >&2
  exit 2
fi

if echo "$CMD" | grep -qE 'git\s+push.*--force.*(main|master)'; then
  echo "BLOCKED: Cannot force push to main/master" >&2
  exit 2
fi

exit 0
```

### Pattern 2: Sensitive File Protection (PreToolUse)

Prevent editing secrets and credential files:

```bash
#!/bin/bash
FILE_PATH=$(jq -r '.tool_input.file_path')
BASENAME=$(basename "$FILE_PATH")

if echo "$BASENAME" | grep -qE '^\.env'; then
  echo "BLOCKED: Cannot edit .env files" >&2
  exit 2
fi

if echo "$FILE_PATH" | grep -qE '\.(key|pem|secret)$'; then
  echo "BLOCKED: Cannot edit secret files" >&2
  exit 2
fi

exit 0
```

### Pattern 3: Auto-Formatting (PostToolUse)

Format code automatically after file edits:

```bash
#!/bin/bash
FILE_PATH=$(jq -r '.tool_input.file_path')

if echo "$FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$'; then
  command -v prettier &>/dev/null && prettier --write "$FILE_PATH" 2>/dev/null
fi

if echo "$FILE_PATH" | grep -qE '\.py$'; then
  command -v black &>/dev/null && black "$FILE_PATH" 2>/dev/null
fi

exit 0
```

### Pattern 4: Session Info (SessionStart)

Display project status when a session begins:

```bash
#!/bin/bash
echo "Project: $(basename $(pwd))"
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Branch: $(git branch --show-current)"
  echo "Uncommitted: $(git status --porcelain | wc -l) files"
fi
exit 0
```

### Pattern 5: Commit Convention Enforcement (PreToolUse)

Validate commit messages follow conventional format:

```bash
#!/bin/bash
MSG=$(jq -r '.tool_input.message')
if ! echo "$MSG" | grep -qE '^(feat|fix|docs|chore|test|refactor|perf|style):'; then
  echo "BLOCKED: Must use conventional commits format" >&2
  echo "Types: feat, fix, docs, chore, test, refactor, perf, style" >&2
  exit 2
fi
exit 0
```

## Best Practices

| Practice                    | Rationale                                          |
|-----------------------------|----------------------------------------------------|
| Keep hooks fast (<1 second) | Hooks run synchronously and block the workflow     |
| Handle missing tools        | Check `command -v` before invoking formatters      |
| Use descriptive messages    | Clear error messages help users understand blocks  |
| Test manually first         | Pipe test JSON into the script to verify behavior  |
| Document hook scripts       | Add a header comment explaining purpose + exit codes|
| Commit project hooks        | `.codex/settings.json` goes in version control   |
| Ignore personal hooks       | `.codex/settings.local.json` stays out of git    |
| Layer hooks sequentially    | Multiple hooks on same event run in order          |

## Hook Chaining

Multiple hooks on the same event run sequentially:

```json
{
  "PreToolUse": [
    {"matcher": "Bash", "hooks": [{"type": "command", "command": "validate.sh"}]},
    {"matcher": "Bash", "hooks": [{"type": "command", "command": "log.sh"}]},
    {"matcher": "Bash", "hooks": [{"type": "command", "command": "metrics.sh"}]}
  ]
}
```

If any hook exits with code 2, the operation is blocked and subsequent hooks do not run.

## HTTP Hooks

Call external services instead of running local scripts:

```json
{
  "type": "http",
  "url": "https://api.example.com/webhook",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer ${TOKEN}"
  }
}
```

## Troubleshooting

### Hook Not Running

1. Verify script is executable: `chmod +x script.sh`
2. Check shebang line: `#!/bin/bash`
3. Verify path in settings.json is correct (relative to project root).
4. Confirm matcher matches the tool name exactly.

### Hook Blocking Unintentionally

1. Check exit code logic -- ensure success path returns 0.
2. Verify error messages go to stderr (`>&2`).
3. Add debug output: `echo "DEBUG: CMD=$CMD" >&2`

### Permission Denied

```bash
chmod +x .codex/hooks/scripts/*.sh
ls -la .codex/hooks/scripts/
```

## Integration Points

- **With managing-git-workflows**: Enforce commit message format, run tests pre-push.
- **With creating-project-documentation**: Auto-generate docs on code changes.
- **With testing-with-playwright**: Run tests after code modifications.
- **With orchestrator-session**: The orchestrator poke hook uses the same mechanism.
