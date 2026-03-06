# Procedural Generation

Comprehensive reference for procedural content generation (PCG) techniques used in game development, with emphasis on voxel-based worlds relevant to Chat Attack.

---

## 1. Fundamentals

### 1.1 Determinism and Seeds

All procedural generation should be **deterministic**: the same seed must always produce the same output. A seed is an integer fed into a pseudorandom number generator (PRNG) that initializes its state. This guarantees:

- **Reproducibility**: any client or server regenerating a chunk from the same seed gets identical results.
- **Compact storage**: store a seed instead of gigabytes of world data.
- **Debugging**: reproduce bugs by replaying the exact same seed.

```
# Pseudocode: seeded generation
func generate_chunk(chunk_pos: Vector3i, world_seed: int) -> ChunkData:
    var rng = RandomNumberGenerator.new()
    rng.seed = hash(world_seed, chunk_pos.x, chunk_pos.y, chunk_pos.z)
    # All subsequent calls to rng are deterministic
```

**Hashing for spatial seeds**: combine the world seed with spatial coordinates using a hash function (e.g., xxHash, MurmurHash) so every chunk gets a unique but reproducible sub-seed.

### 1.2 Online vs Offline Generation

| Aspect | Online (Runtime) | Offline (Baked) |
|--------|------------------|-----------------|
| When | During gameplay | Build/export time |
| Storage | Minimal (seeds only) | Full data on disk |
| Flexibility | Infinite worlds | Fixed content |
| CPU cost | Per-frame budget | Unlimited time |
| Use case | Exploration games, voxel worlds | Authored levels with PCG assist |

**Chat Attack uses online generation** for its infinite voxel terrain, with chunk streaming and async worker threads.

### 1.3 Balancing Authored vs Procedural Content

Pure procedural worlds can feel generic. Strategies to inject authorial intent:

- **Constraint layers**: apply rules after generation (e.g., ensure spawn areas are flat).
- **Prefab injection**: place hand-built structures (temples, dungeons) into procedural terrain.
- **Post-processing passes**: run erosion, smoothing, or feature carving after base noise.
- **Biome palettes**: designers author biome definitions; the generator selects and blends them.
- **Seed curation**: test many seeds, ship the best ones as "featured worlds."

---

## 2. Noise Functions

Noise functions are the backbone of natural-looking procedural content. They produce continuous, pseudo-random scalar fields.

### 2.1 Value Noise

The simplest lattice noise. Random values are assigned to integer lattice points and interpolated between them. Produces visible grid artifacts unless filtered carefully.

```
func value_noise_2d(x: float, y: float) -> float:
    var ix = floor(x); var iy = floor(y)
    var fx = x - ix;   var fy = y - iy
    # Smoothstep interpolation
    fx = fx * fx * (3.0 - 2.0 * fx)
    fy = fy * fy * (3.0 - 2.0 * fy)
    var a = hash_float(ix, iy)
    var b = hash_float(ix + 1, iy)
    var c = hash_float(ix, iy + 1)
    var d = hash_float(ix + 1, iy + 1)
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fy)
```

### 2.2 Perlin Noise

Developed by Ken Perlin in 1983. Uses **gradient vectors** at lattice points instead of scalar values, producing smoother results with fewer directional artifacts than value noise.

**Improved Perlin Noise** (2002) replaced the original's interpolation with a quintic curve `6t^5 - 15t^4 + 10t^3` and uses a permutation table for gradient selection, eliminating visible axis-aligned artifacts.

Key properties:
- Output range: approximately [-1, 1] (not exactly bounded).
- Band-limited: energy concentrated around the lattice frequency.
- Continuous first derivative (improved version has continuous second derivative).

### 2.3 Simplex Noise / OpenSimplex

Ken Perlin introduced simplex noise in 2001 to address Perlin noise limitations:
- Uses a **simplex grid** (triangles in 2D, tetrahedra in 3D) instead of a hypercube grid.
- Computational complexity scales as O(n) with dimensions (vs O(2^n) for classic Perlin).
- Fewer directional artifacts.
- **Patent note**: Perlin's 3D+ simplex noise was patented (US Patent 6867776, expired 2022). **OpenSimplex** and **OpenSimplex2** are patent-free alternatives widely used in open-source projects.

### 2.4 Worley / Cellular Noise (Voronoi)

Introduced by Steven Worley in 1996. Distributes feature points in space and computes the distance from each sample to the nearest feature points.

- **F1**: distance to the closest point (produces cell-like patterns).
- **F2**: distance to the second closest point.
- **F2 - F1**: produces vein/crack patterns useful for stone, dried mud, scales.

Applications: stone textures, biological cells, cracked earth, crystal formations, ore vein distribution.

