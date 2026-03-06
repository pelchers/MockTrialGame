#!/bin/bash
# Block editing of sensitive files
# Prevents accidental modification of environment files, secrets, and keys
# Exit codes: 0 = allow, 2 = block

# Read the file path from tool input JSON
FILE_PATH=$(jq -r '.tool_input.file_path')

# Extract basename for pattern matching
BASENAME=$(basename "$FILE_PATH")

# Block environment files
if echo "$BASENAME" | grep -qE '^\.env'; then
  echo "🚫 BLOCKED: Cannot edit environment file: $FILE_PATH" >&2
  echo "Environment files contain sensitive configuration." >&2
  echo "To modify: Edit manually outside Claude Code or use /allow-sensitive" >&2
  exit 2
fi

# Block secret files
if echo "$FILE_PATH" | grep -qE '\.(secret|key|pem|p12|pfx|crt|cer)$'; then
  echo "🚫 BLOCKED: Cannot edit sensitive file: $FILE_PATH" >&2
  echo "This file may contain secrets or private keys." >&2
  exit 2
fi

# Block credential files
if echo "$BASENAME" | grep -qE '^(credentials|secrets|auth|token)'; then
  echo "🚫 BLOCKED: Cannot edit credential file: $FILE_PATH" >&2
  echo "This file likely contains authentication credentials." >&2
  exit 2
fi

# Warn about package-lock.json (allow but warn)
if echo "$BASENAME" | grep -qE '^package-lock\.json$'; then
  echo "⚠️  WARNING: Editing package-lock.json" >&2
  echo "This file is auto-generated. Run 'npm install' after editing." >&2
  # Allow the operation (exit 0, not 2)
fi

# Warn about yarn.lock or pnpm-lock.yaml
if echo "$BASENAME" | grep -qE '^(yarn\.lock|pnpm-lock\.yaml)$'; then
  echo "⚠️  WARNING: Editing lock file: $BASENAME" >&2
  echo "Lock files are auto-generated. Regenerate after editing." >&2
  # Allow the operation
fi

# All checks passed
exit 0

