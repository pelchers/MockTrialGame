# Agnosticism Patterns Reference

## Why Agnosticism Matters

Template repos, shared skills, and reusable agents must work in any project directory. Hardcoded paths cause:
- Scripts that fail silently in new repos
- Orchestration queues that target wrong directories
- Hook scripts that can't find their own files
- Documentation that misleads new users

## Common Antipatterns

### 1. Hardcoded BASE_DIR in JavaScript
```javascript
// ANTIPATTERN
const BASE_DIR = 'C:\\coding\\apps\\wavz.fm';
```
**Why it breaks**: Script only works in one repo on one machine.
**Fix**: Derive from `__dirname` with CLI override.

### 2. Hardcoded paths in PowerShell param() defaults
```powershell
# ANTIPATTERN
param(
  [string]$QueueFile = "C:\\specific\\path\\.claude\\orchestration\\queue\\next_phase.json"
)
```
**Why it breaks**: `param()` default is evaluated at parse time — can't use variables.
**Fix**: Use empty default, then resolve from `$PSScriptRoot` after `param()`.

### 2b. Using Start-Process with non-exe CLI tools
```powershell
# ANTIPATTERN — claude/codex are .cmd shims, not .exe files
Start-Process -FilePath "claude" -ArgumentList $args -RedirectStandardOutput $log
# Fails with: "%1 is not a valid Win32 application"

# FIX — launch via cmd.exe /c
$fullCmd = "claude exec ... > `"$logFile`" 2> `"$errFile`""
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $fullCmd -WindowStyle Hidden
```
**Why it breaks**: `Start-Process -RedirectStandardOutput` only works with `.exe` files.
**Fix**: Wrap in `cmd.exe /c` with shell-level redirection (`>` and `2>`).

### 3. Hardcoded PROJECT_ROOT in shell scripts
```bash
# ANTIPATTERN
PROJECT_ROOT="C:/coding/apps/wavz.fm"
```
**Why it breaks**: Only works on one machine.
**Fix**: `PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"`

### 4. Hardcoded workdir in JSON templates
```json
{ "workdir": "C:\\coding\\apps\\myproject" }
```
**Why it breaks**: Queue files target wrong directory in other repos.
**Fix**: Use empty string `""` — consumer scripts should interpret as "use repo root".

### 5. Project names in template documentation
```markdown
Main App: `C:\coding\apps\wavz.fm\.claude\`
```
**Why it breaks**: Confuses users of other repos.
**Fix**: Use `<PROJECT_ROOT>/.claude/` placeholder.

## Resolution Techniques by Language

### PowerShell
```powershell
# Derive repo root from script location
# Script at .claude/hooks/scripts/ → 3 levels up
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path

# Then build paths relative to root
$queueFile = Join-Path $repoRoot ".claude\orchestration\queue\next_phase.json"
$historyDir = Join-Path $repoRoot ".claude\orchestration\history"
```

### Node.js
```javascript
// Derive project root from script location
// Script at .claude/skills/<skill>/scripts/ → 4 levels up
function resolveBaseDir() {
  const idx = process.argv.indexOf('--base-dir');
  if (idx !== -1 && process.argv[idx + 1]) {
    return path.resolve(process.argv[idx + 1]);
  }
  return path.resolve(__dirname, '..', '..', '..', '..');
}
const BASE_DIR = resolveBaseDir();
```

### Bash
```bash
# Option 1: Git root (works in any git repo)
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# Option 2: Script-relative (works without git)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
```

### JSON
```json
{
  "workdir": "",
  "comment": "Empty workdir = consumer resolves to repo root"
}
```

## Depth Cheat Sheet

| Script Location | Levels Up to Root |
|-----------------|------------------|
| `.claude/hooks/scripts/` | 3 |
| `.claude/skills/<name>/scripts/` | 4 |
| `.claude/agents/<name>/` | 3 |
| `.claude/orchestration/queue/` | 3 |
| `.codex/hooks/scripts/` | 3 |
| `.codex/skills/<name>/scripts/` | 4 |
