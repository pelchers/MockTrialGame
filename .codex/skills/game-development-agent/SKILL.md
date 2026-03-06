---
name: game-development-agent
description: Comprehensive game development skill covering ECS, graphics (2D/2.5D/3D), animation, multiplayer architectures, design patterns, physics, audio, AI/pathfinding, UI/UX, performance optimization, procedural generation, and DevOps/deployment. Use when building any game system, designing architecture, debugging performance, or making technology decisions. Works with any engine but includes Godot-specific guidance.
---

# Game Development Agent Skill

Comprehensive game development reference covering 12 domains with ~11,000 lines of deep-dive resource files. This SKILL.md provides summary-level guidance for each domain. For implementation details, pseudocode, and citations, read the corresponding resource file.

## Resource File Index

| Domain | Resource File | Lines | Key Topics |
|--------|--------------|-------|------------|
| Entity Component Systems | `resources/entity-component-systems.md` | 683 | Archetype/sparse-set ECS, DOD, cache optimization, Godot hybrid |
| Graphics & Rendering | `resources/graphics-and-rendering.md` | 708 | 2D/2.5D/3D pipelines, shaders, PBR, voxel meshing |
| Animation Systems | `resources/animation-systems.md` | 785 | Skeletal, procedural, blend trees, IK, multiplayer sync |
| Multiplayer Architectures | `resources/multiplayer-architectures.md` | 1386 | P2P/dedicated/hybrid, rollback, netcode, anti-cheat, infrastructure |
| Game Design Patterns | `resources/game-design-patterns.md` | 1588 | 37 patterns with pseudocode, GoF + game-specific + architectural |
| Physics & Collision | `resources/physics-and-collision.md` | 762 | Rigid body, collision detection, character controllers, voxel physics |
| Audio Systems | `resources/audio-systems.md` | 553 | Spatial audio, adaptive music, middleware, accessibility |
| AI & Pathfinding | `resources/ai-and-pathfinding.md` | 1037 | FSM, behavior trees, GOAP, A*, NavMesh, voxel pathfinding |
| UI/UX for Games | `resources/ui-ux-for-games.md` | 796 | HUD, inventory, chat, input systems, accessibility, localization |
| Performance Optimization | `resources/performance-optimization.md` | 740 | CPU/GPU profiling, voxel optimization, GDScript perf, benchmarking |
| Procedural Generation | `resources/procedural-generation.md` | 822 | Noise, terrain gen, WFC, L-systems, loot tables, voxel world gen |
| DevOps & Deployment | `resources/devops-and-deployment.md` | 1078 | CI/CD, Docker, Agones/GameLift, matchmaking, analytics, cost |

## How to Use This Skill

1. **Start here** for domain overviews and decision guidance
2. **Read the resource file** when you need implementation details, pseudocode, or specific algorithms
3. **Cross-reference** between domains -- most game systems touch multiple areas

## Domain Summaries

### 1. Entity Component Systems (ECS)

ECS separates data (Components) from behavior (Systems), operating on flat entity IDs rather than deep inheritance trees. This yields cache-friendly memory layouts and flexible composition.

**Architecture Variants:**
- **Archetype-based** (Unity DOTS, Flecs, Bevy) -- Groups entities by component set into dense tables. Fast iteration, but structural changes (add/remove component) require moving entities between tables
- **Sparse-set based** (EnTT, Shipyard) -- Each component type in its own dense array with sparse lookup. O(1) add/remove, slightly slower iteration
- **Bitset-based** (older, EntityX) -- Bitmask per entity. Simple but poor cache behavior at scale

**When to use ECS:** Large entity counts (1000+), need for parallel processing, data-heavy simulation
**When to use OOP/nodes:** Small entity counts, rapid prototyping, UI-heavy systems
**Godot hybrid:** Use Godot's node/scene system for structure, ECS-like patterns (resource components, system autoloads) for hot simulation paths

### 2. Graphics & Rendering

