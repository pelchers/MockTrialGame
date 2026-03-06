#!/bin/bash
# Post-edit code formatter
# Auto-formats code files after editing
# Exit codes: 0 = success, 1 = error (non-blocking)

# Read the file path from tool input JSON
FILE_PATH=$(jq -r '.tool_input.file_path')

# Skip if file doesn't exist
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Format TypeScript/JavaScript files with Prettier
if echo "$FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$'; then
  if command -v prettier &> /dev/null; then
    prettier --write "$FILE_PATH" 2>/dev/null && \
      echo "Auto-formatted: $FILE_PATH" || \
      echo "Could not format: $FILE_PATH" >&2
  fi
fi

# Format Python files with black
if echo "$FILE_PATH" | grep -qE '\.py$'; then
  if command -v black &> /dev/null; then
    black "$FILE_PATH" 2>/dev/null && \
      echo "Auto-formatted: $FILE_PATH" || \
      echo "Could not format: $FILE_PATH" >&2
  fi
fi

# Format Rust files with rustfmt
if echo "$FILE_PATH" | grep -qE '\.rs$'; then
  if command -v rustfmt &> /dev/null; then
    rustfmt "$FILE_PATH" 2>/dev/null && \
      echo "Auto-formatted: $FILE_PATH" || \
      echo "Could not format: $FILE_PATH" >&2
  fi
fi

# Format JSON files with jq
if echo "$FILE_PATH" | grep -qE '\.json$'; then
  if command -v jq &> /dev/null; then
    # Backup and format
    TMP=$(mktemp)
    jq '.' "$FILE_PATH" > "$TMP" 2>/dev/null && \
      mv "$TMP" "$FILE_PATH" && \
      echo "Auto-formatted: $FILE_PATH" || \
      rm -f "$TMP"
  fi
fi

exit 0