### 2.5 Fractal Noise (Fractional Brownian Motion)

Layering multiple noise **octaves** at increasing frequencies creates natural detail at multiple scales.

**Parameters:**
- **Octaves**: number of noise layers (typically 4-8; more is costlier).
- **Frequency**: base spatial frequency. Higher = more detail per unit.
- **Lacunarity**: frequency multiplier between octaves (commonly 2.0).
- **Persistence** (gain): amplitude multiplier between octaves (commonly 0.5).

```
func fbm(pos: Vector3, octaves: int, lacunarity: float, persistence: float) -> float:
    var value = 0.0
    var amplitude = 1.0
    var frequency = 1.0
    var max_amp = 0.0
    for i in octaves:
        value += amplitude * noise.get_noise_3dv(pos * frequency)
        max_amp += amplitude
        frequency *= lacunarity
        amplitude *= persistence
    return value / max_amp  # Normalize to [-1, 1]
```

**Variants:**
- **Ridged Multifractal**: `abs(noise)` creates ridge-like features (mountain ridges, cave walls). The absolute value inverts valleys into sharp ridges.
- **Turbulence**: similar to ridged but without the ridge inversion; produces swirling, smoke-like patterns.
- **Billowy**: `1.0 - abs(noise)` creates smooth, rounded hills.

### 2.6 Domain Warping

Distort the input coordinates of a noise function using another noise function before evaluation:

```
func warped_noise(pos: Vector2) -> float:
    var warp_x = noise_a.get_noise_2dv(pos)
    var warp_y = noise_b.get_noise_2dv(pos)
    var warped_pos = pos + Vector2(warp_x, warp_y) * warp_strength
    return noise_c.get_noise_2dv(warped_pos)
```

This produces organic, swirling distortions. Iterative domain warping (warping the warp) creates increasingly complex patterns. Useful for:
- Terrain that avoids uniform noise appearance.
- River-like meandering features.
- Alien or fantastical landscape generation.

### 2.7 Multi-Dimensional Noise

| Dimensions | Application |
|-----------|-------------|
| 1D | Timeline events, animation curves |
| 2D | Heightmaps, texture generation, biome maps |
| 3D | Volumetric caves, overhangs, ore distribution, voxel density fields |
| 4D | Animated 3D noise (time as 4th dimension), seamless tiling |

For voxel games like Chat Attack, **3D noise is essential** for generating caves, overhangs, and underground features that 2D heightmaps cannot represent.

---

## 3. Terrain Generation

### 3.1 Heightmap-Based Terrain

The simplest approach: a 2D noise function outputs height for each (x, z) coordinate.

```
func get_height(x: float, z: float) -> float:
    var base = fbm(Vector2(x, z) * 0.005, 6, 2.0, 0.5)
    var mountains = ridged_fbm(Vector2(x, z) * 0.002, 4, 2.0, 0.5)
    var blend = smoothstep(0.3, 0.7, moisture_noise(x, z))
    return lerp(base, mountains, blend) * max_height
```

Limitations: cannot represent caves, overhangs, arches, or floating islands.

### 3.2 Voxel Terrain Generation

For Chat Attack's voxel world, terrain is a **3D density field** where each voxel is solid or empty based on a threshold.

**Base terrain with 3D noise:**
```
func get_voxel_density(world_pos: Vector3) -> float:
    # Base terrain: height gradient + 2D surface noise
    var surface_height = fbm_2d(world_pos.x, world_pos.z) * 64.0
    var height_gradient = world_pos.y - surface_height
    # 3D noise for caves and overhangs
    var cave_noise = ridged_fbm_3d(world_pos * 0.02, 3, 2.0, 0.5)
    var density = -height_gradient + cave_noise * cave_strength
    return density  # positive = solid, negative = air
```

**Cave generation approaches:**
- **3D ridged noise**: multiply two ridged noise fields with different seeds; caves form where both fields intersect near zero. This creates winding tunnel networks.
- **Worm carving**: trace parametric curves through the density field, subtracting density along the path to carve tunnels.
- **Cellular automata post-pass**: refine cave shapes by applying smoothing rules after initial noise generation.

**Biome systems:**
Biomes are determined by overlapping 2D noise maps:
1. **Temperature map**: latitude-based gradient plus noise variation.
2. **Moisture/rainfall map**: independent noise, possibly influenced by distance from oceans.
3. **Biome lookup**: a 2D table indexed by (temperature, moisture) selects the biome (desert, forest, tundra, etc.).

Each biome defines its own generation parameters: surface block type, terrain amplitude, vegetation density, ore distribution curves, and cave frequency.