**Rendering approaches by dimension:**
- **2D:** Sprite batching, tilemap rendering, 2D normal-map lighting, pixel art with nearest-neighbor filtering
- **2.5D:** Isometric (diamond/staggered/hex), billboard sprites, raycasting, Mode 7 affine transforms
- **3D:** Mesh rendering, PBR materials (metallic-roughness), shadow maps (CSM), post-processing pipeline

**Forward vs Deferred rendering:**
- Forward: Simple, MSAA support, good for few lights. Godot Mobile renderer uses this
- Deferred: Handles many lights efficiently, higher base cost. Godot Forward+ is a clustered hybrid
- Choose based on light count and target platform

**Voxel rendering (Chat Attack):**
- Greedy meshing reduces face count 80-95% vs naive
- Chunk-based rendering (16x16x16) with frustum culling
- LOD via octree or transvoxel for distant terrain
- Per-vertex ambient occlusion for visual quality

**Shaders:** Vertex/fragment/compute. Godot Shading Language is GLSL-like. Common effects: toon, outline, dissolve, water, fog.

### 3. Animation Systems

**Core techniques:**
- **Sprite animation:** Atlas-based, frame-by-frame. Good for 2D and pixel art
- **Skeletal animation:** Bones + skinning. FK for authoring, IK for runtime adaptation (foot placement, aiming)
- **Procedural animation:** Runtime-generated motion (ragdoll, spring systems, walk cycles). No pre-authored data needed
- **Tweening:** Property interpolation for UI and game objects. Sequence/parallel composition

**State machines and blending:**
- Animation state machines with transition conditions
- 1D/2D blend trees for locomotion (walk/run speed, direction)
- Animation layers for partial body blending (shoot while running)
- Additive blending for overlay animations (breathing, recoil)

**Multiplayer animation:** Replicate state machine parameters (not individual bone transforms). Use interest management to cull distant animations. Delta compress parameter changes.

### 4. Multiplayer Architectures

**Network models (decision matrix):**
| Model | Latency | Security | Cost | Scalability | Cheat Resistance |
|-------|---------|----------|------|-------------|-----------------|
| P2P (full mesh) | Low | Low | Free | Poor (max ~8) | Very Low |
| P2P (relay) | Medium | Low | Low | Medium | Low |
| Client-Server (dedicated) | Medium | High | High | High | High |
| Client-Server (listen) | Variable | Medium | Free | Medium | Medium |
| Cloud fleet | Medium | High | Variable | Very High | High |

**Chat Attack uses: Dedicated server with ENetMultiplayerPeer, server-authoritative with client prediction.**

**Sync strategies:**
- **Lockstep:** Deterministic, all inputs synced. Good for RTS, fighting games
- **State sync:** Server sends snapshots, clients interpolate. Good for FPS, action games
- **Rollback (GGPO):** Predict locally, rollback on mismatch. Good for fighting, fast-paced action
- **Delta compression:** Only send changed state. Essential for bandwidth

**Latency compensation:** Client-side prediction, server reconciliation, entity interpolation, lag compensation (server rewind for hit detection)

