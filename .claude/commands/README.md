# Claude Code Custom Commands

This directory contains custom slash commands for Claude Code. These commands are markdown files with YAML frontmatter that define reusable workflows.

## Available Commands

### `/commit-and-push`
Create an atomic commit following project conventions and push to remote.

**Usage:**
```
/commit-and-push
```

**What it does:**
1. Checks git status
2. Reviews all changes
3. Creates atomic commit with proper message format
4. Pushes to remote branch
5. Verifies push succeeded

**Best for:** Completing a feature or fix and pushing it to remote

---

### `/run-full-tests`
Run complete test suite including unit, integration, and E2E tests.

**Usage:**
```
/run-full-tests
```

**What it does:**
1. Runs type checking
2. Runs linting
3. Executes unit tests
4. Executes integration tests
5. Executes E2E tests
6. Reports results with coverage

**Best for:** Pre-commit validation and ensuring code quality

---

### `/deploy-preview`
Deploy current branch to preview/staging environment for testing.

**Usage:**
```
/deploy-preview
```

**What it does:**
1. Runs pre-deployment checks (tests, build)
2. Deploys Convex backend (if applicable)
3. Deploys frontend to preview environment
4. Verifies deployment
5. Provides preview URL and testing checklist

**Best for:** Testing changes in production-like environment before merging

---

### `/sync-dependencies`
Update and synchronize dependencies across the project.

**Usage:**
```
/sync-dependencies
```

**What it does:**
1. Checks for outdated packages
2. Identifies security vulnerabilities
3. Updates dependencies
4. Runs full test suite to verify
5. Commits changes if successful

**Best for:** Regular dependency maintenance and security updates

---

### `/spawn-subagent`
Queue and spawn the next phase subagent for long-running sessions.

**Usage:**
```
/spawn-subagent
```

**What it does:**
1. Reads `.claude/orchestration/queue/next_phase.json`
2. Invokes the orchestrator poke hook
3. Spawns a new Claude exec process (if `autoSpawn: true`)

**Best for:** Kicking off the next phase in a multi-phase workflow

---

## Creating Custom Commands

### Command File Structure

Commands are markdown files with YAML frontmatter:

```markdown
---
name: command-name
description: Short description of what the command does
invocable: true
---

# Command Title

Detailed description of the command.

## Instructions for Claude

When this command is invoked:

1. **Step 1**: Description
   ```bash
   command to run
   ```

2. **Step 2**: Description
   - Bullet points
   - More details

## Example Usage

\```
User: /command-name
Claude: [Response]
\```

## Notes

- Additional information
- Best practices
- Common issues
```

### YAML Frontmatter Fields

- `name`: Command name (used as `/command-name`)
- `description`: Short description shown in help
- `invocable: true`: Makes command available as slash command

### Command Design Best Practices

1. **Clear Instructions**: Provide step-by-step instructions for Claude
2. **Include Code Examples**: Show exact commands to run
3. **Error Handling**: Describe what to do if steps fail
4. **Verification Steps**: Always verify operations succeeded
5. **Documentation**: Include examples and notes section
6. **Safety Checks**: Validate before destructive operations

### Testing Custom Commands

Test commands by invoking them:

```
/your-command-name
```

Claude will follow the instructions in the markdown file.

## Command Naming Conventions

- Use kebab-case: `my-command-name`
- Be descriptive but concise
- Use verb-noun pattern: `deploy-preview`, `run-tests`
- Avoid generic names: prefer `deploy-preview` over `deploy`

## Command Organization

For large projects, organize commands into subdirectories:

```
.claude/commands/
├── git/
│   ├── commit-and-push.md
│   └── create-pr.md
├── testing/
│   ├── run-full-tests.md
│   └── run-unit-tests.md
├── deployment/
│   ├── deploy-preview.md
│   └── deploy-production.md
└── maintenance/
    ├── sync-dependencies.md
    └── clean-caches.md
```

## Built-in vs Custom Commands

**Built-in Claude Code Commands:**
- `/help` - Show help
- `/clear` - Clear conversation
- `/init` - Initialize Claude Code in project
- `/tasks` - Show background tasks

**Custom Commands (This Directory):**
- Project-specific workflows
- Team conventions
- Automated procedures
- Complex multi-step operations

## Invoking Commands

### Direct Invocation
```
/commit-and-push
```

### With Arguments (if command supports it)
```
/deploy-preview --branch=feature-123
```

### From Another Command
Commands can reference other commands:
```markdown
## Instructions for Claude

1. First run `/run-full-tests` to verify code quality
2. Then proceed with deployment
```

## Command Variables

Commands can reference environment variables and project context:

- `${PROJECT_ROOT}` - Project root directory
- `${CLAUDE_PLUGIN_ROOT}` - Plugin root (if in plugin)
- Environment variables from `.env`
- Git branch name
- Package.json fields

## Troubleshooting

### Command not found
1. Verify file is in `.claude/commands/`
2. Check YAML frontmatter has `invocable: true`
3. Ensure `name` field matches command name
4. Restart Claude Code session

### Command not working as expected
1. Review markdown instructions
2. Test each step manually
3. Check for typos in commands
4. Verify required tools are installed

### Command conflicts
1. Avoid names that conflict with built-in commands
2. Use descriptive, unique names
3. Check existing commands first

## Additional Resources

- [Claude Code Commands Documentation](https://code.claude.com/docs/en/commands)
- Root-level `CLAUDE-HOOKS-GUIDE.md` for hooks integration
- `.claude/skills/` for reusable agent skills
- `.claude/agents/` for specialized agents