**Ore and resource distribution:**
- Use separate 3D noise fields per resource type.
- Threshold the noise to create clusters: `ore_present = noise_value > ore_threshold`.
- Control depth distribution: iron appears at y < 60, diamonds at y < 16.
- Vary cluster size and frequency by biome.

**Water level and fluids:**
- Define a global `sea_level` constant. Any air voxel at or below sea level becomes water.
- River channels can be carved using 2D domain-warped noise paths at the surface.
- Fluid simulation (flow, pressure) is a separate runtime system, not part of generation.

### 3.3 Chunk-Based Infinite Terrain

Voxel worlds are divided into **chunks** (commonly 16x16x16 or 32x32x32 voxels). Advantages:

- **Memory efficiency**: only loaded chunks consume RAM.
- **Parallelism**: each chunk generates independently on worker threads.
- **Streaming**: load/unload chunks based on player proximity (area of interest).

**Generation pipeline per chunk:**
1. Generate base density field from noise.
2. Apply biome-specific modifications.
3. Carve caves and features.
4. Place ores and resources.
5. Generate surface decorations (trees, grass) -- requires neighbor chunk data for border objects.
6. Build mesh (marching cubes, greedy meshing, etc.).

**Border handling**: decorations that span chunk boundaries (large trees) require a two-pass system. First pass generates all terrain; second pass places structures that may cross boundaries.

### 3.4 Erosion Simulation

**Hydraulic erosion** simulates water flow to create realistic terrain features:

1. Spawn water droplets at random positions on the heightmap.
2. Each droplet follows the steepest downhill gradient.
3. Fast-moving water on steep slopes **erodes** (picks up sediment).
4. Slow-moving water on flat areas **deposits** sediment.
5. Repeat for thousands of droplets.

```
# Pseudocode: particle-based hydraulic erosion
func erode(heightmap, iterations: int):
    for i in iterations:
        var pos = random_position()
        var velocity = 0.0
        var sediment = 0.0
        for step in max_steps:
            var gradient = compute_gradient(heightmap, pos)
            velocity = velocity * inertia + gradient * (1.0 - inertia)
            pos += velocity.normalized()
            var capacity = max(velocity.length() * slope * capacity_factor, min_capacity)
            if sediment > capacity:
                deposit(heightmap, pos, (sediment - capacity) * deposition_rate)
                sediment -= (sediment - capacity) * deposition_rate
            else:
                var erode_amount = min((capacity - sediment) * erosion_rate, -gradient.y)
                erode(heightmap, pos, erode_amount)
                sediment += erode_amount
```

**Thermal erosion** is simpler: if the slope between adjacent cells exceeds a threshold (talus angle), material moves downhill. Fast to compute and effective for softening cliff faces.

Both erosion types are typically run offline or during world generation, not at runtime.

### 3.5 Terrain Features

- **Mountains**: high-amplitude ridged multifractal noise, amplified in mountain biomes.
- **Valleys/rivers**: domain-warped 2D noise paths carved into the heightmap; A* or flow-based algorithms ensure rivers flow downhill to oceans.
- **Lakes**: flood-fill from local minima in the heightmap up to an overflow point.
- **Plateaus**: clamp noise output within certain height bands.
- **Cliffs**: sharp transitions between biome height levels using step functions blended with noise.

---

## 4. Dungeon and Level Generation

### 4.1 Binary Space Partition (BSP)

Recursively subdivide a rectangle into smaller rooms:

```
func bsp_split(rect: Rect2, depth: int) -> Array:
    if depth <= 0 or rect.size.x < min_size * 2:
        return [create_room(rect)]
    if randf() > 0.5:  # Horizontal split
        var split_y = randi_range(rect.position.y + min_size, rect.end.y - min_size)
        var top = Rect2(rect.position, Vector2(rect.size.x, split_y - rect.position.y))
        var bottom = Rect2(Vector2(rect.position.x, split_y), Vector2(rect.size.x, rect.end.y - split_y))
        return bsp_split(top, depth - 1) + bsp_split(bottom, depth - 1)
    else:  # Vertical split
        # Similar logic for x-axis
```

After subdivision, connect sibling rooms with corridors. BSP guarantees non-overlapping rooms with full connectivity.

### 4.2 Cellular Automata for Caves

Natural-looking cave systems emerge from simple rules:

1. Initialize grid: each cell has ~45% chance of being a wall.
2. For each iteration, apply the **4-5 rule**: a cell becomes a wall if it has >= 5 wall neighbors (including itself), or if it has <= 1 wall neighbor (smoothing isolated pillars).
3. Repeat 4-6 iterations.

```
func cellular_automata_step(grid: Array) -> Array:
    var new_grid = grid.duplicate(true)
    for x in width:
        for y in height:
            var walls = count_neighbors(grid, x, y, 1)  # 3x3 region
            new_grid[x][y] = WALL if walls >= 5 else FLOOR
    return new_grid
```

