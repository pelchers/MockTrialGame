---
name: verifying-agnosticism
description: Scan and fix hardcoded paths, project-specific references, and environment-coupled values in agents, skills, hooks, and orchestration files to ensure portability across repos. Use when auditing or onboarding template files.
---

# Verifying Agnosticism

Ensures agents, skills, hooks, and orchestration files are portable across repos by detecting and fixing hardcoded paths and project-specific references.

## Quick Start

### Scan for hardcoded paths
```bash
# Scan .claude/ and .codex/ for absolute paths
node .claude/skills/verifying-agnosticism/scripts/scan-hardcoded-paths.js

# Scan a specific directory
node .claude/skills/verifying-agnosticism/scripts/scan-hardcoded-paths.js --dir .claude/hooks
```

### Manual grep check
```bash
grep -rn "C:\\\\coding\|C:/coding\|/home/\|/Users/" .claude/ .codex/ .adr/ \
  --include="*.js" --include="*.ps1" --include="*.sh" --include="*.json" --include="*.md"
```

Zero matches = fully agnostic.

## What to Scan For

### Blocking (Must Fix)
| Pattern | Where | Fix |
|---------|-------|-----|
| `C:\coding\apps\<project>` | `.js`, `.ps1`, `.sh` scripts | Derive from `__dirname` / `$PSScriptRoot` / `git rev-parse` |
| `"workdir": "C:\\..."` | `.json` queue/template files | Use empty string `""` (let consumer resolve) |
| `const BASE_DIR = '...'` | JS sync scripts | Accept `--base-dir` arg, fallback to `__dirname` resolution |
| `PROJECT_ROOT="C:/..."` | Shell scripts | Use `$(git rev-parse --show-toplevel)` |

### Portability (Should Fix)
| Pattern | Where | Fix |
|---------|-------|-----|
| Project names (`Hytale`, `wavz.fm`) | Docs, READMEs, CODEX.md | Use `<PROJECT_ROOT>` placeholder |
| Session names in templates | Queue templates | Use `<SESSION_KEY>` placeholder |
| `dryRun: true` in prod templates | JSON templates | Default to `false` for production use |

### Cosmetic (Nice to Fix)
| Pattern | Where | Fix |
|---------|-------|-----|
| Hardcoded paths in Mermaid diagrams | SKILL.md docs | Use `<PROJECT_ROOT>` |
| Project-specific examples | Code blocks in docs | Use generic examples |

## Fix Patterns

### PowerShell — Derive repo root from script location
```powershell
# Script at .claude/hooks/scripts/foo.ps1 → 3 levels up
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
```

### Node.js — Accept CLI arg with __dirname fallback
```javascript
// Script at .claude/skills/<skill>/scripts/foo.js → 4 levels up
function resolveBaseDir() {
  const idx = process.argv.indexOf('--base-dir');
  if (idx !== -1 && process.argv[idx + 1]) return path.resolve(process.argv[idx + 1]);
  return path.resolve(__dirname, '..', '..', '..', '..');
}
```

### Shell — Use git root
```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
```

### JSON Templates — Empty workdir
```json
{ "workdir": "" }
```
Consumer scripts should interpret empty workdir as "use the repo root".

### Documentation — Placeholder
```markdown
Main App: `<PROJECT_ROOT>/.claude/`
```

## Verification Checklist

After fixing, verify:
- [ ] `grep -rn` for absolute paths returns zero matches in scripts
- [ ] Queue template has `"workdir": ""`
- [ ] PowerShell scripts derive paths from `$PSScriptRoot`
- [ ] Node.js scripts use `__dirname` or CLI args for base paths
- [ ] Shell scripts use `git rev-parse --show-toplevel`
- [ ] Documentation uses `<PROJECT_ROOT>` placeholders
- [ ] No project-specific names remain in template files

## Related

- Agent: `.claude/agents/agnostic-verifier/agent.md`
- Scan script: `.claude/skills/verifying-agnosticism/scripts/scan-hardcoded-paths.js`
