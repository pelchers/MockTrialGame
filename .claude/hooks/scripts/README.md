# Claude Code Hook Scripts

This directory contains shell scripts for Claude Code hooks. These scripts are referenced in `.claude/settings.json` to automate workflows and enforce safety checks.

## Available Scripts

### `git-context-report.sh`
**Purpose:** Captures git status, recent commits, and diff summary into a timestamped report.

**Usage:**
```bash
./git-context-report.sh [out_dir]
```

---

### `playwright-visual-snapshots.sh`
**Purpose:** Takes multi-viewport screenshots for a list of URLs using Playwright.

**Usage:**
```bash
./playwright-visual-snapshots.sh urls.txt [out_dir]
```

---

### `playwright-userstory-smoke.sh`
**Purpose:** Runs lightweight user-story smoke checks by visiting URLs and capturing screenshots.

**Usage:**
```bash
./playwright-userstory-smoke.sh stories.csv [out_dir]
```

---

### `web-research-metadata.sh`
**Purpose:** Extracts title/meta/og metadata for a list of URLs using Playwright.

**Usage:**
```bash
./web-research-metadata.sh urls.txt [out_dir]
```

---

### `playwright-console-errors.sh`
**Purpose:** Captures console and page errors for a list of URLs using Playwright.

**Usage:**
```bash
./playwright-console-errors.sh urls.txt [out_dir]
```

---

### `playwright-a11y-snapshot.sh`
**Purpose:** Captures Playwright accessibility snapshots for a list of URLs.

**Usage:**
```bash
./playwright-a11y-snapshot.sh urls.txt [out_dir]
```

---

### `check-links.sh`
**Purpose:** Checks HTTP status for a list of URLs and writes a JSON report.

**Usage:**
```bash
./check-links.sh urls.txt [out_file]
```

---

### `scan-secrets.sh`
**Purpose:** Scans a path (or git diff) for common secret patterns; exits 2 if found.

**Usage:**
```bash
./scan-secrets.sh [path]
```

---

### `large-file-guard.sh`
**Purpose:** Blocks files larger than a threshold (default 512KB).

**Usage:**
```bash
./large-file-guard.sh <file_path> [max_kb]
```

---

### `pre-bash-validator.sh`
**Hook Type:** PreToolUse (Bash)
**Purpose:** Validates bash commands before execution

**Features:**
- Blocks dangerous `rm -rf /` commands
- Blocks force push to main/master branches
- Warns about grep/find (suggests rg/fd alternatives)
- Warns about recursive deletions with wildcards

**Exit Codes:**
- 0: Command allowed
- 1: Warning only (command still runs)
- 2: Command blocked

**Usage in settings.json:**
```json
{
  "matcher": "Bash",
  "hooks": [{
    "type": "command",
    "command": "${CLAUDE_PLUGIN_ROOT}/.claude/hooks/scripts/pre-bash-validator.sh"
  }]
}
```

---

### `post-format-code.sh`
**Hook Type:** PostToolUse (Edit|Write)
**Purpose:** Auto-formats code files after editing

**Supported Languages:**
- TypeScript/JavaScript (.ts, .tsx, .js, .jsx) - Uses Prettier
- Python (.py) - Uses Black
- Rust (.rs) - Uses rustfmt
- JSON (.json) - Uses jq

**Exit Codes:**
- 0: Always (non-blocking, errors logged only)

**Usage in settings.json:**
```json
{
  "matcher": "Edit|Write",
  "hooks": [{
    "type": "command",
    "command": "${CLAUDE_PLUGIN_ROOT}/.claude/hooks/scripts/post-format-code.sh"
  }]
}
```

---

### `session-start-setup.sh`
**Hook Type:** SessionStart
**Purpose:** Displays project info and environment checks at session start

**Features:**
- Shows project name and working directory
- Displays current git branch and uncommitted changes
- Checks for development tools (Node.js, npm, prettier, git)
- Shows project package name
- Displays quick command reference

**Exit Codes:**
- 0: Always (informational only)