Post-processing: flood-fill to identify disconnected regions and either discard small ones or connect them with tunnels.

### 4.3 Agent-Based Generation

**Drunkard's Walk (Random Walk):**
An agent starts at a random position and wanders, carving floor tiles. Stop after a target percentage of the map is carved. Produces organic, winding layouts.

**Tunneling Agents (Diggers):**
Multiple agents with directional bias. Each agent has a probability of turning, continuing straight, or spawning a new agent. Creates branching tunnel networks.

### 4.4 Prefab / Template Stitching

Pre-designed room templates are selected and connected:
1. Define room templates with connection points (doors/exits) at edges.
2. Pick a starting template. For each open connection point, select a compatible template.
3. Check for spatial conflicts (overlap). If conflict, try another template or backtrack.
4. Continue until target size is reached or all exits are capped.

Useful for maintaining authored quality while varying layout. Chat Attack could use this for dungeon structures placed within the voxel world.

### 4.5 Graph-Based Level Generation

1. Generate an abstract graph representing room connectivity and progression.
2. Assign roles to nodes: start, boss, treasure, key, locked door.
3. Ensure solvability: keys appear before their locks in the graph topology.
4. Spatialize the graph: map abstract nodes to physical room placements.

This approach separates design intent (pacing, difficulty curve) from spatial layout.

---

## 5. Wave Function Collapse (WFC)

### 5.1 Overview

WFC generates output grids by propagating adjacency constraints derived from example input. Originally developed by Maxim Gumin (2016), it guarantees local consistency with the input patterns.

### 5.2 Simple Tiled Model

1. Define a set of tiles and adjacency rules (which tiles can be placed next to each other on each edge).
2. Initialize the grid: every cell can be any tile (superposition).
3. **Observe**: select the cell with lowest entropy (fewest remaining options). Collapse it to one tile chosen by weighted random.
4. **Propagate**: remove incompatible options from neighboring cells. If a neighbor loses an option, propagate further.
5. Repeat until all cells are collapsed or a contradiction occurs.

```
func wfc_step(grid):
    # 1. Find lowest entropy cell
    var cell = find_min_entropy_cell(grid)
    if cell == null:
        return DONE
    # 2. Collapse: choose a tile weighted by frequency
    var tile = weighted_random_choice(cell.possible_tiles, tile_weights)
    cell.collapse(tile)
    # 3. Propagate constraints
    var stack = [cell]
    while stack.size() > 0:
        var current = stack.pop()
        for neighbor in current.get_neighbors():
            var changed = neighbor.constrain(current.tile, direction)
            if neighbor.possible_tiles.size() == 0:
                return CONTRADICTION
            if changed:
                stack.push(neighbor)
    return CONTINUE
```

### 5.3 Overlapping Model

Instead of explicit adjacency rules, the overlapping model extracts NxN patterns from an example image and learns which patterns can overlap. More flexible but computationally heavier.

### 5.4 Contradiction Handling and Backtracking

When a cell has zero remaining options:
- **Simple restart**: discard the grid and begin again. Fast, works well for small grids.
- **Backtracking**: undo the last collapse and try a different tile. More expensive but guarantees completion if a solution exists.
- **Weighted restart**: track which cells commonly cause contradictions; bias future collapses away from those configurations.

### 5.5 3D WFC

Extend tile adjacency to six faces (up/down/north/south/east/west). Used for:
- Building interiors with room connectivity.
- Voxel structure generation (castles, ruins, villages).
- Pipe and wiring networks.

3D WFC is significantly more expensive than 2D due to the larger neighborhood and constraint propagation volume.

### 5.6 Performance Considerations

- **Entropy caching**: maintain a priority queue of cells sorted by entropy; update incrementally.
- **Arc consistency**: use AC-3 or AC-4 algorithms for efficient constraint propagation.
- **Chunked WFC**: run WFC on overlapping chunks, stitching results at boundaries.
- **Pre-computation**: build adjacency lookup tables once at startup.

---

## 6. L-Systems and Grammar-Based Generation

### 6.1 L-System Fundamentals

An L-system (Lindenmayer system) is a parallel string-rewriting system defined by:
- **Alphabet**: set of symbols (e.g., F, +, -, [, ]).
- **Axiom**: initial string (e.g., "F").
- **Production rules**: rewriting rules applied simultaneously (e.g., F -> F[+F]F[-F]F).

After N iterations, the string is interpreted as drawing commands (turtle graphics):
- `F`: move forward, drawing a line.
- `+` / `-`: turn left/right by a fixed angle.
- `[` / `]`: push/pop the turtle state (branching).

### 6.2 Stochastic and Context-Sensitive L-Systems

