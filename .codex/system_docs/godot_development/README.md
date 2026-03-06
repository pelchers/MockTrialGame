# Godot Development System

System documentation for the Godot 4.x game development agent and skill.

## Purpose

Provides Godot 4.x-specific game development expertise including GDScript/C# patterns, scene architecture, multiplayer networking with Godot's MultiplayerAPI, voxel systems via godot-voxel, editor operations, and debugging. Includes MCP-equivalent knowledge baked into the skill so it works with or without an MCP server connection.

## When to Use

- Writing GDScript or C# code for Godot 4.x
- Designing scene architecture (composition, signals, node patterns)
- Implementing multiplayer with Godot's MultiplayerAPI (RPCs, synchronizers, spawners)
- Working with godot-voxel (Zylann) for chunk-based terrain
- Building dedicated server exports
- Debugging Godot-specific issues (scene tree, signal connections, authority)
- Editor operations (scene management, export, CLI commands)

## Architecture

```
┌─────────────────────────────────────────────────┐
│          Godot Development Agent                 │
│   (Godot 4.x Specialist / MCP-Equivalent)       │
├─────────────────────────────────────────────────┤
│  GDScript/C# coding with static typing          │
│  Scene architecture and composition              │
│  Multiplayer API (server-authoritative)          │
│  godot-voxel integration                         │
│  Editor operations (baked-in MCP knowledge)      │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ SKILL.md │  │ 5 Resource│  │ Citations│
  │ (patterns)│ │ Files     │  │          │
  └──────────┘  └──────────┘  └──────────┘
                     │
    ┌────────┬───────┼────────┬──────────┐
    ▼        ▼       ▼        ▼          ▼
  Editor  Multiplayer Voxel   MCP     Citations
  Ops     Patterns    Ref     Setup
```

## Key Concepts

### MCP-Equivalent Knowledge

The skill bakes in all knowledge that would normally come from Godot MCP servers (editor operations, CLI commands, .tscn format, scene/node APIs). This means the agent functions identically whether or not an MCP server is connected.

### Recommended MCP Servers (Optional)

If MCP is available, these servers enhance the experience:
- **Coding-Solo/godot-mcp** (2k stars) — Primary; launch/run/scene/node tools
- **ee0pdt/Godot-MCP** (477 stars) — Bidirectional editor communication

## Agent & Skill Locations

| Component | Claude Path | Codex Path |
|-----------|-------------|------------|
| Agent | `.claude/agents/godot-development-agent/AGENT.md` | `.codex/agents/godot-development-agent.md` |
| Skill | `.claude/skills/godot-development-agent/SKILL.md` | `.codex/skills/godot-development-agent/SKILL.md` |
| Editor Operations | `.claude/skills/godot-development-agent/resources/editor-operations-reference.md` | `.codex/skills/godot-development-agent/resources/editor-operations-reference.md` |
| Multiplayer Patterns | `.claude/skills/godot-development-agent/resources/multiplayer-patterns.md` | `.codex/skills/godot-development-agent/resources/multiplayer-patterns.md` |
| Voxel Reference | `.claude/skills/godot-development-agent/resources/voxel-reference.md` | `.codex/skills/godot-development-agent/resources/voxel-reference.md` |
| MCP Setup Guide | `.claude/skills/godot-development-agent/resources/mcp-setup-guide.md` | `.codex/skills/godot-development-agent/resources/mcp-setup-guide.md` |
| Citations | `.claude/skills/godot-development-agent/resources/citations.md` | `.codex/skills/godot-development-agent/resources/citations.md` |

## Integration with Other Systems

- **game_development**: Parent system for engine-agnostic game dev knowledge. The Godot agent references the game-dev skill for cross-domain topics.
- **extensibility**: Agent and skill created following extensibility system guides.
- **system_docs_management**: This system's documentation was created by the system-docs-agent.
