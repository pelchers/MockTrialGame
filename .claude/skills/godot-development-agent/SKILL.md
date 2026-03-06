---
name: godot-development-agent
description: Godot 4.x game development with GDScript/C#, scene architecture, multiplayer networking, voxel systems, editor operations, and debugging. Use when building Godot games, writing GDScript/C#, designing scenes, implementing multiplayer, working with voxel terrain, managing Godot editor operations, or debugging Godot projects. Works standalone without MCP.
---

# Godot Development Agent Skill

Comprehensive Godot 4.x game development skill covering project structure, GDScript/C# patterns, multiplayer networking, voxel systems, editor operations, scene management, testing, and debugging. Includes full editor operation knowledge normally provided by MCP servers, so it functions with or without an MCP connection.

## Project Structure

```
project-root/
├── project.godot          # Engine config (version, features, autoloads)
├── export_presets.cfg      # Export configurations (commit to VCS)
├── .godot/                 # Editor cache (do NOT commit)
├── addons/                 # Third-party plugins (godot-voxel, GUT, etc.)
├── src/                    # All source scripts
│   ├── autoloads/          # Singleton scripts
│   ├── core/               # Shared types, constants, event bus
│   ├── player/             # Player scenes + scripts
│   ├── world/              # World/chunk management
│   ├── factions/           # Faction system
│   ├── economy/            # Shop/economy
│   ├── networking/         # Multiplayer layer
│   ├── admin/              # Admin config UI
│   └── ui/                 # UI scenes
├── assets/                 # Art, audio, models (collocated with scenes)
├── shaders/                # Shared shader files
├── tests/                  # GUT test scripts
└── export_presets.cfg      # Export configurations
```

**Naming**: `snake_case` for files/folders, `PascalCase` for C# only. Prefer `.tres` over `.res` for VCS.

**File types**: `.gd` (script), `.tscn` (scene, text), `.tres` (resource, text), `.res` (resource, binary), `.gdshader` (shader), `.cfg` (config), `.import` (auto-generated metadata).

## GDScript Patterns (Godot 4.x)

### Script Member Ordering

```gdscript
@tool                          # 1. Tool mode
class_name MyClass             # 2. Class name
extends Node3D                 # 3. Base class

signal health_changed(new_hp)  # 4. Signals
signal died

enum State { IDLE, MOVING }    # 5. Enums & constants
const MAX_HP := 100

@export var speed: float = 5.0 # 6. Exported vars
@export var mesh: MeshInstance3D

var hp: int = MAX_HP           # 7. Public vars
var _internal: bool = false    # 8. Private vars (underscore prefix)

@onready var _sprite := $Sprite3D  # 9. Onready refs

func _ready() -> void:         # 10. Virtual methods
    pass

func take_damage(amount: int) -> void:  # 11. Public methods
    hp -= amount
    health_changed.emit(hp)

func _apply_effect() -> void:  # 12. Private methods
    pass
```

### Static Typing (Always Use)

```gdscript
var name: String = "Player"
var pos: Vector3 = Vector3.ZERO
var items: Array[String] = []
func calculate(base: float, mult: float) -> float:
    return base * mult
```

Never combine `@onready` and `@export` on the same variable. Enable static type warnings in Project Settings (Godot 4.2+).

### Signals

```gdscript
signal chunk_loaded(chunk_pos: Vector2i)
chunk_manager.chunk_loaded.connect(_on_chunk_loaded)
chunk_loaded.emit(Vector2i(cx, cz))
```

### Autoloads

Register in Project > Project Settings > Autoload. Use for: game state, network manager, event bus. Avoid overuse - prefer signals and dependency injection.

## Scene Architecture

- **One controller script per scene root** - name matches script
- **Composition over inheritance** - attach behavior via child nodes
- **Limit inheritance to one layer** - prefer composition
- **Scene-unique nodes** (`%NodeName`) for non-fragile references
- **Self-contained scenes** - only reference children, not siblings/parents
- **Component pattern**: HealthComponent, FactionComponent, InputComponent as child nodes