- **Stochastic**: multiple production rules per symbol with probabilities, creating variation.
- **Context-sensitive**: rules depend on neighboring symbols (e.g., A in context of B -> C).
- **Parametric**: symbols carry numerical parameters that affect growth (branch length, thickness).

### 6.3 L-Systems for Vegetation

Trees and plants are the canonical L-system application:

```
# Simple 2D tree
Axiom: F
Rules: F -> FF+[+F-F-F]-[-F+F+F]
Angle: 22.5 degrees
Iterations: 4
```

For 3D trees, extend with pitch/yaw/roll rotations and parametric rules for trunk tapering, branch thickness reduction, and leaf placement at terminal branches.

SpeedTree and similar middleware use enhanced L-system variants internally for commercial game vegetation.

### 6.4 Shape Grammars for Architecture

Shape grammars generate buildings by recursively subdividing and replacing shapes:

1. Start with a building volume (box).
2. Apply rules: split facades into floors, split floors into bays, replace bays with windows/doors.
3. Add details: cornices, balconies, roof elements.

CityEngine (Esri) uses CGA (Computer Generated Architecture) shape grammars for procedural urban environments.

### 6.5 Graph Grammars for Quests and Narratives

A graph grammar rewrites subgraphs according to rules, useful for:
- **Quest generation**: nodes represent objectives (fetch, kill, escort); edges represent prerequisites.
- **Narrative branching**: generate story graphs with decision points.
- **Level topology**: ensure keys appear before locks, bosses after progression gates.

---

## 7. Procedural Content Types

### 7.1 Vegetation and Biome Distribution

- **Biome assignment**: Voronoi cells seeded by noise-driven temperature/moisture, with blended transitions.
- **Tree placement**: Poisson disk sampling within forest biomes with density controlled by a noise map.
- **Species selection**: weighted random per biome (oak in temperate, cactus in desert).
- **Growth variation**: randomize L-system parameters per instance for natural variety.

### 7.2 Buildings and Structures

Combine techniques:
- WFC for floor plans and room layout.
- Shape grammars for facade detail.
- Prefab libraries for interior furniture placement.
- Lot subdivision (recursive splitting) for building footprints within city blocks.

### 7.3 Roads, Rivers, and Infrastructure

- **Roads**: tensor field tracing (following population gradients), L-system branching, or shortest-path algorithms between settlements.
- **Rivers**: follow heightmap gradient from source (high elevation, high moisture) to ocean, with A* pathfinding constrained to downhill movement.
- **Bridges/tunnels**: detected where roads cross rivers or mountains; placed as prefabs.

### 7.4 Items and Loot Tables

**Weighted random selection:**
```
func pick_item(loot_table: Array) -> Item:
    var total_weight = 0.0
    for entry in loot_table:
        total_weight += entry.weight
    var roll = randf() * total_weight
    for entry in loot_table:
        roll -= entry.weight
        if roll <= 0:
            return entry.item
    return loot_table[-1].item  # Fallback
```

**Rarity tiers**: Common (60%), Uncommon (25%), Rare (10%), Epic (4%), Legendary (1%).

**Pity systems**: track consecutive non-rare drops. After N failures, guaranteed rare+. Two variants:
- **Hard pity**: guaranteed drop at a fixed threshold (e.g., 90 pulls).
- **Soft pity**: increasing probability after a threshold (e.g., +5% per pull after 75).

**Procedural item properties**: roll random affixes, stat ranges, and modifiers from per-tier pools. Ensure economic balance by capping total stat budgets per rarity tier.

### 7.5 Names and Text

**Markov chains**: build a character-level transition probability table from a corpus of names, then generate new names by sampling:

```
func generate_name(order: int, min_len: int, max_len: int) -> String:
    var name = start_sequence()  # e.g., first 'order' characters
    while name.length() < max_len:
        var context = name.substr(name.length() - order)
        var next_char = sample_from_chain(context)
        if next_char == END_TOKEN and name.length() >= min_len:
            break
        name += next_char
    return name.capitalize()
```

**Context-free grammars** for structured text:
```
<quest_text> ::= "Seek the " <artifact> " in the " <location>
<artifact>   ::= "Crystal of " <element> | "Ancient " <weapon>
<element>    ::= "Fire" | "Ice" | "Shadow"
```

### 7.6 Procedural Textures and Materials

- **Noise-based**: layer Perlin/Worley noise with color ramps for stone, wood, marble.
- **Mathematical**: brick patterns from modular arithmetic, fabric weave from sine waves.
- **Hybrid**: combine authored base textures with procedural variation (weathering, moss growth from moisture noise).

---

## 8. City and Settlement Generation

### 8.1 Road Network Generation

Two primary approaches:

