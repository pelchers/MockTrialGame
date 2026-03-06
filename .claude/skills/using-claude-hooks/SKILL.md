---
name: using-claude-hooks
description: Implement and use Claude Code hooks for automation, validation, and workflow enhancement
category: development-workflow
tags: [hooks, automation, validation, workflow, claude-code]
complexity: intermediate
prerequisites: [basic shell scripting, understanding of event-driven programming]
related_skills: [creating-claude-skills, managing-git-workflows, creating-project-documentation]
version: 1.0.0
---

# Using Claude Code Hooks

## Overview

Claude Code hooks are event-driven automation scripts that execute at specific points in the coding workflow. They enable validation, automation, safety checks, and workflow customization without modifying Claude Code itself.

## When to Use This Skill

Use this skill when you need to:
- **Validate operations** before execution (block dangerous commands)
- **Automate workflows** (format code, run tests, commit changes)
- **Enforce standards** (prevent committing secrets, ensure conventions)
- **Enhance feedback** (show status, display notifications)
- **Create guardrails** (safety checks, permission requirements)
- **Customize behavior** (project-specific automation)

## Quick Start

### Basic Hook Setup

1. **Create settings.json:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Welcome to your project!'"
          }
        ]
      }
    ]
  }
}
```

2. **Test it:**
```bash
# Start Claude Code
claude

# You should see: Welcome to your project!
```

### Pre-Execution Validation

Block dangerous commands:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | grep -qE '^rm\\s+-rf\\s+/' && echo 'BLOCKED' >&2 && exit 2 || exit 0"
          }
        ]
      }
    ]
  }
}
```

### Post-Execution Automation

Auto-format code after editing:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs prettier --write 2>/dev/null"
          }
        ]
      }
    ]
  }
}
```

## Core Concepts

### Hook Types

**1. SessionStart** - Runs when Claude Code starts
- Use for: Welcome messages, environment checks, setup
- Can block: No (informational only)

**2. UserPromptSubmit** - Runs before Claude processes input
- Use for: Input validation, content filtering
- Can block: Yes (exit 2)

**3. PreToolUse** - Runs before tool execution
- Use for: Command validation, safety checks
- Can block: Yes (exit 2)

**4. PostToolUse** - Runs after tool succeeds
- Use for: Auto-formatting, tests, logging
- Can block: No (already executed)

**5. Stop** - Runs when Claude finishes responding
- Use for: Reminders, status updates
- Can block: No (informational only)

**6. SessionEnd** - Runs when session ends
- Use for: Cleanup, final status
- Can block: No (session ending)

**7. Notification** - Runs on notifications
- Use for: Custom notification handling
- Can block: No (already generated)

### Exit Codes

**0 - Success**: Continue normally
```bash
exit 0
```

**1 - Warning**: Show error to user, but continue
```bash
echo "Warning: This might cause issues" >&2
exit 1
```

**2 - Block**: Prevent operation, show error to Claude
```bash
echo "BLOCKED: Cannot execute" >&2
exit 2
```

### Tool Matchers

Filter which tools trigger hooks:

- `"Bash"` - Only bash commands
- `"Edit|Write"` - File modifications
- `"Read"` - File reads
- `"Grep|Glob"` - Search operations
- `""` - All tools (empty string)

### Hook Input

Hooks receive JSON via stdin:

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  }
}
```

Parse with jq:
```bash
COMMAND=$(jq -r '.tool_input.command')
FILE_PATH=$(jq -r '.tool_input.file_path')
```

## Implementation Patterns

### Pattern 1: Safety Validation

**Block dangerous operations:**

```bash
#!/bin/bash
# pre-bash-validator.sh

CMD=$(jq -r '.tool_input.command')

# Block rm -rf from root
if echo "$CMD" | grep -qE '^rm\s+-rf\s+/'; then
  echo "🚫 BLOCKED: Cannot rm -rf from root" >&2
  exit 2
fi

# Block force push to main
if echo "$CMD" | grep -qE 'git\s+push.*--force.*(main|master)'; then
  echo "🚫 BLOCKED: Cannot force push to main/master" >&2
  exit 2
fi

exit 0
```

**settings.json:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/scripts/pre-bash-validator.sh"
          }
        ]
      }
    ]
  }
}
```

### Pattern 2: Sensitive File Protection

**Prevent editing secrets:**

```bash
#!/bin/bash
# block-sensitive-files.sh

FILE_PATH=$(jq -r '.tool_input.file_path')
BASENAME=$(basename "$FILE_PATH")

# Block .env files
if echo "$BASENAME" | grep -qE '^\.env'; then
  echo "🚫 BLOCKED: Cannot edit .env files" >&2
  exit 2
fi

# Block key files
if echo "$FILE_PATH" | grep -qE '\.(key|pem|secret)$'; then
  echo "🚫 BLOCKED: Cannot edit secret files" >&2
  exit 2
