# Voxel Systems Reference for Godot

## godot-voxel (Zylann) - Primary Recommendation

C++ GDExtension for volumetric terrain in Godot 4. 3.5k stars, MIT license, active development.

### Key Nodes

| Node | Purpose | Use Case |
|------|---------|----------|
| `VoxelTerrain` | Finite editable terrain | Bounded worlds, arenas |
| `VoxelLodTerrain` | Infinite terrain with LOD | Open worlds, exploration |
| `VoxelInstancer` | Procedural decoration | Foliage, rocks, grass |

### Meshers

| Mesher | Style | Description |
|--------|-------|-------------|
| `VoxelMesherBlocky` | Minecraft-like | Cubic voxels, multiple materials, baked AO |
| `VoxelMesherTransvoxel` | Smooth terrain | Transvoxel algorithm, LOD support |
| `VoxelMesherCubes` | Simple cubes | Colored cubes, no texturing |

### Streams (Persistence)

| Stream | Storage | Best For |
|--------|---------|----------|
| `VoxelStreamRegionFiles` | Region files on disk | Production games, large worlds |
| `VoxelStreamSQLite` | SQLite database | Simpler deployments, smaller worlds |
| `VoxelStreamScript` | Custom GDScript | Custom backends, network streaming |

### Generators

| Generator | Method | Use |
|-----------|--------|-----|
| `VoxelGeneratorNoise2D` | 2D heightmap noise | Classic terrain |
| `VoxelGeneratorNoise` | 3D noise | Caves, overhangs |
| `VoxelGeneratorFlat` | Flat plane | Testing, superflat |
| `VoxelGeneratorScript` | Custom GDScript | Biomes, structures |
| `VoxelGeneratorGraph` | Visual graph editor | Complex terrain |

### VoxelTool API

```gdscript
# Get the editing interface
var vt: VoxelTool = terrain.get_voxel_tool()

# Set channel (TYPE for block IDs, SDF for smooth)
vt.channel = VoxelBuffer.CHANNEL_TYPE

# Single block operations
vt.set_voxel(Vector3i(10, 64, 10), BlockTypes.STONE)
var block: int = vt.get_voxel(Vector3i(10, 64, 10))

# Area operations
vt.value = BlockTypes.AIR
vt.do_sphere(Vector3(10, 64, 10), 5.0)  # Sphere of air (explosion)

# Raycasting (block selection)
var result: VoxelRaycastResult = vt.raycast(origin, direction, max_dist)
if result:
    var hit: Vector3i = result.position        # Block hit
    var face: Vector3i = result.previous_position  # Adjacent (place here)
```

### Multiplayer Considerations

godot-voxel is primarily single-player focused. For multiplayer:

1. **Server generates terrain** using generators/streams
2. **Server sends chunk data** to clients via custom networking
3. **Edits go through server** validation before applying
4. **Region files** on server only; clients get data via network

```gdscript
# Server: serialize chunk for network transmission
func get_chunk_data(pos: Vector2i) -> PackedByteArray:
    var buffer := VoxelBuffer.new()
    buffer.create(16, 256, 16)
    terrain.get_voxel_tool().copy(
        Vector3i(pos.x * 16, 0, pos.y * 16),
        buffer, 0
    )
    return buffer.serialize()

# Client: apply received chunk
func apply_chunk_data(pos: Vector2i, data: PackedByteArray) -> void:
    var buffer := VoxelBuffer.new()
    buffer.deserialize(data)
    terrain.get_voxel_tool().paste(
        Vector3i(pos.x * 16, 0, pos.y * 16),
        buffer, 0
    )
```

### Installation

As GDExtension (recommended for Godot 4.x):
1. Download from GitHub releases
2. Extract to `addons/zylann.voxel/`
3. Restart editor - no plugin enable needed (auto-detected)

Or build from source for custom modifications.

---

## Custom Voxel Implementation (Alternative)

If not using godot-voxel, build a chunk system manually.

### Core Classes

```gdscript
# ChunkData - stores block IDs
class_name ChunkData extends RefCounted

const SIZE := 16
const HEIGHT := 256

var blocks: PackedInt32Array  # SIZE * HEIGHT * SIZE
var position: Vector2i
var dirty: bool = false

func _init(cx: int, cz: int) -> void:
    position = Vector2i(cx, cz)
    blocks.resize(SIZE * HEIGHT * SIZE)

func get_block(x: int, y: int, z: int) -> int:
    return blocks[x + y * SIZE * SIZE + z * SIZE]

func set_block(x: int, y: int, z: int, id: int) -> void:
    blocks[x + y * SIZE * SIZE + z * SIZE] = id
    dirty = true
```

```gdscript
# ChunkMesh - generates mesh from ChunkData
class_name ChunkMesher extends RefCounted

# Greedy meshing for performance
static func generate_mesh(data: ChunkData) -> ArrayMesh:
    var st := SurfaceTool.new()
    st.begin(Mesh.PRIMITIVE_TRIANGLES)

    for y in ChunkData.HEIGHT:
        for z in ChunkData.SIZE:
            for x in ChunkData.SIZE:
                var block := data.get_block(x, y, z)
                if block == 0:
                    continue
                # Check each face - only add if adjacent is air
                _add_visible_faces(st, data, x, y, z, block)

    st.generate_normals()
    return st.commit()
```

### Threading Chunk Generation

```gdscript
class_name ChunkManager extends Node3D

var _generation_queue: Array[Vector2i] = []
var _thread_pool := WorkerThreadPool

func _process(_delta: float) -> void:
    if _generation_queue.is_empty():
        return

    var chunk_pos := _generation_queue.pop_front()
    WorkerThreadPool.add_task(
        _generate_chunk_threaded.bind(chunk_pos)
    )

func _generate_chunk_threaded(pos: Vector2i) -> void:
    var data := _generate_terrain(pos)
    var mesh := ChunkMesher.generate_mesh(data)
    # Call deferred to return to main thread for scene tree ops
    call_deferred("_apply_chunk_mesh", pos, data, mesh)
```

### Region File Format (For Persistence)

```gdscript
# Region: 32x32 chunks per file
# Header: 4096 bytes (1024 entries * 4 bytes offset)
# Each chunk: compressed with PackedByteArray.compress()

class_name RegionFile extends RefCounted

const REGION_SIZE := 32
const HEADER_SIZE := 4096

var _path: String
var _offsets: PackedInt32Array

func save_chunk(local_x: int, local_z: int, data: PackedByteArray) -> void:
    var compressed := data.compress(FileAccess.COMPRESSION_ZSTD)
    var file := FileAccess.open(_path, FileAccess.READ_WRITE)
    # Write compressed chunk at end of file
    file.seek_end(0)
    var offset := file.get_position()
    file.store_32(compressed.size())
    file.store_buffer(compressed)
    # Update header
    var index := local_x + local_z * REGION_SIZE
    _offsets[index] = offset
    file.seek(index * 4)
    file.store_32(offset)
```