**Tensor field method**: define a smooth field of directions over the map. Major roads follow the principal stress directions, creating organic grid patterns that respond to coastlines and terrain.

**L-system / agent method**: road agents grow outward from city centers, branching according to rules. Highway agents create long arterial roads; local agents fill in blocks.

### 8.2 Lot Subdivision

Once road networks define city blocks:
1. Extract block polygons from road boundaries.
2. Recursively split blocks into building lots using longest-edge bisection.
3. Apply minimum lot size constraints.
4. Classify lots by zone (residential, commercial, industrial) using distance from city center and noise.

### 8.3 Building Placement

- Align buildings to lot boundaries with configurable setbacks.
- Height determined by zone and distance to center (taller downtown).
- Building type selected from biome/culture-specific catalogs.
- Shape grammar or WFC fills architectural detail.

### 8.4 Population Simulation

Agent-based population models drive organic city growth:
- Settlements seed at resource-rich locations (water, arable land).
- Population grows based on available resources.
- New roads and buildings are placed to serve growing population.
- Trade routes form between settlements, influencing road placement.

---

## 9. Procedural Meshes and Art

### 9.1 Isosurface Extraction

For voxel-to-mesh conversion, three main algorithms:

**Marching Cubes** (Lorensen & Cline, 1987):
- Evaluates density at 8 corners of each cube cell.
- 256 possible configurations (reducible to 15 by symmetry).
- Lookup table maps configuration to triangle vertices on cell edges.
- Fast and simple but produces only smooth surfaces; cannot represent sharp features.

**Surface Nets** (Gibson, 1998):
- Places one vertex per cell at the average of edge crossings.
- Connect vertices across sign-change edges.
- Smoother than marching cubes but also lacks sharp feature support.
- Simpler implementation, good for organic terrain.

**Dual Contouring** (Ju et al., 2002):
- Places one vertex per cell using Quadratic Error Function (QEF) minimization from edge crossing positions and normals.
- Supports sharp features (corners, edges of buildings).
- More complex implementation; requires surface normal data (Hermite data).
- Best choice when the voxel world contains both natural terrain and constructed geometry.

### 9.2 Greedy Meshing for Blocky Voxels

For Minecraft-style blocky rendering:
1. For each face direction, scan the chunk slice by slice.
2. Merge adjacent visible faces of the same block type into larger quads.
3. Dramatically reduces triangle count (often 90%+ reduction).

### 9.3 Procedural Animation

- **Noise-driven motion**: wind sway on vegetation using time-offset sine waves modulated by noise.
- **Inverse kinematics**: procedural foot placement on uneven terrain.
- **Physics-based secondary motion**: capes, hair, chains responding to movement.

---

## 10. Distribution and Placement

### 10.1 Poisson Disk Sampling

Generates points with a guaranteed minimum distance between them, producing natural-looking distributions. Bridson's algorithm (2007) runs in O(n) time:

```
func poisson_disk_sample(width, height, min_dist, max_attempts = 30):
    var cell_size = min_dist / sqrt(2)
    var grid = create_grid(width / cell_size, height / cell_size)
    var active = []
    var points = []
    # Seed with first point
    var p0 = Vector2(randf() * width, randf() * height)
    add_point(p0, grid, active, points, cell_size)
    while active.size() > 0:
        var idx = randi() % active.size()
        var point = active[idx]
        var found = false
        for attempt in max_attempts:
            var angle = randf() * TAU
            var dist = min_dist + randf() * min_dist
            var candidate = point + Vector2(cos(angle), dist * sin(angle))
            if is_valid(candidate, grid, points, min_dist, width, height, cell_size):
                add_point(candidate, grid, active, points, cell_size)
                found = true
                break
        if not found:
            active.remove_at(idx)
    return points
```

### 10.2 Blue Noise Properties

Blue noise has energy concentrated at high frequencies, meaning no two points are too close. Contrast with:
- **White noise**: fully random, creates visible clumps and gaps.
- **Red noise**: low-frequency, overly smooth/regular.
- **Blue noise**: uniform coverage without visible pattern; ideal for object scattering.

### 10.3 Density-Controlled Placement

Combine Poisson disk sampling with a density map:
- Sample from the density map to determine local minimum distance.
- High density areas (forests) get smaller minimum distances.
- Low density areas (plains) get larger minimum distances.
- Reject points in zero-density regions.

### 10.4 Constraint-Based Placement

Objects have placement rules:
- Trees: minimum distance from roads, prefer slopes < 30 degrees, avoid water.
- Buildings: must be on flat ground, aligned to road, minimum spacing.
- Ores: depth range, biome affinity, cluster size from noise threshold.

---

## 11. Evaluation and Quality

### 11.1 Playability Testing

