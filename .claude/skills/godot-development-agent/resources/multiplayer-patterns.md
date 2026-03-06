# Godot 4 Multiplayer Patterns Reference

## Server-Authoritative Architecture

For a voxel factions game, the server must be the source of truth for:
- Player positions and movement validation
- Block edits (place/break) with claim permission checks
- Faction state (membership, claims, diplomacy)
- Economy transactions (atomic, idempotent)
- Combat resolution

### Architecture Diagram

```
Client (Godot)                     Server (Godot Headless)
┌──────────────┐                  ┌──────────────────────┐
│ Input Capture │──Intent Msgs──►│ Validation Layer     │
│ Rendering     │                 │  ├─ Movement check   │
│ Prediction    │                 │  ├─ Edit permissions  │
│ UI            │                 │  └─ Rate limiting     │
│               │◄──State Sync──│ Simulation Layer     │
│ Interpolation │                 │  ├─ World state       │
│ Reconciliation│                 │  ├─ Factions/Claims   │
└──────────────┘                  │  └─ Economy ledger    │
                                  │ Replication Layer    │
                                  │  ├─ AOI management   │
                                  │  ├─ Chunk streaming   │
                                  │  └─ Delta sync        │
                                  │ Persistence Layer    │
                                  │  ├─ Region files      │
                                  │  └─ DB (claims/econ) │
                                  └──────────────────────┘
```

## Interest Management (AOI)

Track which chunks each player is subscribed to. Only send updates for subscribed chunks.

```gdscript
class_name AOIManager extends Node

var _subscriptions: Dictionary = {}  # peer_id -> Array[Vector2i]
var _view_distance: int = 8  # chunks

func update_player_aoi(peer_id: int, world_pos: Vector3) -> void:
    var center := Vector2i(
        floori(world_pos.x / ChunkManager.CHUNK_SIZE),
        floori(world_pos.z / ChunkManager.CHUNK_SIZE)
    )

    var new_set: Array[Vector2i] = []
    for x in range(center.x - _view_distance, center.x + _view_distance + 1):
        for z in range(center.y - _view_distance, center.y + _view_distance + 1):
            if Vector2(x - center.x, z - center.y).length() <= _view_distance:
                new_set.append(Vector2i(x, z))

    var old_set: Array[Vector2i] = _subscriptions.get(peer_id, [])

    # Send new chunks
    for chunk_pos in new_set:
        if chunk_pos not in old_set:
            _send_chunk_snapshot(peer_id, chunk_pos)

    # Unload old chunks
    for chunk_pos in old_set:
        if chunk_pos not in new_set:
            _send_chunk_unload(peer_id, chunk_pos)

    _subscriptions[peer_id] = new_set
```

## Delta Sync Strategy

### Voxel Edits

```gdscript
# Server broadcasts edit to all subscribed peers
@rpc("authority", "call_remote", "reliable")
func apply_voxel_delta(cx: int, cz: int, edits: Array) -> void:
    for edit in edits:
        var pos: Vector3i = edit["pos"]
        var block_id: int = edit["block"]
        chunk_manager.set_block(pos, block_id)
```

### Entity Sync

```gdscript
# Use MultiplayerSynchronizer with visibility filters
# Priority: nearby players > projectiles > dropped items > distant entities

# Visibility filter example
func _on_visibility_changed(peer_id: int) -> void:
    var player_pos: Vector3 = get_player_position(peer_id)
    var entity_pos: Vector3 = global_position
    var dist := player_pos.distance_to(entity_pos)

    synchronizer.set_visibility_for(peer_id, dist < SYNC_RADIUS)
```

## Message Reliability Classes

| Category | Transport | Examples |
|----------|-----------|----------|
| Reliable | `"reliable"` | Claims, economy, inventory, faction ops, admin config |
| Unreliable Ordered | `"unreliable_ordered"` | Movement sync, frequent entity state |
| Unreliable | `"unreliable"` | Particle effects, transient combat VFX |

## Dedicated Server Setup

### Headless Export

1. Create a "Server" export preset targeting Linux (for hosting)
2. Enable "Dedicated Server" option in export
3. Conditionally disable rendering:

```gdscript
func _ready() -> void:
    if DisplayServer.get_name() == "headless":
        # Disable unnecessary systems
        get_tree().paused = false
        # Start server networking
        var peer := ENetMultiplayerPeer.new()
        peer.create_server(7777, 200)
        multiplayer.multiplayer_peer = peer
        print("Server started on port 7777")
```

### Server Tick Rate

```gdscript
# In project.godot or via code
Engine.physics_ticks_per_second = 30  # 30 Hz server tick
Engine.max_physics_steps_per_frame = 1  # Prevent spiral of death
```

## Anti-Cheat Validation (Server-Side)

```gdscript
# Movement validation
func _validate_movement(peer_id: int, new_pos: Vector3) -> bool:
    var old_pos: Vector3 = _player_positions[peer_id]
    var max_speed: float = 10.0  # blocks per second
    var dt: float = get_physics_process_delta_time()
    var max_dist: float = max_speed * dt * 1.5  # 50% tolerance

    if old_pos.distance_to(new_pos) > max_dist:
        # Reject and correct
        _send_position_correction.rpc_id(peer_id, old_pos)
        return false
    return true

# Block edit validation
func _validate_edit(peer_id: int, pos: Vector3i, block_id: int) -> bool:
    var player_pos: Vector3 = _player_positions[peer_id]
    if player_pos.distance_to(Vector3(pos)) > EDIT_RANGE:
        return false  # Too far

    var chunk_pos := Vector2i(pos.x / 16, pos.z / 16)
    if not claims_manager.can_edit(peer_id, chunk_pos):
        return false  # No permission

    return true
```

## Connection Lifecycle

```gdscript
func _ready() -> void:
    multiplayer.peer_connected.connect(_on_peer_connected)
    multiplayer.peer_disconnected.connect(_on_peer_disconnected)
    multiplayer.connected_to_server.connect(_on_connected)
    multiplayer.connection_failed.connect(_on_connection_failed)

func _on_peer_connected(id: int) -> void:
    # 1. Authenticate
    # 2. Send world seed / config
    # 3. Initialize AOI from spawn position
    # 4. Stream initial chunks
    pass

func _on_peer_disconnected(id: int) -> void:
    # 1. Save player state
    # 2. Clean up AOI subscriptions
    # 3. Notify faction members
    # 4. Remove player entity
    pass
```
