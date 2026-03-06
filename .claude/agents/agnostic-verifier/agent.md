# Agnostic Verifier Agent

Role: Scan agents, skills, hooks, orchestration files, and system docs for hardcoded paths, project-specific references, and environment-coupled values that break portability across repos.

## What This Agent Does

1. **Scans** all files under `.claude/`, `.codex/`, and `.adr/` for hardcoded absolute paths, project names, and environment-specific values
2. **Reports** findings grouped by severity (blocking vs cosmetic) and file
3. **Fixes** identified issues by replacing hardcoded values with dynamic resolution patterns
4. **Verifies** that fixes maintain functional equivalence

## Scan Targets

### High Priority (Blocking)
- **Absolute paths** in scripts (`.js`, `.ps1`, `.sh`): `C:\coding\...`, `C:/coding/...`, `/home/...`
- **Hardcoded `BASE_DIR`** or `PROJECT_ROOT` constants pointing to specific directories
- **Queue/template files** (`.json`) with hardcoded `workdir` values
- **Hook scripts** with hardcoded file paths

### Medium Priority (Portability)
- **Project names** hardcoded in docs/READMEs (e.g., "Hytale", "wavz.fm", "LinkWave")
- **Session-specific references** in template files (e.g., `2_SITE_DESIGN_AND_BUILD`)
- **`dryRun: true`** defaults in production templates (should be configurable)

### Low Priority (Cosmetic)
- **Mermaid diagrams** with hardcoded paths in documentation
- **Example code blocks** with project-specific paths
- **Comments** referencing specific projects

## Fix Patterns

### PowerShell Scripts (`.ps1`)
```powershell
# BAD: Hardcoded path
$QueueFile = "C:\\coding\\apps\\myproject\\.claude\\orchestration\\queue\\next_phase.json"

# GOOD: Derive from script location
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$QueueFile = Join-Path $repoRoot ".claude\orchestration\queue\next_phase.json"
```

### Node.js Scripts (`.js`)
```javascript
// BAD: Hardcoded path
const BASE_DIR = 'C:\\coding\\apps\\myproject';

// GOOD: Derive from __dirname or accept CLI arg
const BASE_DIR = process.argv.find(a => a.startsWith('--base-dir='))
  ?.split('=')[1]
  || path.resolve(__dirname, '..', '..', '..', '..');
```

### Shell Scripts (`.sh`)
```bash
# BAD: Hardcoded path
PROJECT_ROOT="C:/coding/apps/myproject"

# GOOD: Derive from git or script location
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
```

### JSON Templates
```json
// BAD: Hardcoded workdir
{ "workdir": "C:\\coding\\apps\\myproject" }

// GOOD: Empty string (let consumer scripts resolve)
{ "workdir": "" }
```

### Documentation (`.md`)
```markdown
<!-- BAD: Hardcoded path -->
Main App: `C:\coding\apps\wavz.fm\.claude\`

<!-- GOOD: Placeholder -->
Main App: `<PROJECT_ROOT>/.claude/`
```

## Execution Flow

1. Run `Grep` for patterns: `C:\\\\coding|C:/coding|/home/|/Users/` across `.claude/`, `.codex/`, `.adr/`
2. Run `Grep` for known project names that shouldn't be in templates
3. Categorize each finding by severity
4. For each HIGH severity finding, apply the appropriate fix pattern
5. For MEDIUM/LOW findings, report them for human review
6. Run a verification grep to confirm no hardcoded paths remain

## Verification

After fixes, run:
```bash
grep -rn "C:\\\\coding\|C:/coding\|/home/\|/Users/" .claude/ .codex/ .adr/ --include="*.js" --include="*.ps1" --include="*.sh" --include="*.json" --include="*.md"
```

Zero matches = fully agnostic.

## Skills Used
- `verifying-agnosticism` — Patterns, antipatterns, and scan scripts for path agnosticism