Automated tests for procedural content:
- **Reachability**: flood-fill or pathfinding confirms all areas are accessible.
- **Difficulty curve**: measure enemy density, resource availability along critical path.
- **Completion**: simulate simple agents to verify levels are solvable.
- **Balance**: statistical analysis across many seeds for fairness metrics.

### 11.2 Seed-Based Regression Testing

```
func test_terrain_regression():
    var chunk = generate_chunk(Vector3i(0, 0, 0), KNOWN_SEED)
    assert(chunk.get_voxel(8, 32, 8) == STONE)
    assert(chunk.get_voxel(8, 64, 8) == AIR)
    assert(chunk.surface_height(8, 8) == expected_height)
```

Run regression tests on known seeds after any generator code change to catch unintended terrain shifts.

### 11.3 Quality Metrics

- **Variance**: measure height variance, biome distribution across seeds.
- **Feature density**: count caves, ore clusters, structures per chunk.
- **Coverage**: percentage of biome types appearing within reasonable exploration radius.
- **Uniqueness**: compare generated content across seeds for sufficient variety.

### 11.4 Player Perception

Research shows players are generally satisfied with procedural content when:
- There is sufficient variety within a play session.
- Authored anchor points (boss rooms, set pieces) provide narrative structure.
- Generation parameters are tuned to avoid degenerate cases (empty maps, impossible layouts).
- Visual quality matches hand-crafted content (consistent art style, no floating artifacts).

---

## 12. Performance

### 12.1 Async Generation with Worker Threads

Never generate terrain on the main thread. Pipeline:

1. Main thread identifies chunks needed based on player position.
2. Generation tasks are queued for the thread pool.
3. Worker threads generate chunk data (noise sampling, mesh building).
4. Completed chunks are posted back to the main thread for integration.

In Godot, use `WorkerThreadPool` or `Thread` class. Ensure noise functions and data structures used in workers are thread-safe.

### 12.2 Level of Detail (LOD)

- **Near chunks**: full voxel resolution, full decoration.
- **Medium chunks**: simplified mesh (fewer triangles), skip small decorations.
- **Far chunks**: heightmap-only rendering, billboard trees, no cave detail.
- **Distant**: low-resolution impostor terrain or fog.

Transition smoothly between LOD levels to avoid visible popping. Godot-voxel supports configurable LOD natively.

### 12.3 Caching and Memoization

- **Noise cache**: for frequently sampled positions, cache noise results in a hash map.
- **Chunk cache**: keep recently unloaded chunks in memory with an LRU eviction policy.
- **Precomputed tables**: gradient permutation tables, lookup tables for marching cubes.
- **Biome map cache**: biome assignments change slowly; cache large biome map tiles.

### 12.4 Streaming Generation

For infinite worlds:
1. Maintain a loading radius around the player (e.g., 12 chunks in each direction).
2. As the player moves, queue new chunks for generation and mark distant chunks for unloading.
3. Prioritize chunks in the player's movement direction.
4. Use priority queues: closest unloaded chunks generate first.

```
func update_loaded_chunks(player_pos: Vector3):
    var player_chunk = world_to_chunk(player_pos)
    var needed = get_chunks_in_radius(player_chunk, load_radius)
    var loaded = get_currently_loaded_chunks()
    # Queue new chunks for generation (prioritized by distance)
    for chunk_pos in needed:
        if chunk_pos not in loaded:
            generation_queue.insert(chunk_pos, distance_to_player(chunk_pos))
    # Unload distant chunks
    for chunk_pos in loaded:
        if chunk_pos not in needed:
            unload_chunk(chunk_pos)
```

### 12.5 Godot-Voxel Specifics for Chat Attack

The godot-voxel (Zylann) extension provides built-in support for many of these performance patterns:
- `VoxelGeneratorScript` for custom GDScript-based generators.
- `VoxelGeneratorNoise2D` / `VoxelGeneratorNoise3D` for noise-based terrain.
- Built-in LOD with `VoxelLodTerrain`.
- Threaded chunk generation and meshing.
- `VoxelStream` for persistence to region files.

---

## Citations