fi

exit 0
```

### Pattern 3: Auto-Formatting

**Format code after editing:**

```bash
#!/bin/bash
# post-format-code.sh

FILE_PATH=$(jq -r '.tool_input.file_path')

# TypeScript/JavaScript
if echo "$FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$'; then
  if command -v prettier &> /dev/null; then
    prettier --write "$FILE_PATH" 2>/dev/null
    echo "✨ Formatted: $FILE_PATH"
  fi
fi

# Python
if echo "$FILE_PATH" | grep -qE '\.py$'; then
  if command -v black &> /dev/null; then
    black "$FILE_PATH" 2>/dev/null
    echo "✨ Formatted: $FILE_PATH"
  fi
fi

exit 0
```

### Pattern 4: Test Running

**Run tests after modifications:**

```bash
#!/bin/bash
# post-run-tests.sh

FILE_PATH=$(jq -r '.tool_input.file_path')

# Run tests for test files
if echo "$FILE_PATH" | grep -q 'test'; then
  echo "Running tests..."
  npm test -- "$FILE_PATH" 2>&1 | head -20
fi

# Run related tests for source files
if echo "$FILE_PATH" | grep -q 'src/'; then
  echo "Running related tests..."
  npm test 2>&1 | head -20
fi

exit 0
```

### Pattern 5: Project Info Display

**Show project status at session start:**

```bash
#!/bin/bash
# session-start-setup.sh

echo ""
echo "🚀 Claude Code session started"
echo "📁 $(pwd)"
echo ""

# Git status
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo "🌿 Branch: $(git branch --show-current)"
  UNCOMMITTED=$(git status --porcelain | wc -l)
  if [ "$UNCOMMITTED" -gt 0 ]; then
    echo "📝 $UNCOMMITTED uncommitted changes"
  fi
fi

# Tool versions
echo ""
echo "🔧 Tools:"
[ -x "$(command -v node)" ] && echo "  ✓ Node $(node --version)"
[ -x "$(command -v npm)" ] && echo "  ✓ npm $(npm --version)"

echo ""
```

## Configuration

### Settings File Locations

**1. Project-level** (committed to git):
```
.claude/settings.json
```

**2. User-level** (applies to all projects):
```
~/.claude/settings.json
```

**3. Local overrides** (not committed):
```
.claude/settings.local.json
```

### Settings Structure

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
            "command": ".claude/hooks/scripts/validator.sh"
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
            "command": ".claude/hooks/scripts/format.sh"
          }
        ]
      }
    ]
  }
}
```

### Environment Variables

Use in hook scripts:

```bash
# Claude Code provides:
CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"  # Plugin root directory

# Access project-specific vars:
PROJECT_ROOT="$(pwd)"
```

## Real-World Examples

### Example 1: Complete Project Setup

**`.claude/settings.json`:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/scripts/session-start.sh"
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
            "command": ".claude/hooks/scripts/validate-bash.sh"
          }
        ]
      },
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/scripts/block-sensitive.sh"
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
            "command": ".claude/hooks/scripts/format-code.sh"
          }
        ]
      }
    ],

    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo '\\n📝 Remember to commit your changes\\n'"
          }
        ]
      }
    ]
  }
}
```

### Example 2: Team Conventions Enforcement

**Block non-conventional commits:**

```bash
#!/bin/bash
# validate-commit-msg.sh

MSG=$(jq -r '.tool_input.message')

# Check conventional commits format
if ! echo "$MSG" | grep -qE '^(feat|fix|docs|chore|test|refactor):'; then
  echo "🚫 BLOCKED: Must use conventional commits" >&2
  echo "Format: type: description" >&2
  echo "Types: feat, fix, docs, chore, test, refactor" >&2
  exit 2
fi

exit 0
```

### Example 3: Automatic Testing

**Run tests before git operations:**

```bash
#!/bin/bash
# pre-git-tests.sh

CMD=$(jq -r '.tool_input.command')

# Check if it's a git commit or push
if echo "$CMD" | grep -qE '^git\s+(commit|push)'; then
  echo "Running tests before $CMD..."

  if ! npm test 2>&1; then
    echo "🚫 BLOCKED: Tests must pass before $CMD" >&2
    exit 2
  fi

  echo "✅ Tests passed"
fi

exit 0
```

## Best Practices

### 1. Keep Hooks Fast

Hooks run synchronously - keep them under 1 second:

```bash
# Good - fast check
if echo "$CMD" | grep -q 'pattern'; then
  exit 2
fi

# Bad - slow operation
npm test  # Could take minutes
```

For slow operations, run in background:
```bash
(npm test &)
exit 0
```

### 2. Handle Errors Gracefully

```bash
# Check if command exists
if command -v prettier &> /dev/null; then
  prettier --write "$FILE"
else
  echo "Prettier not installed, skipping format" >&2
