#!/bin/bash
# Pre-execution bash command validator
# Blocks dangerous commands and suggests better alternatives
# Exit codes: 0 = allow, 1 = warn, 2 = block

# Read the command from tool input JSON
CMD=$(jq -r '.tool_input.command')

# Block dangerous rm -rf from root
if echo "$CMD" | grep -qE '^rm\s+-rf\s+/'; then
  echo "BLOCKED: Cannot execute 'rm -rf /' from root directory" >&2
  echo "This command could delete critical system files." >&2
  exit 2
fi

# Block force push to main/master
if echo "$CMD" | grep -qE 'git\s+push.*--force.*(main|master)'; then
  echo "BLOCKED: Cannot force push to main/master branch" >&2
  echo "Use 'git push --force-with-lease' or push to a feature branch instead." >&2
  exit 2
fi

# Warn about using grep/find instead of rg/fd
if echo "$CMD" | grep -qE '^\s*(grep|find)\b'; then
  echo "TIP: Consider using modern alternatives:" >&2
  echo "  - Use 'rg' (ripgrep) instead of 'grep' for faster searching" >&2
  echo "  - Use 'fd' instead of 'find' for easier file finding" >&2
  # Don't block, just warn (exit 0)
fi

# Warn about large operations without confirmation
if echo "$CMD" | grep -qE 'rm\s+-rf.*\*'; then
  echo "WARNING: Recursive deletion with wildcards" >&2
  echo "Make sure you're in the correct directory!" >&2
fi

# All checks passed or warnings only
exit 0
