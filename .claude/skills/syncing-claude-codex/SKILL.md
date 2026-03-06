---
name: syncing-claude-codex
description: Bidirectional synchronization between .claude/ and .codex/ directories with format transformation, path substitution, and verification. Use when creating or modifying agents, skills, or system docs in either provider directory to keep both in sync.
---

# Syncing Claude and Codex Directories

Comprehensive rules and procedures for bidirectional synchronization between `.claude/` and `.codex/` provider directories, handling all format differences, path references, and provider-specific conventions.

## Convention Differences Reference

### Agent Definitions

| Aspect | Claude (`.claude/`) | Codex (`.codex/`) |
|---|---|---|
| Filename | `agents/<name>/agent.md` (lowercase) | `agents/<name>/AGENT.md` (uppercase) |
| YAML frontmatter | NEVER present | ALWAYS required |
| Frontmatter fields | N/A | `name`, `description`, `tools`, `permissions`, `expertise` |
| Stub file | Not used | `agents/<name>.md` (root-level, 2-8 lines) |
| Content style | Plain markdown starting with H1 | YAML block then markdown body |

### YAML Frontmatter Fields (Codex Agents)

| Field | Required | Type | How to Infer from Claude Content |
|---|---|---|---|
| `name` | Yes | string | H1 heading text or directory name |
| `description` | Yes | string | First paragraph or Purpose/Overview section, one sentence |
| `tools` | No | string[] | Scan body for tool mentions: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch |
| `permissions.mode` | No | string | Default to `ask` unless body specifies autonomous operation |
| `expertise` | No | string[] | Extract from Responsibilities, Capabilities, or Core sections as short phrases |

### Skill Definitions

| Aspect | Claude (`.claude/`) | Codex (`.codex/`) |
|---|---|---|
| Filename | `skills/<name>/SKILL.md` | `skills/<name>/SKILL.md` |
| YAML frontmatter | Required (`name` + `description`) | Required (`name` + `description`) |
| Format | Identical structure | Identical structure |
| Subdirectories | `references/`, `scripts/`, `resources/`, `templates/` | Same |
| Difference | Path references use `.claude/` | Path references use `.codex/` |

### System Documentation

| Aspect | Claude (`.claude/`) | Codex (`.codex/`) |
|---|---|---|
| Location | `system_docs/<folder>/` | `system_docs/<folder>/` |
| Format | Standard markdown | Standard markdown |
| Difference | Path references use `.claude/` | Path references use `.codex/` |

### Codex-Only Structural Files

These files exist only in `.codex/` and are NOT generated during sync. They are maintained manually:

| File | Purpose |
|---|---|
| `.codex/agents/README.md` | Agent directory description and index |
| `.codex/skills/README.md` | Skill directory description and conventions |
| `.codex/skills/CATALOG.md` | Comprehensive catalog of all skills with categories |
| `.codex/skills/INTEGRATION-EXAMPLES.md` | Example integrations between skills |
| `.codex/commands/` | Codex-specific command definitions |
| `.codex/hooks/` | Codex-specific hook configurations |
| `.codex/orchestration/` | Codex orchestration configs |
| `.codex/templates/` | Codex ADR and ingest templates |

## Path Substitution

### Regex Patterns

Claude-to-Codex substitution (apply to all `.md` file content):
```
s|\.claude/|.codex/|g
```

Codex-to-Claude substitution:
```
s|\.codex/|.claude/|g
```

### Scope

Apply substitution to:
- Markdown body text in AGENT.md / agent.md files
- Markdown body text in SKILL.md files
- All `.md` files in `references/`, `resources/`, `templates/` subdirectories
- System documentation files

Do NOT apply substitution to:
- YAML frontmatter values (these are metadata, not path references)
- JSON files (path references in JSON are intentional and provider-specific)
- Script files (`.mjs`, `.js`, `.sh`) -- these contain executable paths that must match the provider
- Image files, binary files

### Edge Cases

- Escaped paths like `\.claude/` in regex patterns: substitute the path but preserve the backslash
- URLs containing `.claude/` or `.codex/` as URL path segments: DO substitute
- Literal strings in code blocks: DO substitute (the reader will be in the target provider context)
- File paths in YAML frontmatter `skills:` arrays: do NOT substitute (these are identifiers, not paths)

## Agent Transformation: Claude to Codex

