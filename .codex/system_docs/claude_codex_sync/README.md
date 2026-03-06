# Claude-Codex Sync System

Bidirectional synchronization system that keeps `.codex/` and `.codex/` directories mirrored with provider-appropriate format transformations. Each directory follows its own naming and structural conventions; this system translates between them automatically.

## Architecture

```
.codex/                          .codex/
  agents/                           agents/
    <name>/agent.md  <------>         <name>/AGENT.md
                                      <name>.md (stub)
                                      README.md (manual)
  skills/                           skills/
    <name>/SKILL.md  <------>         <name>/SKILL.md
      references/                       references/
      scripts/                          scripts/
                                      README.md (manual)
                                      CATALOG.md (manual)
                                      INTEGRATION-EXAMPLES.md (manual)
  system_docs/                      system_docs/
    <folder>/        <------>         <folder>/
```

The sync agent reads from the source directory, applies format transformations, substitutes path references, writes to the target directory, and verifies correctness.

## Convention Differences

| Element | Claude | Codex |
|---|---|---|
| Agent filename | `agent.md` (lowercase) | `AGENT.md` (uppercase) |
| Agent YAML frontmatter | Never | Always (name, description, tools, permissions, expertise) |
| Agent stub file | Not used | `agents/<name>.md` with brief description |
| Skill format | SKILL.md with YAML frontmatter | Identical |
| Path references in content | `.codex/` prefix | `.codex/` prefix |
| Directory metadata files | Not used | README.md, CATALOG.md, INTEGRATION-EXAMPLES.md |
| Commands directory | Not present | `.codex/commands/` |
| Hooks directory | Not present | `.codex/hooks/` |
| Orchestration directory | Not present | `.codex/orchestration/` |
| Templates directory | Not present | `.codex/templates/` |

## Transformation Rules

### Claude-to-Codex Agent

1. Read `agent.md` (plain markdown).
2. Extract metadata from content: name from H1, description from first paragraph, tools from keyword scan, expertise from capability sections.
3. Compose YAML frontmatter with extracted fields.
4. Write `AGENT.md` = YAML frontmatter + body with `.codex/` replaced by `.codex/`.
5. Write stub `<name>.md` = brief description + pointers to AGENT.md and SKILL.md.

### Codex-to-Claude Agent

1. Read `AGENT.md` (YAML frontmatter + markdown).
2. Strip YAML frontmatter entirely.
3. Ensure body starts with H1 heading (generate from YAML `name` if missing).
4. Write `agent.md` = plain markdown body with `.codex/` replaced by `.codex/`.

### Skills (Either Direction)

1. Copy SKILL.md preserving YAML frontmatter.
2. Substitute path references in markdown body only.
3. Copy subdirectories recursively, substituting paths in `.md` files.

### System Docs (Either Direction)

1. Copy folder structure.
2. Substitute path references in all `.md` files.
3. Preserve non-markdown files without changes.

## Agent and Skill Locations

| Component | Path |
|---|---|
| Sync agent definition | `.codex/agents/claude-codex-sync-agent/agent.md` |
| Sync skill (transformation rules) | `.codex/skills/syncing-claude-codex/SKILL.md` |
| This documentation | `.codex/system_docs/claude_codex_sync/README.md` |

## Integration with Other Workflows

### When to Run Sync

| Trigger | Sync Direction | Scope |
|---|---|---|
| Created new agent in `.codex/` | claude-to-codex | Single agent |
| Created new skill in `.codex/` | claude-to-codex | Single skill |
| Modified agent in `.codex/` | codex-to-claude | Single agent |
| Modified skill in `.codex/` | codex-to-claude | Single skill |
| Added system docs | Either direction | Single folder |
| Pre-commit verification | Bidirectional | All agents + skills |
| Trinary sync runs | claude-to-codex | Follows trinary sync output |

### Relationship to Trinary Sync

The trinary sync system (`.codex/skills/maintaining-trinary-sync/`) synchronizes configurations across three app directories (main, template, do-over). The claude-codex sync operates within a single app directory, translating between provider formats. These two systems are complementary:

1. Trinary sync propagates changes across app copies.
2. Claude-codex sync translates between provider conventions within each copy.
3. Recommended order: run claude-codex sync first, then trinary sync to propagate the result.

## Transformation Examples

### Claude-to-Codex Agent

Given `.codex/agents/chat-history-agent/agent.md` (plain markdown with H1, Purpose section, Responsibilities bullets, and a skill reference to `.codex/skills/chat-history-convention/SKILL.md`), the sync produces:

1. `.codex/agents/chat-history-agent/AGENT.md` -- YAML frontmatter (name, description, tools, permissions, expertise extracted from content) followed by the markdown body with `.codex/` replaced by `.codex/`.
2. `.codex/agents/chat-history-agent.md` -- stub with H1, one-paragraph description, and pointers to `AGENT.md` and `.codex/skills/chat-history-convention/SKILL.md`.

### Codex-to-Claude Agent

Given `.codex/agents/do-over-agent/AGENT.md` (YAML frontmatter + markdown body referencing `.codex/skills/maintaining-trinary-sync/SKILL.md`), the sync produces:

1. `.codex/agents/do-over-agent/agent.md` -- plain markdown body only (YAML stripped), with `.codex/` replaced by `.codex/` throughout.

## Exclusions

Never synced between directories:
- `deprecated/` folders (independent per provider)
- Runtime artifacts (`.cache/`, `logs/`, `temp/`)
- Provider-specific config (`mcp.json`)
- Codex-only directories (`commands/`, `hooks/`, `orchestration/`, `templates/`)
- Codex root files (`CODEX.md`, `AGENTS.md`)