## Editor Operations (MCP-Equivalent Knowledge)

These operations can be performed via MCP tools or directly via Godot CLI/editor. This skill provides the knowledge for both paths.

### Project Management

```bash
# Launch editor for project
godot --editor --path /path/to/project

# Run project in debug mode
godot --path /path/to/project

# Run specific scene
godot --path /path/to/project res://scenes/test_scene.tscn

# Headless mode (dedicated server)
godot --headless --path /path/to/project

# Get version
godot --version

# Export project
godot --headless --path /path/to/project --export-release "Linux" output/server
godot --headless --path /path/to/project --export-release "Windows" output/client.exe
```

### Scene File Operations (.tscn format)

Scenes are text files editable without the editor:

```ini
[gd_scene load_steps=3 format=3 uid="uid://abc123"]

[ext_resource type="Script" path="res://src/player/player.gd" id="1"]
[ext_resource type="Texture2D" path="res://assets/player.png" id="2"]

[node name="Player" type="CharacterBody3D"]
script = ExtResource("1")
speed = 5.0

[node name="Sprite3D" type="Sprite3D" parent="."]
texture = ExtResource("2")

[node name="CollisionShape3D" type="CollisionShape3D" parent="."]
shape = SubResource("BoxShape3D_abc")
```

**Creating scenes programmatically:**

```gdscript
# Create a new scene via code
var scene := PackedScene.new()
var root := Node3D.new()
root.name = "MyScene"
var child := MeshInstance3D.new()
child.name = "Mesh"
root.add_child(child)
child.owner = root  # Required for PackedScene
scene.pack(root)
ResourceSaver.save(scene, "res://scenes/my_scene.tscn")
```

### Node Operations

```gdscript
# Add node to existing scene
var node := Node3D.new()
node.name = "NewNode"
node.position = Vector3(10, 0, 5)
parent_node.add_child(node)
node.owner = get_tree().edited_scene_root  # For editor persistence

# Edit node properties
node.position = Vector3(1, 2, 3)
node.scale = Vector3(2, 2, 2)
node.visible = false

# Remove node
node.queue_free()

# Find nodes
var found := get_tree().get_nodes_in_group("enemies")
var child := get_node("Path/To/Child")
var unique := get_node("%UniqueName")  # Scene-unique
```

### Resource Management

```gdscript
# Load resources
var texture := load("res://assets/block_atlas.png") as Texture2D
var scene := preload("res://scenes/player.tscn")  # Compile-time load

# Save resources
var data := MyResource.new()
ResourceSaver.save(data, "res://data/config.tres")

# UID system (Godot 4.4+) - survives file renames
var uid := ResourceUID.id_to_text(ResourceLoader.get_resource_uid("res://my_file.gd"))
```

### Debug Output Capture

```gdscript
# Print levels
print("Info message")
print_rich("[color=yellow]Warning[/color]")
push_warning("Warning message")  # Shows in editor Warnings panel
push_error("Error message")      # Shows in editor Errors panel
print_debug("Debug with stack trace")

# Custom logger autoload
class_name Logger extends Node
static func info(msg: String) -> void:
    print("[INFO] ", msg)
static func warn(msg: String) -> void:
    push_warning("[WARN] " + msg)
static func error(msg: String) -> void:
    push_error("[ERROR] " + msg)
```

### Export & MeshLibrary

```gdscript
# Export MeshLibrary from scene (for GridMap/voxel)
# In editor: Scene > Convert To > MeshLibrary
# Or via code:
var lib := MeshLibrary.new()
for i in range(mesh_count):
    lib.create_item(i)
    lib.set_item_mesh(i, meshes[i])
    lib.set_item_name(i, names[i])
ResourceSaver.save(lib, "res://resources/blocks.meshlib")
```