- [Perlin Noise - Wikipedia](https://en.wikipedia.org/wiki/Perlin_noise)
- [Perlin Noise: A Procedural Generation Algorithm - Rtouti](https://rtouti.github.io/graphics/perlin-noise-algorithm)
- [Perlin Noise Implementation and Simplex Noise - GarageFarm](https://garagefarm.net/blog/perlin-noise-implementation-procedural-generation-and-simplex-noise)
- [Working with Simplex Noise - C. Maher](https://cmaher.github.io/posts/working-with-simplex-noise/)
- [A Survey of Procedural Noise Functions - Lagae et al. (UMD)](https://www.cs.umd.edu/~zwicker/publications/SurveyProceduralNoise-CGF10.pdf)
- [The Book of Shaders: Fractal Brownian Motion](https://thebookofshaders.com/13/)
- [Domain Warping - Inigo Quilez](https://iquilezles.org/articles/warp/)
- [Domain Warping: An Interactive Introduction - Mathias Isaksen](https://st4yho.me/domain-warping-an-interactive-introduction/)
- [Procedural Generation - Voxel Tools Documentation](https://voxel-tools.readthedocs.io/en/latest/procedural_generation/)
- [Generators - Voxel Tools Documentation](https://voxel-tools.readthedocs.io/en/latest/generators/)
- [3D Cube World Level Generation - Accidental Noise](https://accidentalnoise.sourceforge.net/minecraftworlds.html)
- [Wave Function Collapse - Maxim Gumin (GitHub)](https://github.com/mxgmn/WaveFunctionCollapse)
- [Wave Function Collapse Explained - BorisTheBrave](https://www.boristhebrave.com/2020/04/13/wave-function-collapse-explained/)
- [WFC for Procedural Generation - Gridbugs](https://www.gridbugs.org/wave-function-collapse/)
- [Procedural Dungeon Generator - Future Data Lab](https://slsdo.github.io/procedural-dungeon/)
- [Constructive Generation Methods for Dungeons and Levels - Liapis](https://antoniosliapis.com/articles/pcgbook_dungeons.php)
- [Dungeon Generation - PCG Wiki](http://pcg.wikidot.com/pcg-algorithm:dungeon-generation)
- [L-system - Wikipedia](https://en.wikipedia.org/wiki/L-system)
- [Grammars and L-systems (PCG Book Chapter 5)](https://www.pcgbook.com/chapter05.pdf)
- [L-Systems in Games - Wiltchamberian (Medium)](https://medium.com/@wiltchamberian777/l-system-in-game-cc2b79c2a17f)
- [Procedural City Generation - TMWhere](https://www.tmwhere.com/city_generation.html)
- [Procedural Generation For Dummies: Road Generation - Martin Devans](https://martindevans.me/game-development/2015/12/11/Procedural-Generation-For-Dummies-Roads/)
- [A Survey of Procedural Techniques for City Generation - CityGen](http://www.citygen.net/files/Procedural_City_Generation_Survey.pdf)
- [Smooth Voxel Terrain (Part 2) - 0fps](https://0fps.net/2012/07/12/smooth-voxel-terrain-part-2/)
- [Marching Cubes - Wikipedia](https://en.wikipedia.org/wiki/Marching_cubes)
- [Dual Contouring Tutorial - BorisTheBrave](https://www.boristhebrave.com/2018/04/15/dual-contouring-tutorial/)
- [Understanding Surface Nets - Cerbion.NET](https://cerbion.net/blog/understanding-surface-nets/)
- [Fast Poisson Disk Sampling - Bridson (via A5huynh)](https://a5huynh.github.io/posts/2019/poisson-disk-sampling/)
- [Poisson Disk Sampling - DevMag](http://devmag.org.za/2009/05/03/poisson-disk-sampling/)
- [Hydraulic Erosion Simulation - Job Talle](https://jobtalle.com/simulating_hydraulic_erosion.html)
- [Three Ways of Generating Terrain with Erosion - dandrino (GitHub)](https://github.com/dandrino/terrain-erosion-3-ways)
- [Realtime Procedural Terrain Generation - MIT](https://web.mit.edu/cesium/Public/terrain.pdf)
- [Loot Drop Best Practices - GameDeveloper](https://www.gamedeveloper.com/design/loot-drop-best-practices)
- [Defining Loot Tables in ARPG Game Design - Game Wisdom](https://game-wisdom.com/critical/loot-tables-game-design)
- [Generative Grammars for PCG - Shaggy Dev](https://shaggydev.com/2022/03/16/generative-grammars/)
- [Procedural Generation of Branching Quests - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1875952122000155)
- [PCG Survey with LLM Integration - arXiv (2024)](https://arxiv.org/html/2410.15644v1)
- [Optimization of Procedural Generation in Godot Engine - ResearchGate](https://www.researchgate.net/publication/389218571_PTIMIZATION_OF_PROCEDURAL_GENERATION_IN_GODOT_ENGINE)
- [Procedural Generation in Game Design (Book) - Short & Adams](https://www.amazon.com/Procedural-Generation-Design-Tanya-Short/dp/1498799191)
- [Procedural Generation: Complete Guide - Generalist Programmer](https://generalistprogrammer.com/procedural-generation-games)
- [Noise Functions Overview - GameIdea.org](https://gameidea.org/2023/12/16/noise-functions/)