**Usage in settings.json:**
```json
{
  "hooks": [{
    "type": "command",
    "command": "${CLAUDE_PLUGIN_ROOT}/.claude/hooks/scripts/session-start-setup.sh"
  }]
}
```

---

### `block-sensitive-files.sh`
**Hook Type:** PreToolUse (Edit|Write)
**Purpose:** Prevents editing of sensitive files

**Blocked File Patterns:**
- Environment files (`.env*`)
- Secret/key files (`.secret`, `.key`, `.pem`, `.p12`, `.pfx`)
- Certificate files (`.crt`, `.cer`)
- Credential files (matching `credentials`, `secrets`, `auth`, `token`)

**Warned File Patterns:**
- `package-lock.json`
- `yarn.lock`
- `pnpm-lock.yaml`

**Exit Codes:**
- 0: File safe to edit (or warning only)
- 2: File blocked from editing

**Usage in settings.json:**
```json
{
  "matcher": "Edit|Write",
  "hooks": [{
    "type": "command",
    "command": "${CLAUDE_PLUGIN_ROOT}/.claude/hooks/scripts/block-sensitive-files.sh"
  }]
}
```

---

## Creating Custom Hook Scripts

### Script Template

```bash
#!/bin/bash
# Description of what this hook does
# Exit codes: 0 = success, 1 = error, 2 = block

# Read input from tool call
INPUT=$(jq -r '.tool_input.FIELD_NAME')

# Your logic here

# Exit with appropriate code
exit 0
```

### Exit Code Guidelines

- **0**: Operation successful, continue normally
- **1**: Error occurred, show stderr to user (NOT to Claude)
- **2**: Block the operation, show stderr to Claude (prevents tool execution)

### Available Tool Input Fields

Different tools provide different fields in `tool_input`:

**Bash:**
- `.tool_input.command` - The bash command to execute

**Edit/Write:**
- `.tool_input.file_path` - Path to the file being edited
- `.tool_input.old_string` - Text being replaced (Edit only)
- `.tool_input.new_string` - New text (Edit only)
- `.tool_input.content` - Full file content (Write only)

**Read:**
- `.tool_input.file_path` - Path to the file being read

### Testing Hook Scripts

Test your hook scripts manually:

```bash
# Test bash validator
echo '{"tool_input":{"command":"rm -rf /"}}' | .claude/hooks/scripts/pre-bash-validator.sh

# Test file blocker
echo '{"tool_input":{"file_path":".env"}}' | .claude/hooks/scripts/block-sensitive-files.sh

# Test formatter
echo '{"tool_input":{"file_path":"src/index.ts"}}' | .claude/hooks/scripts/post-format-code.sh
```

## Hook Script Best Practices

1. **Always use exit codes correctly** - 0 for success, 2 for blocking
2. **Write to stderr for blocking messages** - Use `>&2` redirect
3. **Make scripts executable** - `chmod +x script.sh`
4. **Use `jq` for JSON parsing** - Safe and reliable
5. **Check command existence** - Use `command -v tool &> /dev/null`
6. **Fail gracefully** - Don't block on non-critical errors
7. **Test thoroughly** - Hooks run on every operation
8. **Document your scripts** - Future you will thank you

## Troubleshooting

### Hook not running
1. Check script is executable: `chmod +x script.sh`
2. Verify script path in `settings.json`
3. Check script syntax: `bash -n script.sh`
4. View Claude Code logs for errors

### Hook blocking unintentionally
1. Check exit codes in script
2. Ensure stderr messages use `>&2`
3. Test script manually with sample input
4. Review logic for edge cases

### Permission denied errors
1. Make script executable: `chmod +x script.sh`
2. Check file ownership
3. Verify script shebang: `#!/bin/bash`

## Additional Resources

- [Claude Code Hooks Documentation](https://code.claude.com/docs/en/hooks)
- [Hook Examples on GitHub](https://github.com/anthropics/claude-code/tree/main/examples/hooks)
- Root-level `CLAUDE-HOOKS-GUIDE.md` for comprehensive guide