fi

exit 0  # Don't block on missing tools
```

### 3. Use Descriptive Messages

```bash
# Good
echo "🚫 BLOCKED: Cannot rm -rf from root directory" >&2
echo "This command could delete critical system files" >&2

# Bad
echo "Error" >&2
```

### 4. Test Thoroughly

```bash
# Test hook manually
echo '{"tool_input":{"command":"rm -rf /"}}' | ./hook-script.sh

# Check exit code
echo $?
```

### 5. Document Your Hooks

```bash
#!/bin/bash
# validate-bash.sh
#
# Validates bash commands before execution
# Blocks: rm -rf /, force push to main
# Exit codes: 0=allow, 2=block
```

### 6. Use Version Control

Commit `.claude/settings.json` (team hooks)
Ignore `.claude/settings.local.json` (personal hooks)

### 7. Layer Your Hooks

```json
{
  "PreToolUse": [
    {"matcher": "Bash", "hooks": [/* validation */]},
    {"matcher": "Bash", "hooks": [/* logging */]},
    {"matcher": "Bash", "hooks": [/* metrics */]}
  ]
}
```

All hooks run in order.

## Troubleshooting

### Hook Not Running

**Check:**
1. Script is executable: `chmod +x script.sh`
2. Shebang is correct: `#!/bin/bash`
3. Path is correct in settings.json
4. Matcher matches tool name

**Debug:**
```bash
# Test script manually
bash -x ./script.sh < test-input.json

# Check Claude Code logs
tail -f ~/.claude/logs/hooks.log
```

### Hook Blocking Unintentionally

**Check:**
1. Exit code (should be 0 for success)
2. Error messages use stderr (`>&2`)
3. Script logic is correct

**Fix:**
```bash
# Add debug output
echo "DEBUG: Command=$CMD" >&2
echo "DEBUG: Exit code will be: $?" >&2
```

### Permission Denied

```bash
# Make executable
chmod +x .claude/hooks/scripts/*.sh

# Check ownership
ls -la .claude/hooks/scripts/
```

## Integration with Other Skills

### With `managing-git-workflows`

Use hooks to enforce git conventions:
- Validate commit messages
- Run tests before push
- Check for secrets

### With `creating-project-documentation`

Use hooks to keep docs updated:
- Generate API docs after code changes
- Update README on version bump
- Create changelog entries

### With `testing-with-playwright`

Use hooks for test automation:
- Run tests after code changes
- Generate test reports
- Update coverage badges

## Resources

- [CLAUDE-HOOKS-GUIDE.md](../../../CLAUDE-HOOKS-GUIDE.md) - Comprehensive hooks guide
- [Official Hooks Documentation](https://code.claude.com/docs/en/hooks)
- [Hook Examples](https://github.com/anthropics/claude-code/tree/main/examples/hooks)
- `.claude/hooks/scripts/` - Pre-written hook scripts
- `.claude/hooks/scripts/README.md` - Hook scripts documentation

## Common Workflows

### Workflow 1: Set Up Basic Hooks

1. Create `.claude/settings.json`
2. Add SessionStart hook for welcome message
3. Add PreToolUse hook for bash validation
4. Test by starting Claude Code

### Workflow 2: Add Auto-Formatting

1. Create `.claude/hooks/scripts/format.sh`
2. Add PostToolUse hook for Edit|Write
3. Install formatters (prettier, black)
4. Test by editing a file

### Workflow 3: Enforce Team Conventions

1. Define team conventions
2. Create validation hooks
3. Add to `.claude/settings.json`
4. Commit and share with team
5. Test enforcement

## Advanced Topics

### HTTP Hooks

Call external services:

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

### Conditional Hooks

Run hooks based on conditions:

```bash
#!/bin/bash

# Only run in production
if [ "$NODE_ENV" == "production" ]; then
  # Stricter checks
  exit 2
fi

exit 0
```

### Hook Chaining

Multiple hooks run sequentially:

```json
{
  "PreToolUse": [
    {"hooks": [{"command": "validate.sh"}]},
    {"hooks": [{"command": "log.sh"}]},
    {"hooks": [{"command": "metrics.sh"}]}
  ]
}
```

## Summary

Claude Code hooks enable powerful automation and safety guardrails:

**Key Takeaways:**
1. 7 hook types for different lifecycle events
2. Exit codes control behavior (0=allow, 2=block)
3. Use matchers to filter which tools trigger hooks
4. Parse input with jq, output errors to stderr
5. Keep hooks fast and handle errors gracefully
6. Version control team hooks, ignore personal overrides

**Quick Wins:**
- Add bash validation to prevent dangerous commands
- Auto-format code after editing
- Block editing of .env files
- Show git status at session start
- Remind to commit before ending session

For comprehensive documentation, see `CLAUDE-HOOKS-GUIDE.md` in the project root.