1. Read `.claude/agents/<name>/agent.md`. Confirm no YAML frontmatter present.
2. Extract metadata from content:
   - **name**: directory name, kebab-case
   - **description**: first non-heading paragraph, truncated to one sentence
   - **tools**: scan body for `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `WebSearch`, `WebFetch`
   - **permissions.mode**: default `ask`; use `bypassPermissions` if body mentions autonomous operation
   - **expertise**: 3-6 short phrases from bullet lists under Responsibilities/Capabilities/Core headings
3. Write `.codex/agents/<name>/AGENT.md` with YAML frontmatter (name, description, tools, permissions, expertise) followed by the markdown body with `.claude/` replaced by `.codex/`.
4. Write stub `.codex/agents/<name>.md` (2-8 lines): H1 heading, one-paragraph description, pointer to `<name>/AGENT.md`, and pointer to `.codex/skills/<name>/SKILL.md` if a corresponding skill exists.

## Agent Transformation: Codex to Claude

1. Read `.codex/agents/<name>/AGENT.md`. Parse and discard the YAML frontmatter block.
2. Ensure body starts with H1 heading; if missing, prepend one from the YAML `name` field.
3. Write `.claude/agents/<name>/agent.md` with the plain markdown body, replacing `.codex/` with `.claude/`.
4. Do NOT create a stub file -- Claude convention does not use root-level stubs.

## Skill Transformation

### Either Direction

1. Copy `SKILL.md` from source to target.
2. Preserve the YAML frontmatter exactly (do not modify `name` or `description`).
3. In the markdown body only, apply path substitution.
4. Recursively copy all subdirectories (`references/`, `scripts/`, `resources/`, `templates/`).
5. For each `.md` file in subdirectories, apply path substitution.
6. For non-markdown files (JSON, JS, images), copy without modification.

## System Docs Transformation

### Either Direction

1. Copy the entire `system_docs/<folder>/` directory.
2. In every `.md` file, apply path substitution.
3. Preserve non-markdown files without modification.
4. Preserve directory structure exactly.

## Verification Checklist

After each sync operation, verify:

- [ ] Target file exists at the expected path with correct casing (`agent.md` for Claude, `AGENT.md` for Codex)
- [ ] Codex stub file exists when direction was claude-to-codex for agents
- [ ] All subdirectories were copied (references, scripts, resources, templates)
- [ ] Codex AGENT.md has valid YAML frontmatter with `name` and `description`
- [ ] Claude agent.md has NO YAML frontmatter
- [ ] SKILL.md files have valid YAML frontmatter with `name` and `description`
- [ ] No `.claude/` references remain in `.codex/` files (and vice versa)
- [ ] Every path reference in the target points to a file that exists
- [ ] Exception: YAML frontmatter skill identifiers are NOT paths and should not be substituted

## Batch Sync Support

### Sync All Agents

```
Input: sync all agents from .claude/ to .codex/
```

1. List all directories in `.claude/agents/` excluding `deprecated/`.
2. For each directory containing `agent.md`, apply the Claude-to-Codex agent transformation.
3. Aggregate results into a single summary report.
4. List any agents in `.codex/agents/` that do NOT have a corresponding `.claude/agents/` entry (potential orphans).

### Sync All Skills

```
Input: sync all skills from .claude/ to .codex/
```

1. List all directories in `.claude/skills/` excluding `deprecated/`.
2. For each directory containing `SKILL.md`, apply the skill transformation.
3. Aggregate results into a single summary report.
4. List any skills in `.codex/skills/` without a `.claude/skills/` counterpart.

### Full Bidirectional Reconciliation

```
Input: sync all
```

1. Enumerate all agents and skills in BOTH directories.
2. For each item, compare modification timestamps.
3. Sync from the newer source to the older target.
4. If an item exists in only one directory, sync it to the other.
5. Items in `deprecated/` are skipped entirely.
6. Report all actions taken plus any conflicts requiring manual review.

## What NOT to Sync

| Item | Reason |
|---|---|
| `deprecated/` contents | Each provider maintains independent deprecation |
| `.cache/`, `logs/`, `temp/` | Runtime artifacts, not configuration |
| `mcp.json` | Provider-specific MCP configuration |
| `.codex/commands/` | Codex-only command system |
| `.codex/hooks/` | Codex-only hook system |
| `.codex/orchestration/` | Codex-only orchestration config |
| `.codex/templates/` | Codex-only ADR/ingest templates |
| `.codex/CODEX.md`, `.codex/AGENTS.md` | Codex root-level config files |

## Related Resources

- Agent definition: `.claude/agents/claude-codex-sync-agent/agent.md`
- System documentation: `.claude/system_docs/claude_codex_sync/README.md`
- Trinary sync (broader sync system): `.claude/skills/maintaining-trinary-sync/SKILL.md`
- Agent creation conventions: `.claude/skills/creating-claude-agents/SKILL.md`
- Skill creation conventions: `.claude/skills/creating-claude-skills/SKILL.md`
