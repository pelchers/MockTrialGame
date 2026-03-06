# Godot MCP Setup Guide

## Recommended: Coding-Solo/godot-mcp

The most popular Godot MCP server (2,000+ stars). Provides AI assistant integration with Godot Engine for project management, scene editing, and debugging.

### Installation

```bash
git clone https://github.com/Coding-Solo/godot-mcp.git
cd godot-mcp
npm install
npm run build
```

### Configuration for Claude Code

Add to your MCP settings (`.claude/settings.json` or global config):

```json
{
  "mcpServers": {
    "godot": {
      "command": "node",
      "args": ["/absolute/path/to/godot-mcp/build/index.js"],
      "env": {
        "GODOT_PATH": "/path/to/godot/executable",
        "DEBUG": "false"
      }
    }
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GODOT_PATH` | Auto-detect | Path to Godot executable |
| `DEBUG` | `false` | Enable verbose logging |
| `READ_ONLY` | `false` | Restrict to analysis-only operations |

### Available Tools

**System**:
- `get_godot_version` - Get installed Godot version and platform info
- `launch_editor` - Open Godot editor for a project
- `run_project` - Execute project in debug mode with output capture
- `stop_project` - Stop running project

**Project**:
- `list_projects` - Find Godot projects in a directory (recursive)
- `get_project_info` - Get project metadata, settings, features

**Scene Management**:
- `create_scene` - Create new scene with root node type
- `add_node` - Insert node into scene with properties
- `edit_node` - Modify node properties (position, scale, etc.)
- `remove_node` - Delete node from scene
- `load_sprite` - Assign texture to Sprite2D node
- `save_scene` - Save scene / create variants

**Resource (Godot 4.4+)**:
- `get_uid` - Get unique identifier for a resource
- `update_project_uids` - Update UID references across project
- `export_mesh_library` - Convert 3D scene to MeshLibrary

### Architecture

Uses two approaches:
1. **Direct CLI** for simple operations (launch, version, run)
2. **Bundled GDScript** (`godot_operations.gd`) for complex scene/node operations

Language: 59% JavaScript, 41% GDScript.

---

## Alternative: ee0pdt/Godot-MCP (477 stars)

Best for **bidirectional editor communication** - has a Godot plugin component.

### Two-Component System

1. **Godot Plugin** (`addons/godot_mcp/`) - runs inside the editor
2. **Node.js MCP Server** (`server/`) - bridges to Claude/AI

### Unique Features

- Real-time two-way communication with open editor
- Script reading/writing from within running editor
- Scene tree inspection while editor is active
- Project execution control

### When to Choose This Over Coding-Solo

- Need real-time editor state inspection
- Want to read/modify scripts while editor is open
- Need scene tree traversal from running editor instance
- Working primarily with Claude Desktop

---

## Alternative: bradypp/godot-mcp (54 stars)

Best for **safe analysis** with read-only mode and UID management.

### Unique Features

- Read-only mode for safe project analysis
- Strong path validation
- Godot 3.5+ backward compatibility
- Clean TypeScript codebase

---

## Godot Claude Skills (Companion Tools)

### Randroids-Dojo/Godot-Claude-Skills (10 stars)

Provides Claude Code skills (not MCP) for:
- GdUnit4 testing integration
- Web/desktop export helpers
- CI/CD pipeline config
- Python helper scripts

Install: Copy `skills/godot/` to `.claude/skills/`

### alexmeckes/godot-claude-skills (3 stars)

Four specialized skills:
- **godot-code-gen** - GDScript best practices, type hints, state machines
- **godot-live-edit** - Real-time editor control
- **godot-scene-design** - Scene files (.tscn), node hierarchies
- **godot-shader** - Shader authoring for 2D/3D

---

## Skills.sh Listings

Available via `npx skilladd`:
- **godot-llm-integration** - NobodyWho integration, signal architecture for LLM characters
- **godot-debugging** - Common errors, debugging techniques, troubleshooting