**Anti-cheat:** Server-side validation (movement, economy), rate limiting, interest management (don't send hidden data), audit logs

### 5. Game Design Patterns

**Most important patterns for game development:**

| Problem | Pattern | Use Case |
|---------|---------|----------|
| Input handling, undo/redo | Command | Rebindable keys, replay systems |
| AI behavior, player states | State Machine / HSM | Character controllers, game flow |
| Decoupled communication | Observer / Event Queue | UI updates, achievement triggers |
| Reusable shared data | Flyweight / Type Object | Item definitions, block types |
| Object reuse | Object Pool | Bullets, particles, enemies |
| Spatial queries | Spatial Partition | Collision broad phase, AOI |
| Cache-friendly iteration | Data Locality / ECS | Hot simulation loops |
| Service access | Service Locator | Audio, input, networking |
| Replay/audit | Event Sourcing | Transaction logs, rollback |
| Server scalability | CQRS | Read/write separation |

**Anti-patterns to avoid:** God objects, deep inheritance (use composition), premature optimization, spaghetti event systems (use typed events with clear ownership)

### 6. Physics & Collision

**Collision detection pipeline:**
1. **Broad phase:** Spatial hash or BVH to find potential pairs. O(n) to O(n log n)
2. **Narrow phase:** GJK/EPA or SAT for exact contact. Per-pair
3. **Response:** Impulse-based resolution with friction and restitution

**Character controllers:** Prefer kinematic (move_and_slide) over physics-based for responsive gameplay. Use floating capsule approach with raycasts for ground detection, slope handling, step climbing.

**Voxel physics (Chat Attack):**
- Falling blocks (sand, gravel) via cellular automata
- Structural integrity for cascading destruction
- Water flow simulation
- Voxel collision shapes from chunk mesh or heightmap

**Multiplayer physics:** Server-authoritative for gameplay-critical physics. Client prediction with rollback for responsive feel. Quantize and delta-compress physics state for bandwidth.

### 7. Audio Systems

**Bus architecture:** Master > SFX / Music / Voice / Ambient. Use ducking (lower music during dialogue), snapshots for scene transitions.

**Spatial audio:** Distance attenuation (logarithmic for realism), HRTF for headphones, occlusion via raycasts, reverb zones per environment.

**Adaptive music:** Vertical remixing (layer stems in/out based on game state) + horizontal re-sequencing (transition between sections at beat boundaries). Stingers for punctuation events.

**Implementation:** Sound event system (play by name, not direct reference), audio pooling, priority-based voice stealing, streaming for music / preload for SFX.

**Middleware decision:** Use Godot built-in AudioServer for most cases. Consider FMOD/Wwise for complex adaptive music or large audio teams.

### 8. AI & Pathfinding

**Decision-making hierarchy:**
- **FSM:** Simple, predictable. Good for NPCs with few states. Upgrade to HFSM for complexity
- **Behavior Trees:** Modular, reusable. Industry standard for complex AI. Tick-based with blackboard data
- **GOAP:** Planning-based. Emergent behavior from action combinations. Higher CPU cost but more flexible
- **Utility AI:** Score-based selection. Good for non-binary decisions (which target, which resource)

**Pathfinding selection:**
- **A*:** General purpose, optimal with admissible heuristic
- **Jump Point Search:** 10x faster A* on uniform-cost grids
- **NavMesh:** Standard for 3D. Godot NavigationServer3D
- **Flow Fields:** Best for many units going to same target (RTS)
- **HPA*:** Hierarchical for large worlds. Pre-compute zone connectivity

**Voxel pathfinding (Chat Attack):** 3D grid A* with chunk-based caching. Handle dynamic obstacles from block edits. Separate movement layers for walking/climbing/flying/swimming.

### 9. UI/UX for Games

**UI categories:**
- **Diegetic:** In-world (signs, screens on objects)
- **Non-diegetic:** HUD overlays (health bar, minimap)
- **Spatial:** 3D elements in game space (nameplates, damage numbers)
- **Meta:** Not in-world but contextual (screen blood splatter, breathing effects)

**Architecture:** Stack-based menu navigation, data-binding with Godot signals, UI state machines for complex flows.

**Chat Attack UI priorities:** Chat system (channels, auto-scroll, rate limiting), faction UI (roster, permissions, territory map), economy UI (shop, trading), inventory system, minimap with territory overlay.

**Input:** Godot InputMap with runtime rebinding. Input buffering for responsive combat. Context-sensitive layers (gameplay vs chat vs menu).

**Accessibility:** Color blind modes, scalable fonts, screen reader support, remappable controls, reduced motion option.

### 10. Performance Optimization

**Profiling first, optimize second.** Use Godot Profiler for GDScript, Tracy for C++, RenderDoc for GPU.

**CPU bottlenecks:** Data-oriented design (SoA layout), object pooling, amortize heavy work across frames, use StringName instead of string comparisons in GDScript.

**GPU bottlenecks:** Reduce draw calls (batching, instancing), optimize shaders (avoid branching, use appropriate precision), LOD, occlusion culling.

**GDScript performance hierarchy:** GDScript (1x) < C# (3-10x) < C++ GDExtension (10-50x). Use static typing in GDScript for up to 47% speedup.

**Voxel optimization (Chat Attack):**
- Greedy meshing for chunk mesh generation
- Multithreaded chunk generation (godot-voxel handles this)
- Chunk LOD with octree
- RLE + palette compression for voxel data
- Priority-based chunk loading (nearest first)

**Frame budget at 60 FPS = 16.67ms:** Physics ~3ms, AI ~2ms, Gameplay ~3ms, Rendering ~6ms, Networking ~1ms, Audio ~0.5ms, UI ~1ms.

### 11. Procedural Generation

**Noise fundamentals:** Perlin/Simplex for smooth terrain, Worley for cells/cracks, fractal noise (fBm) for natural detail. Domain warping for organic distortion.

**Terrain generation (Chat Attack):**
- 3D density field from noise for caves, overhangs, floating islands
- Biome system: temperature + moisture maps determine surface blocks
- Ore distribution: depth-based rarity with cluster noise
- Chunk-based infinite terrain with border stitching
- Erosion simulation for natural-looking landscapes

**Level/dungeon generation:**
- BSP for room-corridor layouts
- Cellular automata for organic caves
- WFC for tileable structures with constraints
- Prefab stitching for hand-designed variety

**Loot and items:** Weighted random with rarity tiers. Pity systems (hard pity = guaranteed after N rolls, soft pity = increasing probability).

**Performance:** Async generation on worker threads, LOD for distant procedural content, cache generated results, priority-based streaming.

### 12. DevOps & Deployment

**Build pipeline:** GitHub Actions with Godot headless export. Multi-platform matrix (Windows, Linux, Mac, Android, Web). Automated testing in CI.

**Server infrastructure (Chat Attack):**
- Docker containerized Godot dedicated server
- Agones on Kubernetes for orchestration and auto-scaling
- Alternative: AWS GameLift with FleetIQ
- Rolling updates for zero-downtime deploys

**Matchmaking:** ELO/Glicko-2 for ranked, TrueSkill for team-based. Queue-based with relaxation over time. Party support.

**Database:** Polyglot persistence -- PostgreSQL for structured data (players, factions), Redis for caching/leaderboards, InfluxDB for metrics. Shard by region or faction.

**LiveOps:** Feature flags for safe rollouts, remote config for tuning without client updates, live events, maintenance windows with advance notice.

**Monitoring:** Prometheus + Grafana for server metrics. Track tick rate, CCU, memory, CPU. Alert on anomalies. Crash reporting via Sentry.

**Cost:** Budget by CCU. Spot instances for non-critical workloads. Cloud comparison: AWS broadest game services, GCP best Kubernetes, Azure best if using PlayFab.

## Cross-Domain Patterns

Many game systems span multiple domains. Common cross-cutting concerns:

| Task | Primary Domain | Also Touches |
|------|---------------|--------------|
| Character movement | Physics | Animation, Networking, Input (UI/UX) |
| Combat system | Design Patterns | Physics, Animation, Audio, Networking, UI/UX |
| Terrain rendering | Graphics | Procedural Generation, Performance, Physics |
| NPC behavior | AI & Pathfinding | Animation, Audio, Design Patterns |
| Inventory system | UI/UX | Design Patterns, Networking, DevOps (persistence) |
| Faction territory | Networking | UI/UX, Procedural Generation, DevOps (database) |
| Build/deploy | DevOps | Performance (benchmarking), Networking (infrastructure) |

## Chat Attack Relevance

This skill is engine-agnostic but includes Godot-specific guidance throughout. For Chat Attack specifically:
- **Primary domains:** Multiplayer Architectures, Voxel sections of Graphics/Physics/ProcGen/Performance
- **Secondary domains:** ECS (for entity-heavy simulation), Design Patterns (event sourcing for economy), UI/UX (chat, factions, economy)
- **Infrastructure:** DevOps (dedicated server hosting, matchmaking, persistence)
- **For Godot-specific details:** See the companion `godot-development-agent` skill