## Multiplayer API

### Authority System

```gdscript
player_node.set_multiplayer_authority(peer_id)
if is_multiplayer_authority():
    process_input()
# Dedicated server detection
if DisplayServer.get_name() == "headless":
    _start_server()
```

### RPCs

```gdscript
@rpc("any_peer", "call_local", "reliable")
func place_block(pos: Vector3i, block_id: int) -> void:
    if multiplayer.is_server():
        if _validate_placement(pos, block_id):
            _apply_block(pos, block_id)
            place_block.rpc(pos, block_id)

@rpc("authority", "call_remote", "unreliable_ordered")
func sync_position(pos: Vector3, rot: float) -> void:
    global_position = pos
    rotation.y = rot
```

### Transport Setup

```gdscript
# Server (ENet)
var peer := ENetMultiplayerPeer.new()
peer.create_server(7777, 200)
multiplayer.multiplayer_peer = peer

# Client
var peer := ENetMultiplayerPeer.new()
peer.create_client("127.0.0.1", 7777)
multiplayer.multiplayer_peer = peer
```

| Transport | Class | Use Case |
|-----------|-------|----------|
| ENet (UDP) | `ENetMultiplayerPeer` | Default, low-latency |
| WebSocket | `WebSocketMultiplayerPeer` | Browser clients |
| WebRTC | `WebRTCMultiplayerPeer` | P2P, NAT traversal |

### MultiplayerSynchronizer & Spawner

Configure via editor Replication tab. Spawn properties sent once; Sync properties sent continuously. Use visibility filters for AOI.

## Voxel Systems

### godot-voxel Plugin (Zylann - 3.5k stars)

```gdscript
var vt: VoxelTool = terrain.get_voxel_tool()
vt.channel = VoxelBuffer.CHANNEL_TYPE
vt.set_voxel(position, block_id)
# Raycast
var result: VoxelRaycastResult = vt.raycast(origin, direction, 10.0)
if result:
    var hit: Vector3i = result.position
    var place: Vector3i = result.previous_position
```

Key nodes: `VoxelTerrain`, `VoxelLodTerrain`, `VoxelInstancer`. Meshers: `VoxelMesherBlocky` (Minecraft-style), `VoxelMesherTransvoxel` (smooth). Streams: `VoxelStreamRegionFiles`, `VoxelStreamSQLite`.

## Testing with GUT

```gdscript
extends GutTest
func test_faction_create() -> void:
    var mgr := FactionManager.new()
    add_child(mgr)
    var result := mgr.create("IronWolves", "player_1")
    assert_true(result.success)
    assert_eq(mgr.get_faction_count(), 1)
```

Run CLI: `godot --headless -s addons/gut/gut_cmdln.gd`

## Debugging Techniques

- **Breakpoints**: Click line gutter in Script Editor
- **Remote Inspector**: Debug > Remote Tree while running
- **Network Profiler**: Debugger > Network for per-node traffic
- **Monitors**: FPS, memory, node count, physics, rendering
- **Common errors**: Null access on freed nodes (use `is_instance_valid()`), signal not connected (verify with `is_connected()`), authority mismatch (check `get_multiplayer_authority()`)

## Performance Patterns

- Use `@onready` not `get_node()` in `_process()`
- Object pooling for projectiles, particles
- `WorkerThreadPool` for chunk generation
- `RenderingServer`/`PhysicsServer3D` direct API for mass instances
- Static typing enables GDScript compiler optimizations
- `MultiMeshInstance3D` for instanced rendering (foliage, decorations)

## Key Resources

For detailed reference, see:
- `resources/multiplayer-patterns.md` - Full networking architecture
- `resources/mcp-setup-guide.md` - MCP server configuration for all editors
- `resources/voxel-reference.md` - godot-voxel API and chunk system details
- `resources/editor-operations-reference.md` - Complete editor tool operations
