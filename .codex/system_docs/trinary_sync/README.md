# Trinary Sync System

## Purpose

The trinary sync system keeps Claude Code configuration artifacts synchronized across
three repository directories. When a skill, agent, or MCP configuration is created or
modified in the main app directory, sync scripts propagate the changes to the template
and clean-reference directories so all three locations stay consistent.

## Architecture Diagram

```
  +-------------------------------+
  |         Main App              |
  |   (Active Development)        |
  |   .codex/                    |
  |     skills/                   |     Source of truth.
  |     agents/                   |     New work happens here.
  |     subagents/                |     Changes tested first.
  |     mcp.json                  |
  +-------------------------------+
           |              |
           | sync         | sync
           v              v
  +----------------+   +------------------+
  | App Builder    |   | Do-Over Files    |
  | Template       |   | (Clean Reference)|
  | (PRIMARY)      |   |                  |
  | .codex/       |   | .codex/         |
  |   skills/      |   |   skills/        |
  |   agents/      |   |   agents/        |
  |   subagents/   |   |   subagents/     |
  |   mcp.json     |   |   mcp.json       |
  +----------------+   +------------------+
        |                       |
        | bootstrap             | restart
        v                       v
  New Projects              Main App
  (copies from              (restore from
   template)                 do-over if messy)
```

## Directory Roles

### Main App

| Attribute  | Value                                            |
|------------|--------------------------------------------------|
| **Role**   | Active development and testing                   |
| **Usage**  | Where new skills/agents are created and tested   |
| **Status** | Source of truth for current state                 |

### App Builder Template (PRIMARY)

| Attribute  | Value                                            |
|------------|--------------------------------------------------|
| **Role**   | Primary template for bootstrapping new projects  |
| **Usage**  | All new projects copy their `.codex/` from here |
| **Status** | Must always have the latest stable versions      |

### Do-Over Files

| Attribute  | Value                                            |
|------------|--------------------------------------------------|
| **Role**   | Clean restart reference                          |
| **Usage**  | Used when the main app directory becomes messy   |
| **Status** | Pristine copy, used for restoration              |

## What Gets Synced

| Artifact            | Synced | Notes                                   |
|---------------------|--------|-----------------------------------------|
| `skills/`           | Yes    | Full skill folders with SKILL.md, scripts, resources |
| `agents/`           | Yes    | Agent YAML files                        |
| `subagents/`        | Yes    | Subagent configurations                 |
| `mcp.json`          | Yes    | MCP server configuration                |
| Custom hooks        | Yes    | Hook scripts and configurations         |
| `.cache/`           | No     | Local runtime cache                     |
| `logs/`             | No     | Local session logs                      |
| `temp/`             | No     | Temporary files                         |

## Sync Scripts

### sync-all.js

Synchronizes the entire `.codex/` directory from main to both targets.

```bash
node scripts/sync-all.js [--dry-run] [--verbose] [--force]
node scripts/sync-all.js --include skills --exclude agents
node scripts/sync-all.js --report > sync-report.txt
```

| Flag        | Effect                                           |
|-------------|--------------------------------------------------|
| `--dry-run` | Show what would be synced without copying        |
| `--verbose` | Show detailed file-by-file progress              |
| `--force`   | Overwrite even if destination is newer           |
| `--include` | Sync only specified artifact types               |
| `--exclude` | Skip specified artifact types                    |
| `--report`  | Generate detailed sync report                   |

### sync-skill.js

Synchronizes a single skill folder to both target directories.

```bash
node scripts/sync-skill.js <skill-name> [--force]
```

### sync-agent.js

Synchronizes a single agent file to both target directories.

```bash
node scripts/sync-agent.js <agent-name> [--force]
```

### check-sync.js

Verifies synchronization status across all three directories.

```bash
node scripts/check-sync.js [--fix]
```

| Flag    | Effect                                               |
|---------|------------------------------------------------------|
| `--fix` | Automatically sync any detected differences          |

**Output example:**

```
Sync Status Report
==================

  In Sync:
   - 25 skills
   - 18 agents
   - mcp.json

  Out of Sync:
   - app-builder-template missing: skill-a, skill-b
   - do-over-files outdated: agent-x (main: 2025-01-05, do-over: 2025-01-03)

  Conflicts:
   - designing-convex-schemas: do-over newer than main (manual review needed)
```

## Sync Workflow

### After Creating a New Skill

```
Developer creates skill in Main App
         |
         v
Test skill locally, verify it works
         |
         v
Run: node scripts/sync-skill.js <skill-name>
         |
    +----+----+
    |         |
    v         v
Template   Do-Over
updated    updated
    |         |
    +----+----+
         |
         v
git add .codex/ app-builder-template/.codex/ do-over-files/.codex/
git commit -m "Add new skill: <skill-name>"
```

### After Modifying an Existing Skill

1. Edit in main app directory.
2. Test changes locally.
3. Run `node scripts/sync-skill.js <skill-name>`.
4. Commit all three directories together.

### Before Creating a New Project

```bash
node scripts/check-sync.js --fix
# Then bootstrap new project from template
```

## Git Pre-Commit Hook Integration

Automatically verify sync status before each commit:

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Checking Claude Code sync status..."
node .codex/skills/maintaining-trinary-sync/scripts/check-sync.js

if [ $? -ne 0 ]; then
  echo "Directories out of sync. Run: node scripts/sync-all.js"
  exit 1
fi
```

This prevents committing when the three directories have drifted apart.

## Conflict Resolution

### Detection

Conflicts are detected when:
- File sizes differ significantly between directories.
- Last-modified dates suggest divergent changes (both edited independently).
- Skill structure changed (files added/removed in only one location).

### Resolution Steps

1. **Compare** files manually to understand the differences.
2. **Determine** which version is correct.
3. **Overwrite** with `--force` if main is the authoritative version.
4. **Copy from** do-over/template to main if they have the better version.
5. **Document** the resolution in the commit message.

## Troubleshooting

### Permission Denied or File Locked

Close editors and IDEs that might lock files. Check that files are not read-only.
Run with elevated permissions if necessary.

### Many Differences Reported

Force a full resync from main:

```bash
node scripts/sync-all.js --force
```

### New Project Missing Skills

Ensure the template is up to date before bootstrapping:

```bash
node scripts/check-sync.js --fix
```

Then recreate the project from the updated template.

### Conflicting Changes in Both Directions

When both main and do-over have been modified independently:
1. Compare files manually.
2. Merge improvements from both if applicable.
3. Force overwrite one direction with `--force`.
4. Document the merge decision in the commit message.

## Recommended Sync Schedule

| Trigger                         | Action                              |
|---------------------------------|-------------------------------------|
| After creating a new skill      | `sync-skill.js <name>`             |
| After creating a new agent      | `sync-agent.js <name>`             |
| After modifying MCP config      | `sync-all.js`                       |
| Before committing to git        | `check-sync.js`                     |
| Before bootstrapping a project  | `check-sync.js --fix`              |
| Weekly maintenance              | `sync-all.js && check-sync.js`     |

## Skill Location

| Component              | Path                                                  |
|------------------------|-------------------------------------------------------|
| Trinary sync skill     | `.codex/skills/maintaining-trinary-sync/SKILL.md`    |
| Directory structure ref| `.codex/skills/maintaining-trinary-sync/resources/directory-structure.md` |
| Sync scripts           | `scripts/sync-all.js`, `sync-skill.js`, `sync-agent.js`, `check-sync.js` |
