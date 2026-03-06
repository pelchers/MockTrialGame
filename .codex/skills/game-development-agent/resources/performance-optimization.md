# Game Performance Optimization Reference

Comprehensive reference for profiling, optimizing, and benchmarking game performance across CPU, GPU, memory, networking, and scripting layers. Written with Godot 4.x and voxel-based multiplayer games in mind, but broadly applicable.

---

## 1. Profiling Fundamentals

### 1.1 CPU Profiling

**Sampling profilers** periodically interrupt execution and record the call stack. Low overhead (~2-5%) makes them suitable for production builds. Examples: Godot built-in profiler, Tracy, Intel VTune, Visual Studio Performance Profiler.

**Instrumentation profilers** insert measurement code at function entry/exit. Higher accuracy but greater overhead (10-30%). Use for targeted deep-dives, not always-on measurement. Examples: custom `OS.get_ticks_usec()` wrappers, Tracy instrumented zones.

**Key metrics to capture:**
- Frame time (target 16.66 ms for 60 FPS, 33.33 ms for 30 FPS)
- Per-system time (physics, AI, rendering, scripting, networking)
- GC pause duration and frequency (C#/GDScript)
- Cache miss rates (VTune, `perf stat`)

### 1.2 GPU Profiling

**RenderDoc** -- Free, open-source frame debugger. Captures a single frame and lets you inspect every draw call, shader, texture binding, and pipeline state. Essential for diagnosing overdraw, shader bottlenecks, and incorrect render state.

**Vendor-specific tools:**
- NVIDIA Nsight Graphics -- GPU trace, shader profiling, warp occupancy
- AMD Radeon GPU Profiler (RGP) -- wavefront occupancy, cache hit rates
- Intel GPA -- integrated and discrete GPU analysis
- PIX (Xbox/Windows) -- GPU captures, timing, memory, D3D12 debugging

**Godot-specific:** The built-in profiler shows time spent in `_process`, `_physics_process`, and rendering. The Monitor tab tracks FPS, draw calls, vertices, objects, and VRAM usage in real time.

### 1.3 Memory Profiling

Track three categories:
1. **Allocations** -- frequency, size distribution, allocation source
2. **Fragmentation** -- ratio of free memory to largest contiguous free block
3. **Leaks** -- resources that grow monotonically without release

Tools: Godot's Debugger > Memory tab, Visual Studio Diagnostic Tools, Valgrind/Massif (Linux), Tracy memory zones, AddressSanitizer.

### 1.4 Frame Time Analysis

A frame is **CPU-bound** when the CPU finishes its work after the GPU has already completed the previous frame. The GPU sits idle waiting for the next command buffer.

A frame is **GPU-bound** when the GPU is still rendering while the CPU has already submitted the next frame and is waiting. The CPU stalls on `present` or swap chain acquisition.

**Diagnosis approach:**
1. Measure CPU frame time and GPU frame time independently
2. If CPU time >> GPU time: optimize game logic, physics, scripting
3. If GPU time >> CPU time: optimize draw calls, shaders, resolution
4. If both are near budget: balanced load; optimize the larger contributor first

### 1.5 Profiling Tools by Engine

| Tool | Type | Platform | Notes |
|------|------|----------|-------|
| Godot Profiler | CPU/Script | All | Built-in, shows per-function and per-node time |
| Godot Monitor | Rendering | All | Draw calls, vertices, objects, VRAM |
| Tracy | CPU/Memory | All | Sub-microsecond zones, lock tracking, frame images |
| RenderDoc | GPU | Windows/Linux | Frame capture, draw call inspection |
| PIX | GPU/CPU | Windows/Xbox | D3D12 focused, GPU timing, memory |
| Intel VTune | CPU | Windows/Linux | Sampling, threading, cache analysis |
| NVIDIA Nsight | GPU | Windows/Linux | Shader debugging, occupancy, roofline |
| AMD RGP | GPU | Windows/Linux | Wavefront analysis, barrier tracking |

---

## 2. CPU Optimization

### 2.1 Data-Oriented Design and Cache Optimization

Modern CPUs fetch memory in **cache lines** (typically 64 bytes). A cache miss costs 100-300 cycles versus 3-4 cycles for an L1 hit. Organizing data for sequential access is the single most impactful CPU optimization.

**Principles:**
- Keep hot data contiguous in memory
- Avoid pointer-chasing (linked lists, tree nodes scattered in memory)
- Prefer arrays and flat data structures
- Minimize struct size to fit more elements per cache line
- Separate hot fields from cold fields (split frequently-read data from rarely-read data)

### 2.2 AoS vs SoA Memory Layouts

**Array of Structures (AoS):**
```
struct Entity { float x, y, z; float health; int type; };
Entity entities[1000];
```
- Intuitive, maps to OOP thinking
- Good when you access all fields of one entity together
- Poor cache utilization when iterating over a single field across many entities

**Structure of Arrays (SoA):**
```
struct Entities {
    float x[1000], y[1000], z[1000];
    float health[1000];
    int type[1000];
};
```
- Excellent cache utilization for single-field iteration (e.g., update all positions)
- Ideal for SIMD: contiguous float arrays can be loaded into vector registers directly
- Can achieve 3-10x speedup for data-parallel operations

**Hybrid AoSoA:** Groups of SIMD-width structs (e.g., 8 entities per mini-struct) combine the cache locality of SoA with the data grouping of AoS. Used in advanced ECS implementations.

### 2.3 Branch Prediction and Branchless Programming

CPU branch predictors achieve 95-99% accuracy on predictable patterns. Unpredictable branches (random data, hash lookups) cause pipeline stalls of 10-20 cycles each.

**Strategies:**
- Sort data to make branches predictable (e.g., sort entities by type before processing)
- Use conditional moves or ternary operators that compile to `cmov` instructions
- Replace if/else with arithmetic: `result = a * condition + b * (1 - condition)`
- Use lookup tables instead of switch statements for unpredictable cases
- Profile before optimizing: branch mispredictions are measurable with VTune/`perf`

### 2.4 SIMD/Vectorization

SIMD (Single Instruction, Multiple Data) processes 4-16 values in parallel using vector registers (SSE: 4 floats, AVX2: 8 floats, AVX-512: 16 floats, NEON: 4 floats on ARM).

**Application areas in games:**
- Transform calculations (matrix multiply, vector normalize)
- Physics broadphase (AABB overlap tests)
- Particle updates (position += velocity * dt for thousands of particles)
- Audio mixing (summing sample buffers)
- Voxel operations (batch block comparisons during meshing)

**Practical tips:**
- Use compiler auto-vectorization by writing simple loops over flat arrays (SoA layout)
- Avoid data-dependent branches inside vectorized loops
- Align data to 16/32-byte boundaries for optimal SIMD loads
- In Godot: C++ GDExtension or Rust for SIMD-critical paths

### 2.5 Multithreading Strategies

#### Job/Task Systems
Break work into small units (0.05-0.5 ms each) submitted to a thread pool. Workers pull from queues. Dependencies are expressed as DAGs (directed acyclic graphs), not mutexes.

#### Thread Pools
Create threads equal to physical core count minus 1-2 (reserve for main thread and OS). Reuse threads to avoid creation/destruction overhead (thread creation costs 10,000+ cycles).

#### Worker Thread Allocation (typical split)
- **Main thread:** Game logic, scene tree, rendering submission
- **Physics thread:** Godot runs physics on a separate thread by default
- **Audio thread:** Mixing and DSP processing
- **Networking thread:** Packet receive/send, serialization
- **AI threads:** Pathfinding, behavior tree evaluation
- **Voxel threads:** Chunk generation, meshing, LOD computation

#### Lock-Free Patterns
- **Atomic operations:** Compare-and-swap for counters, flags, simple state machines
- **Lock-free queues:** SPSC (single-producer single-consumer) ring buffers for thread communication
- **Double buffering:** Write to one buffer while reading the other; swap at frame boundary
- **Read-copy-update (RCU):** Readers never block; writers copy, modify, atomically swap pointer

### 2.6 Amortization (Spreading Work Across Frames)

Not all work must complete in a single frame. Spread expensive operations:
- **AI updates:** Evaluate 10% of agents per frame, cycling through all in 10 frames
- **Pathfinding:** Compute one path per frame, queue requests
- **Visibility checks:** Rebuild occlusion every N frames or on camera movement threshold
- **LOD transitions:** Transition one chunk per frame rather than all at once
- **Physics:** Use Godot's `physics_ticks_per_second` to decouple physics rate from render rate

**Budget example at 60 FPS (16.66 ms frame):**
| System | Budget |
|--------|--------|
| Rendering submission | 3-4 ms |
| Physics | 3-4 ms |
| Game logic / scripting | 3-4 ms |
| Networking | 1-2 ms |
| AI | 1-2 ms |
| Audio | 0.5-1 ms |
| Headroom | 2-3 ms |

### 2.7 Object Pooling and Memory Reuse

Allocating and freeing objects during gameplay causes GC pressure (C#/GDScript) and fragmentation (native). Object pools pre-allocate a fixed-size array of reusable instances.

**When to pool:**
- Projectiles, particles, damage numbers, VFX
- Network messages and serialization buffers
- Voxel chunk meshes and collision shapes
- Any object created/destroyed more than ~10 times per second

**Implementation pattern:**
```gdscript
var pool: Array[Node3D] = []
func get_from_pool() -> Node3D:
    if pool.size() > 0:
        return pool.pop_back()
    return preloaded_scene.instantiate()

func return_to_pool(obj: Node3D) -> void:
    obj.visible = false
    pool.push_back(obj)
```

### 2.8 String Optimization

String operations are deceptively expensive: concatenation allocates new memory, comparisons are O(n), and hashing happens at runtime.

**Godot-specific optimizations:**
- Use `StringName` for identifiers, signal names, node paths -- these are interned (hashed once, compared by pointer thereafter)
- Use `&"my_string"` syntax in GDScript 4.x to create StringName literals
- Cache `NodePath` lookups: call `get_node()` once in `_ready()`, store the reference
- Avoid string formatting in hot loops; use numerical IDs instead
- `StringName` comparisons are O(1) versus O(n) for regular String

---

## 3. GPU Optimization

### 3.1 Draw Call Reduction

Each draw call has CPU overhead for state setup (binding shaders, textures, uniforms). Target: under 1,000-2,000 draw calls for 60 FPS on mid-range hardware; under 200-500 on mobile.

**Batching:** Combine multiple meshes sharing the same material into a single draw call. Godot's MultiMeshInstance3D renders thousands of identical meshes in one call.

**GPU Instancing:** Render N copies of a mesh with per-instance data (transform, color) in a single draw call. Ideal for foliage, rocks, debris, repeated voxel block types.

**Indirect Rendering:** GPU fills draw call parameters from a compute buffer. Eliminates CPU-side culling entirely; the GPU decides what to draw. Used in advanced voxel engines for chunk rendering.

**Material consolidation:** Fewer unique materials means fewer state changes. Use texture atlases to combine materials. Godot's SRP sorts draw calls by material to minimize state changes.

### 3.2 Shader Optimization

**ALU vs Texture tradeoff:** Texture lookups cost 200-400 cycles on cache miss versus 1-4 cycles for arithmetic. Compute simple functions (gradients, noise) mathematically rather than from lookup textures when feasible.

**Branching in shaders:** GPU wavefronts/warps execute in lockstep (32-64 threads). If threads in a warp diverge on a branch, both paths execute (divergence penalty). Prefer:
- `step()`, `smoothstep()`, `mix()` over `if/else`
- Compile-time branching with `#ifdef` for feature toggles
- Early-out only when entire warps can skip (uniform conditions)

**Precision:** Use `lowp`/`mediump` where full precision is unnecessary (UV coordinates, color). Mobile GPUs execute mediump at 2x the rate of highp. Desktop GPUs typically ignore precision qualifiers.

**Shader LOD:** Use simpler shaders for distant objects. A 50-instruction shader at LOD0 can drop to 15 instructions at LOD2 with minimal visual difference.

### 3.3 Texture Optimization

**Compression formats:**

| Format | Bits/pixel | Platform | Quality |
|--------|-----------|----------|---------|
| BC1 (DXT1) | 4 | PC | Low-medium, no alpha |
| BC3 (DXT5) | 8 | PC | Medium, with alpha |
| BC7 | 8 | PC (modern) | High (PSNR > 42 dB) |
| ETC2 | 4-8 | Mobile (OpenGL ES 3) | Medium |
| ASTC 4x4 | 8 | Mobile (modern) | High (PSNR > 42 dB) |
| ASTC 6x6 | 3.56 | Mobile | Medium |
| ASTC 8x8 | 2 | Mobile | Low-medium |

**Mipmaps:** Pre-computed downscaled versions of textures. Reduce aliasing and improve cache hit rates for distant textures. Always enable for 3D textures. Cost: 33% extra VRAM.

**Texture Atlasing:** Combine multiple small textures into one large atlas. Reduces texture binding changes (state changes). Essential for voxel games where block textures can share a single atlas.

**Texture Streaming:** Load only the mip levels needed for current view distance. Saves VRAM by not loading full-resolution mips for distant objects. Godot supports this via `ResourceLoader` with threaded requests.

### 3.4 Overdraw Reduction

Overdraw occurs when the same pixel is shaded multiple times per frame. Indoor scenes with high depth complexity can waste 50-90% of fragment processing on overdraw.

**Strategies:**
- **Front-to-back sorting:** Render opaque objects nearest-first. The depth buffer rejects fragments behind already-drawn pixels via early-Z
- **Z-prepass:** Render depth-only pass first, then shade with depth test set to EQUAL. Eliminates overdraw entirely but adds an extra geometry pass
- **Avoid alpha testing:** Alpha-tested fragments disable early-Z on many GPUs. Use alpha-to-coverage or distance field rendering instead
- **Particle overdraw:** Limit particle count and size. Large, overlapping transparent particles are a major fill rate sink

### 3.5 Fill Rate Optimization

Fill rate = pixel output rate. Bottleneck when rendering at high resolutions or with expensive per-pixel shaders.

**Strategies:**
- **Resolution scaling:** Render at 75% resolution, upscale with FSR/bilinear. Godot supports `viewport.scaling_3d_scale`
- **Variable Rate Shading (VRS):** Shade peripheral screen regions at lower rate (2x2 or 4x4 per pixel). Supported in Godot via renderer settings
- **Simplify fullscreen passes:** Post-processing (bloom, SSAO, DOF) is pure fill rate cost. Use half-resolution buffers for expensive effects
- **Reduce transparency:** Transparent objects cannot use depth rejection and always cost full shading

### 3.6 Mesh Optimization

**Level of Detail (LOD):** Switch between mesh versions based on distance:
- LOD0: Full detail (within 10-20m)
- LOD1: 50% triangles (20-50m)
- LOD2: 25% triangles (50-100m)
- LOD3/Impostor: Billboard or 8-direction sprite (100m+)

Godot 4.x supports automatic LOD via `GeometryInstance3D.lod_bias` and mesh import settings.

**Mesh simplification:** Tools like MeshOptimizer, Simplygon, or Godot's import-time mesh simplification reduce vertex count while preserving silhouette.

**Impostors:** Replace distant 3D objects with textured quads rendered from multiple angles. Massive draw call and vertex savings for distant vegetation and buildings.

### 3.7 Occlusion Culling

Skip rendering objects hidden behind other geometry. Unlike frustum culling (which only removes objects outside the camera cone), occlusion culling removes objects inside the frustum but visually blocked.

**Methods:**
- **Software rasterization:** Rasterize simplified occluder meshes on CPU, test occludees against depth buffer. Used by Godot 4.x (enable via Project Settings > Rendering > Occlusion Culling)
- **Hardware occlusion queries:** GPU reports whether objects are visible. One-frame latency causes popping artifacts
- **Hierarchical Z-buffer (Hi-Z):** Mip-chain of the depth buffer for fast conservative visibility tests

**Best for:** Indoor environments, urban scenes, dense voxel worlds with walls and caves.

### 3.8 Compute Shader Usage

Offload parallel data processing to the GPU when:
- Work is highly parallel (thousands of independent items)
- Data is already on the GPU or will be consumed by rendering
- CPU is the bottleneck and GPU has spare capacity

**Game applications:** Particle simulation, terrain erosion, GPU-driven culling, voxel lighting propagation, fluid simulation, cloth physics, pathfinding on grids.

---

## 4. Memory Optimization

### 4.1 Memory Pools and Custom Allocators

**Pool allocators** pre-allocate blocks of fixed size. Allocation/deallocation is O(1) via free list. Zero fragmentation for same-sized objects. Ideal for voxel chunk data, network packets, particle structs.

**Linear/bump allocators** allocate sequentially from a buffer, free everything at once. Per-frame temporary allocations (scratch buffers, UI layout data) are ideal candidates. Allocation is a single pointer increment.

**Stack allocators** support LIFO deallocation. Good for recursive algorithms and temporary computation buffers.

### 4.2 Asset Streaming and Unloading

- Load assets on demand based on player position and camera direction
- Prioritize by: visibility > distance > size > importance
- Unload assets when player moves beyond threshold distance (with hysteresis to prevent thrashing)
- Use reference counting to know when assets are truly unused
- In Godot: `ResourceLoader.load_threaded_request()` for background loading
  - Step 1: `ResourceLoader.load_threaded_request("res://scene.tscn")`
  - Step 2: Poll `ResourceLoader.load_threaded_get_status()` in `_process`
  - Step 3: Retrieve with `ResourceLoader.load_threaded_get()` when ready

### 4.3 Texture Memory Budgets

Typical VRAM budgets:
- Mobile: 256-512 MB total, 128-256 MB for textures
- Console: 2-4 GB for textures (shared memory architectures)
- PC (mid-range): 4-6 GB VRAM, 2-3 GB for textures
- PC (high-end): 8-16 GB VRAM

**Budget checklist:**
- Audit texture sizes with Godot's Debugger > Video RAM tab
- Use compressed formats (BC7/ASTC) -- 4:1 to 8:1 compression over RGBA8
- Limit maximum texture resolution (2048x2048 for most game textures, 4096 for terrain/UI)
- Generate mipmaps (33% VRAM overhead but improves performance through better cache utilization)

### 4.4 Garbage Collection Avoidance

**GDScript:** Uses reference counting with cycle detection. Avoid creating temporary objects in hot loops. Pre-allocate arrays and dictionaries; reuse them with `clear()`.

**C# in Godot:** Uses .NET GC. Minimize allocations in `_Process`:
- Avoid LINQ in hot paths (creates iterator objects)
- Use `Span<T>` and `stackalloc` for temporary buffers
- Pool `StringBuilder` instances for string construction
- Cache delegates and lambdas (closures allocate heap objects)
- Use structs instead of classes for small, short-lived data
- GC pauses can spike to 1-5 ms; target zero allocations per frame in gameplay code

### 4.5 Reference Counting vs GC

| Aspect | Reference Counting | Tracing GC |
|--------|-------------------|------------|
| Pause time | None (deterministic) | Unpredictable pauses |
| Throughput | Lower (increment/decrement overhead) | Higher (batch collection) |
| Cycles | Cannot collect cycles without extra detection | Handles cycles naturally |
| Memory overhead | Per-object counter | Metadata + copy space |
| Best for | Real-time, latency-sensitive (GDScript) | Batch processing, complex graphs (C#) |

---

## 5. Voxel-Specific Optimization

### 5.1 Chunk Meshing Optimization

**Naive meshing:** Generate 2 triangles per visible face. A 16x16x16 chunk can produce up to 24,576 faces (worst case: checkerboard pattern). Extremely vertex-heavy.

**Face culling:** Only generate faces adjacent to air/transparent blocks. Reduces face count by 80-95% in typical terrain. Requires checking 6 neighbors per block.

**Greedy meshing:** Merges coplanar adjacent faces of the same block type into larger quads. Reduces vertex count by 50-90% over face culling alone. Algorithm: sweep each 2D slice, greedily extend rectangles using a bitmask. Tradeoff: more complex meshing code, slightly slower chunk rebuild.

**Run-based meshing:** Alternative to greedy meshing that extends quads in one direction only (rows). Faster to compute than full greedy meshing with similar vertex reduction. Used by the Sector's Edge voxel engine.

**Vertex pooling:** Reuse vertex buffer allocations across chunk rebuilds. Avoids GPU buffer creation/destruction overhead.

### 5.2 Chunk Loading/Unloading Strategies

- **View-distance based:** Load chunks within render distance, unload beyond render distance + hysteresis margin
- **Priority queue:** Sort pending chunk loads by distance to player, direction of movement, and LOD level
- **Rate limiting:** Load at most N chunks per frame to avoid frame spikes. godot-voxel defaults to ~8 ms per frame budget (`voxel/threads/main/time_budget_ms`)
- **Ring buffer pattern:** Maintain a fixed-size circular buffer of loaded chunks centered on the player. As the player moves, recycle the farthest chunks for new positions
- **Mesh block size:** godot-voxel defaults to 16x16x16 per mesh block. Increasing to 32x32x32 reduces draw calls but increases per-block rebuild time

### 5.3 LOD for Voxel Terrain

- **Octree-based LOD:** Distant chunks are represented at lower resolution. An octree naturally provides 2x reduction per level. 4-5 LOD levels can represent terrain visible for kilometers
- **Transvoxel algorithm:** Generates seamless transition meshes between LOD levels to avoid visible seams at boundaries
- **godot-voxel VoxelLodTerrain:** Built-in octree LOD with configurable `lod_distance`. Automatically generates lower-detail meshes for distant chunks
- **Mesh simplification LOD:** Reduce voxel resolution (2x2x2 blocks become 1 block) at each LOD level. Vertex count drops by ~8x per level
- **Vertex morphing:** Smoothly interpolate vertices between LOD levels to avoid popping

### 5.4 Octree and Sparse Voxel Octree (SVO)

**Regular octree:** Recursively subdivides space into 8 children. Only subdivide nodes containing mixed (surface) voxels. Solid or empty regions are stored as single leaf nodes. Memory savings: 10-100x over flat arrays for typical terrain.

**Sparse Voxel Octree (SVO):** Only stores occupied nodes. Enables efficient ray tracing, collision detection, and LOD. NVIDIA pioneered SVO-based rendering for gigavoxel scenes.

**Practical considerations:**
- Octrees have pointer-chasing overhead (poor cache behavior)
- Flat arrays with run-length encoding can outperform octrees for chunk-sized data
- Use octrees for world-level spatial indexing, flat arrays for per-chunk data

### 5.5 Multithreaded Chunk Generation

- Dedicate worker threads to chunk generation/meshing (godot-voxel does this automatically)
- Configure thread count: `voxel/threads/count/minimum` and `voxel/threads/count/margin_below_maximum`
- Reserve threads for main game systems (do not use 100% of CPU cores for voxel work)
- Use bulk operations (`do_sphere()`, `do_box()`, `paste()`) instead of per-voxel edits for efficiency
- Lock management: use `VoxelTool` which handles locking automatically; avoid manual lock management

### 5.6 Voxel Data Compression

- **Run-Length Encoding (RLE):** Compress runs of identical voxel IDs. Typical terrain compresses 4-20x
- **Palette compression:** Map block types to small indices (8-bit) instead of storing full material data per voxel
- **Sparse storage:** Only store non-air chunks. Skip entirely empty chunks
- **Delta compression for edits:** Store original terrain + list of player edits. Reconstruct modified chunks on load
- **Region files:** Group chunks into region files (e.g., 32x32 chunks per file) to reduce filesystem overhead. Match Minecraft's region file pattern

---

## 6. Networking Performance

### 6.1 Bandwidth Optimization

**Delta compression:** Send only what changed since the last acknowledged state. Unchanged entities cost just 1 bit (a "not changed" flag). Glenn Fiedler demonstrated reducing 17.38 Mbit/s to under 256 Kbit/s for 901 objects using delta + quantization + bit packing.

**Quantization:** Reduce precision to minimum acceptable levels:
- Positions: 0.5-2 mm precision (9-12 bits per axis for bounded ranges)
- Rotations: "Smallest three" quaternion encoding: 29 bits (2-bit index + 3x9-bit components)
- Velocities: 10-12 bits per axis with bounded maximum speed
- Health/resource values: Integer with known range, exact bit count

**Bit packing:** Write non-byte-aligned values directly into a bit stream:
- Booleans: 1 bit
- Enums with 3 values: 2 bits (not 32)
- Entity IDs: log2(max_entities) bits
- Relative indices: variable-length encoding (4 bits for offsets 1-8, 7 bits for 9-40, 12 bits for 41+)

**Variable-length encoding:** Small values use fewer bytes. Similar to Protocol Buffers varint encoding. Entity deltas are typically small, making this very effective.

### 6.2 Tick Rate vs Frame Rate Decoupling

- **Server tick rate:** 20-60 Hz (20 Hz for MMO-scale, 60 Hz for competitive FPS)
- **Client frame rate:** 60-240 Hz (independent of tick rate)
- **Interpolation:** Clients render between two known server states, adding one tick of latency for smooth visuals
- **Extrapolation/prediction:** Client predicts local player state ahead of server confirmation. Server corrects with authoritative state; client reconciles
- **Snapshot buffering:** Buffer 2-3 snapshots on client to absorb network jitter

### 6.3 Server Performance

**Entity sleeping:** Skip processing for entities with no recent state changes. Physics engines sleep rigid bodies at rest. Extend this to AI, network sync, and animation.

**Interest management / Area of Interest (AOI):** Only send state updates for entities relevant to each player. Methods:
- **Distance-based:** Send entities within N meters of the player
- **Chunk-based:** Send entities in loaded chunks (natural fit for voxel games)
- **Sector/zone-based:** Divide world into sectors; subscribe players to their sector and neighbors
- **Priority-based:** High-priority entities (nearby, visible, interacting) get more bandwidth

**Spatial partitioning:** Use grids, octrees, or k-d trees for fast proximity queries. A uniform grid with cell size matching AOI radius provides O(1) neighbor lookups for 2D worlds.

### 6.4 Connection Quality Adaptation

- Detect packet loss rate and RTT per client
- Reduce update frequency for high-loss connections (send every 2nd or 3rd tick)
- Increase redundancy for lossy connections (send last N states, not just latest)
- Adjust compression aggressiveness based on available bandwidth
- Implement bandwidth throttling: server caps bytes/sec per client

---

## 7. Scripting Performance

### 7.1 GDScript Optimization Patterns

**Static typing:** Typed GDScript generates optimized bytecode. Benchmarks show up to 47% speedup for tight loops. Always use types in performance-critical code:
```gdscript
# Slow (dynamic)
var speed = 10.0
# Fast (typed)
var speed: float = 10.0
```

**StringName for identifiers:** Use `&"identifier"` for signal names, input actions, group names. Pointer comparison (O(1)) vs string comparison (O(n)).

**Cache node references:**
```gdscript
# Slow -- traverses scene tree every call
func _process(delta):
    get_node("Player/Sprite3D").visible = true

# Fast -- cached reference
@onready var sprite: Sprite3D = $Player/Sprite3D
func _process(delta):
    sprite.visible = true
```

**Avoid per-frame allocations:**
- Pre-allocate arrays and dictionaries in `_ready()`
- Use `array.resize()` instead of repeated `append()`
- Avoid creating temporary `Vector3`/`Transform3D` in tight loops (though Godot optimizes these as value types)

**Use built-in methods over manual loops:**
- `array.sort()` is faster than a GDScript sort implementation
- `PackedFloat32Array` operations are faster than `Array[float]` for bulk math

### 7.2 C# vs GDScript Performance

| Operation | GDScript | C# | Ratio |
|-----------|----------|-----|-------|
| Tight math loop | 1x (baseline) | 3-10x faster | C# wins |
| Engine API calls | ~1x | ~1x (marshaling overhead) | Similar |
| String operations | 1x | 2-5x faster | C# wins |
| Dictionary access | 1x | 1.5-3x faster | C# wins |
| Scene tree operations | 1x | ~0.8-1x (marshaling) | GDScript wins slightly |
| Development iteration | Fast (hot reload) | Slower (compile step) | GDScript wins |

**Rule of thumb:** Use GDScript for gameplay logic, UI, and anything touching the scene tree heavily. Use C# for computation-heavy systems: pathfinding, procedural generation, complex AI, economy simulation, data processing.

### 7.3 When to Use C++ GDExtension

Move to GDExtension when:
- C#/GDScript profiling shows a specific function consuming >30% of frame time
- The operation is data-parallel and would benefit from SIMD
- You need to integrate a C/C++ library (physics, audio DSP, compression)
- Voxel meshing or chunk generation is too slow in scripted languages

Performance hierarchy: GDScript (1x) < C# (3-10x) < C++ GDExtension (10-50x for compute)

### 7.4 Common GDScript Pitfalls

- **Dictionary lookups in hot loops:** Each lookup involves hashing and comparison. Cache results in local variables
- **Repeated `get_node()` calls:** Traverses the scene tree each time. Cache in `@onready` variables
- **String concatenation:** Creates new string objects. Use `%` formatting or `StringName` for identifiers
- **Signal overhead:** Connecting/disconnecting signals at runtime has overhead. Prefer static connections in the editor for fixed relationships
- **Untyped variables:** Prevent bytecode optimization. Always add type annotations in performance-critical code
- **`_process()` on inactive nodes:** Nodes with `_process()` that rarely do work still get called every frame. Use `set_process(false)` and enable only when needed

---

## 8. Loading and Streaming

### 8.1 Async Resource Loading in Godot

```gdscript
# Step 1: Request loading on background thread
ResourceLoader.load_threaded_request("res://levels/world_chunk.tscn", "", true)

# Step 2: Poll progress in _process
func _process(_delta: float) -> void:
    var progress: Array = []
    var status := ResourceLoader.load_threaded_get_status("res://levels/world_chunk.tscn", progress)
    if status == ResourceLoader.THREAD_LOAD_LOADED:
        var scene: PackedScene = ResourceLoader.load_threaded_get("res://levels/world_chunk.tscn")
        _on_chunk_loaded(scene)
    elif status == ResourceLoader.THREAD_LOAD_IN_PROGRESS:
        loading_bar.value = progress[0] * 100.0
```

Setting `use_sub_threads` (3rd parameter) to `true` enables parallel loading of sub-resources (textures, meshes, materials).

### 8.2 Level Streaming and Seamless Worlds

**Chunk-based streaming (ideal for voxel games):**
1. Divide world into fixed-size chunks (16x16 or 32x32 voxel columns)
2. Maintain a "loaded ring" of chunks around the player
3. As the player moves across chunk boundaries, load new chunks ahead and unload behind
4. Use a priority queue: closest chunks first, direction of movement weighted higher

**Implementation tips:**
- Load chunks 1-2 beyond render distance to hide loading artifacts
- Use LOD for distant chunks (lower mesh detail, fewer draw calls)
- Fade-in loaded chunks to mask pop-in
- Separate data loading (voxel data) from mesh generation (vertices/indices)

### 8.3 Preloading Strategies

- **Startup preload:** Load essential resources (player model, UI, common materials) at startup with a loading screen
- **Predictive preload:** Based on player position and movement direction, preload resources likely needed soon
- **Level transition preload:** Begin loading the next level/area before the player reaches the transition point
- **`preload()` vs `load()`:** `preload()` in GDScript loads at scene parse time (blocking but guaranteed available). Use for small, always-needed resources. Use `load()` or `ResourceLoader.load_threaded_request()` for large or conditional resources

---

## 9. Platform-Specific Optimization

### 9.1 Mobile

**Thermal throttling:** Mobile devices throttle CPU/GPU after 10-20 minutes of sustained load. Sustained performance is 50-70% of peak performance.
- Monitor device temperature via platform APIs
- Implement dynamic quality scaling: reduce resolution, disable post-processing, lower draw distance when thermal pressure rises
- Target 30 FPS for battery-intensive games; 60 FPS only for lightweight games
- 60 FPS consumes roughly 2x the power of 30 FPS

**Tile-Based Deferred Rendering (TBDR):** Mobile GPUs (Mali, Adreno, Apple GPU) render in small tiles (e.g., 96x176 pixels) using fast on-chip memory.
- Minimize render target switches (each switch flushes tiles to main memory)
- Avoid reading from the framebuffer mid-frame (forces tile resolve)
- Front-to-back sorting is even more important: reduces tile memory bandwidth
- MSAA is nearly free on tile-based GPUs (resolved in tile memory)
- Overdraw is extra expensive: each overlapping fragment re-processes the tile

**Texture compression:** Use ASTC (preferred) or ETC2. ASTC 6x6 at 3.56 bits/pixel provides good quality at half the memory of BC7/ASTC 4x4. Halving texture memory can mean the difference between running and crashing on low-end devices.

### 9.2 Console

- Fixed hardware enables precise optimization targeting
- Strict memory budgets: plan VRAM, RAM, and storage I/O at project start
- Profile on actual hardware early and often
- Use platform-specific APIs for async I/O, compute, and memory management
- Certification requirements mandate stable frame rates (no sustained drops below target)

### 9.3 PC Scalability

Provide graphics settings covering the range from integrated GPUs to high-end desktop:
- **Resolution scale:** 50%-200% (FSR/DLSS integration)
- **Shadow quality:** Off / Low / Medium / High / Ultra
- **View distance:** Affects chunk loading radius, LOD distances
- **Post-processing:** Toggleable bloom, SSAO, SSR, DOF
- **Texture quality:** Quarter / Half / Full resolution
- **Anti-aliasing:** Off / FXAA / MSAA 2x/4x / TAA
- **V-Sync / frame rate cap:** 30 / 60 / 120 / Unlimited

Auto-detect hardware capability at first launch and set defaults accordingly. Allow manual override.

---

## 10. Benchmarking

### 10.1 Automated Performance Testing

- Run automated benchmark scenes in CI/CD pipelines
- Test specific systems in isolation: "1000 entities physics benchmark", "chunk meshing throughput test", "network serialization bandwidth test"
- Record frame time percentiles: median, 95th, 99th (not just average)
- Test on minimum-spec hardware, not just development machines
- Use deterministic seeds for reproducible benchmarks

### 10.2 Performance Budgets Per System

Define maximum time allowed per system per frame at target frame rate:

**Example: 60 FPS target (16.66 ms total)**

| System | Budget | Notes |
|--------|--------|-------|
| Rendering (CPU side) | 4.0 ms | Draw call submission, culling |
| Rendering (GPU) | 14.0 ms | Actual pixel/vertex work (overlaps CPU) |
| Physics | 3.0 ms | Godot physics or custom |
| Game logic | 3.0 ms | GDScript `_process` methods |
| Networking | 1.5 ms | Send/receive, serialization |
| AI | 1.5 ms | Pathfinding, behavior |
| Audio | 0.5 ms | Mixing (usually on separate thread) |
| Voxel updates | 2.0 ms | Chunk meshing, loading (amortized) |
| Headroom | 1.16 ms | For frame-to-frame variance |

Note: GPU rendering overlaps CPU work, so the total is not a simple sum. The 16.66 ms budget applies to whichever is the bottleneck.

### 10.3 Regression Detection

- Compare each build's benchmark results against the previous build and a baseline
- Flag regressions exceeding a threshold (e.g., >5% frame time increase or >10% memory increase)
- Track metrics over time in a dashboard (graph median frame time per build)
- Automated benchmarks can detect degradations as small as 3% when run with deterministic scenes
- Bisect regressions using git bisect with the benchmark as the test

### 10.4 Target Frame Time Allocation

**Target FPS to frame time conversion:**

| Target FPS | Frame Budget | Typical Use Case |
|-----------|-------------|-----------------|
| 30 | 33.33 ms | Mobile, battery-constrained, complex visuals |
| 60 | 16.66 ms | Standard gameplay, most platforms |
| 90 | 11.11 ms | VR (minimum acceptable) |
| 120 | 8.33 ms | High-refresh-rate monitors, competitive |
| 144 | 6.94 ms | Competitive gaming on high-refresh displays |
| 240 | 4.16 ms | Ultra-competitive (CS2, Valorant-class) |

For multiplayer voxel games like Chat Attack, target 60 FPS with 16.66 ms budget. Budget voxel meshing/loading separately since godot-voxel processes this on worker threads with its own time budget (default 8 ms on main thread for mesh uploads).

---

## Citations

- [Godot Engine Performance Documentation](https://docs.godotengine.org/en/stable/tutorials/performance/index.html)
- [Godot General Optimization Tips](https://docs.godotengine.org/en/stable/tutorials/performance/general_optimization.html)
- [Godot CPU Optimization Docs (GitHub)](https://github.com/godotengine/godot-docs/blob/master/tutorials/performance/cpu_optimization.rst)
- [Godot Static Typing Documentation](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/static_typing.html)
- [Godot The Profiler Documentation](https://docs.godotengine.org/en/stable/tutorials/scripting/debug/the_profiler.html)
- [Godot Background Loading Documentation](https://docs.godotengine.org/en/latest/tutorials/io/background_loading.html)
- [GDScript Typed Instructions Progress Report](https://godotengine.org/article/gdscript-progress-report-typed-instructions/)
- [Static Typing Performance in Godot (beep.blog)](https://www.beep.blog/2024-02-14-gdscript-typing/)
- [Static Typing Performance ~47% Improvement (bodenmchale.com)](https://www.bodenmchale.com/2025/02/24/improve-godot-performance-using-static-types/)
- [GDScript vs C# in Godot 4 (Chickensoft)](https://chickensoft.games/blog/gdscript-vs-csharp)
- [Godot C# vs C++ vs GDScript Comparison](https://copyprogramming.com/howto/csharp-should-you-use-c-or-gdscript-godot)
- [Voxel Tools Performance Documentation](https://voxel-tools.readthedocs.io/en/latest/performance/)
- [godot_voxel Performance (GitHub source)](https://github.com/Zylann/godot_voxel/blob/master/doc/source/performance.md)
- [godot_voxel Optimizations Issue #150](https://github.com/Zylann/godot_voxel/issues/150)
- [Meshing in a Minecraft Game (0fps.net)](https://0fps.net/2012/06/30/meshing-in-a-minecraft-game/)
- [A Level of Detail Method for Blocky Voxels (0fps.net)](https://0fps.net/2018/03/03/a-level-of-detail-method-for-blocky-voxels/)
- [High Performance Voxel Engine: Vertex Pooling (nickmcd.me)](https://nickmcd.me/2021/04/04/high-performance-voxel-engine/)
- [Voxel World Optimisations (vercidium.com)](https://vercidium.com/blog/voxel-world-optimisations/)
- [Optimised Voxel Mesh Generation (Vercidium GitHub)](https://github.com/Vercidium/voxel-mesh-generation)
- [Snapshot Compression (Gaffer On Games)](https://gafferongames.com/post/snapshot_compression/)
- [Reading and Writing Packets (Gaffer On Games)](https://gafferongames.com/post/reading_and_writing_packets/)
- [Game Networking: Compression, Delta Encoding, Bit Packing (Daposto)](https://daposto.medium.com/game-networking-5-compression-delta-encoding-interest-management-bit-packing-9316ff1c96db)
- [Object Pool Pattern (Game Programming Patterns)](https://gameprogrammingpatterns.com/object-pool.html)
- [Pool Allocator Design for Games (gamedeveloper.com)](https://www.gamedeveloper.com/programming/designing-and-implementing-a-pool-allocator-data-structure-for-memory-management-in-games)
- [AoS and SoA (Wikipedia)](https://en.wikipedia.org/wiki/AoS_and_SoA)
- [AoS and SoA Cache Optimization (Algorithmica)](https://en.algorithmica.org/hpc/cpu-cache/aos-soa/)
- [SoA vs AoS Deep Dive (azad217 - Medium)](https://medium.com/@azad217/structure-of-arrays-soa-vs-array-of-structures-aos-in-c-a-deep-dive-into-cache-optimized-13847588232e)
- [Data-Oriented Programming for Games (Android Developers Blog)](https://android-developers.googleblog.com/2015/07/game-performance-data-oriented.html)
- [Multithreaded Job Systems in Game Engines (PulseGeek)](https://pulsegeek.com/articles/multithreaded-job-systems-in-game-engines/)
- [Lock-Free Job Stealing Task System (manu343726)](https://manu343726.github.io/2017-03-13-lock-free-job-stealing-task-system-with-modern-c/)
- [Multithreading for Game Engines (Vulkan Guide)](https://vkguide.dev/docs/extra-chapter/multithreading/)
- [GPU Optimization for Games (unity.com)](https://unity.com/how-to/gpu-optimization)
- [GPU Rendering Techniques (Wayline)](https://www.wayline.io/blog/optimizing-gpu-performance-real-time-rendering-techniques)
- [GPU Instancing Guide (NVIDIA GPUGems2)](https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-3-inside-geometry-instancing)
- [Texture Compression in 2020 (Aras Pranckevicius)](https://aras-p.info/blog/2020/12/08/Texture-Compression-in-2020/)
- [ASTC for Game Assets (NVIDIA Developer)](https://developer.nvidia.com/astc-texture-compression-for-game-assets)
- [Texture Compression Formats Catalog (PulseGeek)](https://pulsegeek.com/articles/texture-compression-formats-for-games-a-quick-catalog/)
- [Mobile GPUs and Tiled Rendering (Meta Developer)](https://developers.meta.com/horizon/documentation/unity/gpu-tiled/)
- [Mobile GPU Tiled Rendering Overview (hyeondg.org)](https://hyeondg.org/gpu/tbr)
- [Adaptive Performance in Call of Duty Mobile (Samsung Developer)](https://developer.samsung.com/galaxy-gamedev/gamedev-blog/cod.html)
- [Level Streaming in Open-World Games (Medium)](https://medium.com/@business.sebastian1524/level-streaming-in-open-world-games-revolutionizing-immersive-experiences-0afdd8ffed88)
- [Complete Game Optimization Guide 2025 (Generalist Programmer)](https://generalistprogrammer.com/tutorials/game-optimization-complete-performance-guide-2025)
- [CI/CD for Gaming Projects 2025 (Playgama)](https://playgama.com/blog/general/effective-ci-cd-implementation-for-gaming-project-success/)
- [Godot Optimization Guidelines (Contributing to Godot)](https://contributing.godotengine.org/en/latest/engine/guidelines/optimization.html)
- [Measuring Code Performance (GDQuest)](https://www.gdquest.com/tutorial/godot/gdscript/optimization-measure/)
