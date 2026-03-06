# Entity Component Systems (ECS) - Comprehensive Reference

## What is ECS?

Entity Component System (ECS) is a software architectural pattern that prioritizes **composition over inheritance**. It decomposes game objects into three orthogonal concepts:

- **Entities** -- unique identifiers (typically just an integer ID) with no data or behavior
- **Components** -- plain data structures (PODs) attached to entities, containing no logic
- **Systems** -- functions that iterate over entities matching a specific set of components and perform logic

ECS separates **data** (components) from **behavior** (systems), which is fundamentally different from OOP where objects encapsulate both. This separation enables cache-friendly memory layouts, straightforward parallelism, and highly composable game object definitions.

### Why ECS Exists: The Inheritance Problem

Traditional OOP game architectures suffer from the **diamond problem** and deep inheritance hierarchies. Consider a class tree like `GameObject > Character > Player > FlyingPlayer` -- adding a "swimming" ability forces restructuring. ECS eliminates this by letting any entity acquire any combination of components at runtime:

```
// OOP: rigid hierarchy
class FlyingSwimmingPlayer extends ???  // diamond problem

// ECS: flexible composition
entity.add(Position{})
entity.add(Velocity{})
entity.add(CanFly{})
entity.add(CanSwim{})
entity.add(PlayerControlled{})
```

Entities can change their component set dynamically. Systems automatically pick up or drop entities as their component signatures change.

---

## Core Concepts

### Entities

An entity is nothing more than a unique identifier -- often a 32-bit or 64-bit integer. It has no data, no behavior, and no type. Its identity comes entirely from which components are attached to it. Most frameworks use **generational IDs** (index + generation counter) to safely recycle entity slots without dangling references.

### Components

Components are plain data containers. They should contain **zero logic** -- no methods that mutate state, no virtual functions. Examples:

```
struct Position { float x, y, z; }
struct Velocity { float x, y, z; }
struct Health { int current; int max; }
struct EnemyTag {}              // zero-sized "tag" component
```

Tag components (zero-sized types) are used to mark entities for system filtering without storing any data.

### Systems

Systems are functions that query the world for entities matching a component signature and operate on them. A movement system might require `(Position, Velocity)` and update positions each frame:

```
fn movement_system(query: Query<(&mut Position, &Velocity)>) {
    for (pos, vel) in query.iter_mut() {
        pos.x += vel.x * delta_time;
        pos.y += vel.y * delta_time;
    }
}
```

Systems should be stateless or hold minimal configuration. They read and write components through queries, not by directly accessing entity internals.

### World

The World is the top-level container that owns all entities, components, and resources (global singletons). It manages entity creation/destruction, component storage, and system scheduling. There is typically one World per simulation, though some architectures support multiple worlds for staging or testing.

---

## Architecture Variants

### Archetype-Based (Table) Storage

**Used by:** Unity DOTS, Flecs, Bevy ECS, Legion, Arch

An **archetype** is defined by a unique combination of component types. All entities with the exact same set of components belong to the same archetype. Each archetype stores its components in dense, tightly-packed arrays (one column per component type), forming a table:

```
Archetype: [Position, Velocity, Health]
+----------+----------+--------+
| Position | Velocity | Health |
+----------+----------+--------+
| {1,2,3}  | {0,1,0}  | {100}  |  <- Entity A
| {4,5,6}  | {1,0,0}  | {80}   |  <- Entity B
| {7,8,9}  | {0,0,1}  | {50}   |  <- Entity C
+----------+----------+--------+
```

**Advantages:**
- Iteration is extremely fast due to linear memory access and cache locality
- Query evaluation reduces to scanning a small list of matching archetypes
- Once archetype tables stabilize (which happens quickly), query overhead approaches zero

**Disadvantages:**
- Adding or removing a component moves the entity to a different archetype table, which requires copying all its component data -- this is expensive if done frequently
- Many unique component combinations can cause "archetype fragmentation" with many small tables

### Sparse-Set Based Storage

**Used by:** EnTT, Shipyard

Each component type gets its own **sparse set**: a pair of arrays where the **sparse array** maps entity IDs to indices in the **dense array** of actual component values.

```
Sparse Array (indexed by entity ID):
[_, 0, _, 2, 1, _, ...]    // entity 1 -> dense[0], entity 4 -> dense[1], etc.

Dense Array (packed component data):
[Position{1,2,3}, Position{4,5,6}, Position{7,8,9}]
```

**Advantages:**
- Adding/removing components is O(1) -- no data migration between tables
- Excellent for dynamic scenarios with frequent component changes
- Simple implementation

**Disadvantages:**
- Multi-component iteration requires cross-referencing multiple sparse sets via indirection, which hurts cache performance at scale
- Iteration performance degrades compared to archetype storage for large entity counts (the crossover point is roughly 100K-1M entities depending on the workload)

EnTT (used by Minecraft) mitigates iteration costs through **component sorting** and **ownership groups** that keep related components packed together.

### Bitset-Based Storage

**Used by:** EntityX, older Specs

Components are stored in arrays indexed directly by entity ID. A **bitset** (one per component type) tracks which entities have which components. Query evaluation checks bitset intersections -- CPUs can evaluate 64 entities in a single AND instruction on 64-bit words.

**Advantages:**
- Very fast component presence checks
- Simple query evaluation through bitwise operations

**Disadvantages:**
- Arrays indexed by entity ID waste memory for sparse populations
- Poor cache behavior since entities with the same components may be scattered across the array
- Does not scale well with high entity churn

### Reactive ECS

**Used by:** Entitas

Rather than polling for component changes, reactive ECS implementations track entity mutations via signals/events. Systems subscribe to specific change events and only execute when relevant data changes.

**Advantages:**
- Eliminates per-frame polling overhead for infrequent events
- Natural fit for event-driven game logic

**Disadvantages:**
- Adds complexity to the mutation path
- Can cause unpredictable execution ordering if not carefully managed

---

## Data-Oriented Design (DOD) Principles

ECS is often associated with Data-Oriented Design, though they are distinct concepts. DOD analyzes data access patterns and selects structures that optimally leverage hardware. ECS can be implemented without DOD, and DOD can be applied without ECS.

### Cache Coherency and Memory Layout

Modern CPUs fetch memory in **cache lines** (typically 64 bytes). A cache miss to main memory costs 100-300+ cycles. DOD structures data to maximize sequential cache line utilization.

#### Array of Structures (AoS)

All fields of an entity stored contiguously:

```
[{pos, vel, health, name}, {pos, vel, health, name}, ...]
```

If a system only reads `pos` and `vel`, the `health` and `name` fields still occupy cache lines, wasting bandwidth.

#### Structure of Arrays (SoA)

Each field type stored in its own contiguous array:

```
positions:  [pos, pos, pos, ...]
velocities: [vel, vel, vel, ...]
healths:    [health, health, health, ...]
```

A system iterating only `positions` and `velocities` now has perfect cache utilization. Concrete example: with 10,000 entities, AoS pulls roughly 3,300 cache lines for a health-regeneration system, while SoA pulls approximately 1,250 cache lines -- about one-third.

### Hot/Cold Data Splitting

Separate frequently accessed ("hot") data from rarely accessed ("cold") data. For example, `Position` and `Velocity` are read every frame (hot), while `PlayerName` and `CreationTimestamp` are read only occasionally (cold). Keeping them in separate storage prevents cold data from polluting the cache during hot-path iteration.

Archetype-based ECS naturally achieves column-oriented (SoA-like) storage within each archetype table. Sparse-set ECS stores each component type in its own array, which is also SoA by nature.

---

## Component Storage Strategies

### Dense Arrays (Archetype Tables)

Components stored in contiguous arrays within archetype tables. Index alignment means `positions[i]` and `velocities[i]` always refer to the same entity. Provides the best iteration performance but requires data movement on structural changes.

### Sparse Sets

Two-level indirection: sparse array (entity ID -> dense index) and dense array (packed component data). O(1) add/remove by swapping the last element into the removed slot. EnTT uses **paged sparse arrays** to avoid allocating memory for the entire entity ID space.

### Paged/Chunked Pools

Both archetype and sparse-set implementations often use **paged allocation** rather than a single contiguous array. Pages (typically 4KB-32KB) avoid large reallocation spikes. When a page fills, a new page is allocated and linked. This also provides **pointer stability** -- existing component pointers remain valid when new entities are added.

### Memory Allocation Patterns

- **Group interleaved (AoS):** All components of an entity packed together in one flat array
- **Group non-interleaved (SoA):** Components grouped by type within a shared allocation
- **Block storage:** Each component type in its own flat block
- **Heap allocation:** Individual malloc per component (worst performance, sometimes needed for variable-size data)

---

## System Scheduling and Ordering

### Dependency Graphs

Systems form a **Directed Acyclic Graph (DAG)** based on their data access patterns. Two systems can run in parallel if they have no conflicting writes to the same component types. Conflicts require sequential ordering.

```
System A: reads Position, writes Velocity
System B: reads Health, writes Damage
System C: reads Velocity, writes Position

A and B -> parallel (no shared components)
A and C -> sequential (both touch Position and Velocity)
```

### Read/Write Access Tracking

Modern ECS frameworks automatically deduce system dependencies from function signatures:

- **Read-only** access to a component type does not conflict with other reads
- **Write** access conflicts with any other read or write to the same type
- The scheduler builds the DAG at startup and dispatches systems to worker threads

Bevy ECS determines parallelism from Rust function parameter types at compile time. Unity DOTS uses the Job System with explicit read/write declarations.

### System Phases

Most games organize systems into phases:

```
1. Input       -- read player input, generate commands
2. Simulation  -- physics, AI, game logic
3. Events      -- process deferred events, structural changes
4. Rendering   -- prepare render data, submit draw calls
5. Cleanup     -- destroy marked entities, flush buffers
```

Structural changes (adding/removing components, spawning/destroying entities) are typically **deferred** via command buffers and applied between phases to avoid invalidating iterators during system execution.

### Parallel Execution

A greedy scheduler assigns ready systems to available worker threads:

1. Build the DAG from declared component access
2. Identify systems with zero unmet dependencies
3. Dispatch those systems to threads
4. As each system completes, update the DAG and dispatch newly unblocked systems
5. Barrier at phase boundaries for structural change application

---

## Entity Relationships and Hierarchies

### The Hierarchy Problem

ECS is inherently flat -- entities are just IDs with no built-in structure. Yet games constantly need hierarchies: a sword attached to a character's hand, UI elements nested in panels, a turret mounted on a vehicle.

### Component-Based Hierarchies

The simplest approach stores hierarchy data in components:

```
struct Parent { entity_id: EntityId }
struct Children { ids: Vec<EntityId> }

// Or a linked-list approach for O(1) insert/remove:
struct ChildLink {
    first_child: EntityId,
    next_sibling: EntityId,
    prev_sibling: EntityId,
}
```

This works in any ECS but has no special framework support, meaning cascade operations (delete parent -> delete children) must be manually implemented.

### Relationship Pairs (Flecs)

Flecs introduced first-class **entity relationships** as pairs `(Relationship, Target)`:

```cpp
// Create a hierarchy
auto parent = ecs.entity("Parent");
auto child = ecs.entity("Child")
    .add(flecs::ChildOf, parent);

// Query children of a specific parent
auto q = world.query_builder<Position>()
    .with(flecs::ChildOf, parent)
    .build();
```

Built-in relationships include `ChildOf` (hierarchies), `IsA` (inheritance/prefabs), and custom relationships for game logic (e.g., `Likes`, `Owns`, `Targets`). Cleanup policies like `(OnDeleteTarget, Delete)` enable automatic recursive deletion.

### Entity References and Handles

Generational entity IDs prevent dangling references. When an entity is destroyed, its generation counter increments. Any handle holding the old generation will fail validation checks:

```
EntityId { index: 42, generation: 3 }
// Entity 42 destroyed, slot recycled with generation 4
// Old handle { 42, 3 } != current { 42, 4 } -> invalid
```

---

## Popular Frameworks

### Unity DOTS / ECS (C#)

Unity's Data-Oriented Technology Stack combines three technologies: ECS for data architecture, the C# Job System for multithreading, and the Burst Compiler for SIMD optimization. As of Unity 6, DOTS has graduated from experimental to a core feature.

```csharp
// Component definition
public struct Position : IComponentData { public float3 Value; }
public struct Velocity : IComponentData { public float3 Value; }

// System definition
public partial struct MovementSystem : ISystem {
    public void OnUpdate(ref SystemState state) {
        float dt = SystemAPI.Time.DeltaTime;
        foreach (var (pos, vel) in
            SystemAPI.Query<RefRW<Position>, RefRO<Velocity>>()) {
            pos.ValueRW.Value += vel.ValueRO.Value * dt;
        }
    }
}

// Entity creation
EntityManager.CreateEntity(typeof(Position), typeof(Velocity));
```

**Architecture:** Archetype-based. Entities stored in chunks (16KB) grouped by archetype. Burst compiles system inner loops to highly optimized native code with auto-vectorization.

### Bevy ECS (Rust)

Bevy is a data-driven game engine where ECS is the foundation. Components are normal Rust structs with a derive macro. Systems are plain functions whose parameter types determine data access.

```rust
#[derive(Component)]
struct Position { x: f32, y: f32 }

#[derive(Component)]
struct Velocity { x: f32, y: f32 }

fn movement(mut query: Query<(&mut Position, &Velocity)>, time: Res<Time>) {
    for (mut pos, vel) in &mut query {
        pos.x += vel.x * time.delta_secs();
        pos.y += vel.y * time.delta_secs();
    }
}

// Registration
app.add_systems(Update, movement);
```

**Architecture:** Archetype-based. Rust's type system enables compile-time access tracking for automatic parallel scheduling. Plugin architecture for modular feature composition.

### Flecs (C/C++)

Flecs is a high-performance ECS for C and C++ with first-class entity relationships, a built-in query language, and a multithreaded scheduler. Used in production for large-scale simulations.

```cpp
struct Position { float x, y; };
struct Velocity { float x, y; };

flecs::world ecs;

ecs.system<Position, const Velocity>()
    .each([](Position& p, const Velocity& v) {
        p.x += v.x;
        p.y += v.y;
    });

auto e = ecs.entity()
    .set(Position{10, 20})
    .set(Velocity{1, 2});

// Relationships
auto child = ecs.entity()
    .add(flecs::ChildOf, e)
    .set(Position{0, 0});
```

**Architecture:** Archetype-based with relationship support. Includes a REST API and web-based explorer for runtime debugging.

### EnTT (C++)

EnTT is a header-only ECS library used by Minecraft (Bedrock Edition). It prioritizes ergonomics and flexibility over pure iteration throughput.

```cpp
entt::registry registry;

auto entity = registry.create();
registry.emplace<Position>(entity, 10.0f, 20.0f);
registry.emplace<Velocity>(entity, 1.0f, 2.0f);

// System as a view iteration
auto view = registry.view<Position, const Velocity>();
view.each([](Position& pos, const Velocity& vel) {
    pos.x += vel.x;
    pos.y += vel.y;
});
```

**Architecture:** Sparse-set based. Paged sparse arrays minimize memory waste. Ownership groups allow sorting for improved iteration. Excellent add/remove performance.

### Godot's Node System vs ECS (Hybrid Approaches)

Godot uses a traditional OOP node tree where nodes contain both data and logic. Composition happens at the node level (scenes within scenes) rather than at the component level. The official Godot team has explained that this is an intentional design choice: nodes are higher-level abstractions than ECS components, and the inheritance tree makes relationships explicit and discoverable.

However, several community frameworks bring ECS patterns into Godot:

**GECS (Godot Entity Component System):**

```gdscript
# Component: data-only resource
class_name C_Velocity extends Component
@export var velocity := Vector3.ZERO

# Entity: a Godot node with components
var player = Entity.new()
player.add_component(C_Health.new(100))
player.add_component(C_Velocity.new(Vector3(5, 0, 0)))
ECS.world.add_entities([player])

# System: queries entities and processes them
class_name MovementSystem extends System
func query():
    return q.with_all([C_Velocity, C_Transform])

func process(entity, delta):
    var vel = entity.get_component(C_Velocity)
    var transform = entity.get_component(C_Transform)
    transform.position += vel.velocity * delta
```

**GDQuest Entity-Component Pattern:** Uses child nodes as components, with each component node holding data and the parent entity node wiring them together. This preserves Godot's inspector workflow while achieving data/logic separation.

**When to use hybrid ECS in Godot:**
- High entity counts (thousands of similar entities like bullets, particles, NPCs)
- Systems with complex cross-cutting concerns (damage, buffs, status effects)
- When you need data-driven entity definitions loadable from configuration

**When to stick with Godot's node system:**
- Fewer, more complex objects with rich scene trees
- Heavy use of Godot's built-in nodes (CharacterBody3D, AnimationPlayer, etc.)
- Prototyping and rapid iteration where inspector workflow matters

---

## When to Use ECS vs Traditional OOP

### ECS Excels At

- **High entity counts:** Thousands to millions of similar entities (RTS units, particles, bullets)
- **Simulation-heavy games:** Complex interlocking systems (faction AI, economy, physics)
- **Dynamic composition:** Entities that gain/lose abilities at runtime
- **Parallelism:** Systems with clear data boundaries run on multiple cores
- **Procedural content:** Generated entities with varying component combinations
- **Modding support:** New components and systems can be added without modifying existing code

### OOP / Scene Trees Excel At

- **Fewer, richer objects:** Characters with deep animation trees and complex state machines
- **Graphically-driven content:** Scene composition in visual editors (Godot, Unity prefabs)
- **Rapid prototyping:** OOP is more intuitive for small projects and quick experiments
- **Tool/editor integration:** Inspector-driven workflows work best with object-oriented nodes

### Hybrid Is Often Best

Most shipped games use a **hybrid approach**: ECS for the simulation layer (physics, AI, economy) and traditional OOP/scene trees for presentation (rendering, UI, audio). The two can coexist -- the ECS world can drive the state of scene-tree nodes each frame.

---

## Anti-Patterns and Common Mistakes

### God Components

Packing too much data into a single component defeats the purpose of ECS. A `PlayerData` component with position, velocity, health, inventory, and stats should be split into `Position`, `Velocity`, `Health`, `Inventory`, `Stats`.

### Logic in Components

Components should be pure data. Adding update methods or event handlers to components creates hidden coupling and prevents systems from being reordered or parallelized.

### System Ordering Dependencies

Relying on implicit frame-ordering between systems (e.g., assuming DamageSystem always runs before DeathSystem) leads to subtle bugs. Make dependencies explicit through framework scheduling APIs.

### Excessive Tag Components

Using dozens of zero-sized tag components for state machines (e.g., `IsIdle`, `IsWalking`, `IsRunning`, `IsJumping`) causes archetype fragmentation. Use an enum component instead:

```
// Anti-pattern: one tag per state
entity.add(IsWalking{})     // changes archetype every state transition

// Better: enum component
struct MovementState { enum { Idle, Walking, Running, Jumping } value; }
```

### Polling for Events

Checking a boolean flag on every entity every frame is wasteful for infrequent events. Use the observer pattern, event queues, or reactive systems where systems subscribe to specific changes.

### Premature ECS Adoption

Not every game needs ECS. For small projects with fewer than a few hundred entities, the architectural overhead may not be justified. Start simple and introduce ECS when performance or composition complexity demands it.

### Over-Fragmenting Components

The opposite of God Components -- splitting data into too many tiny components increases query complexity and archetype count. Group data that is almost always accessed together.

### Forgetting Deferred Structural Changes

Adding or removing components during iteration invalidates iterators in most frameworks. Always use command buffers / deferred operations and apply structural changes between system executions.

---

## Performance Characteristics

### Iteration Throughput

Archetype-based ECS achieves near-optimal iteration throughput because components are stored in contiguous arrays. Benchmarks show:

- **Flecs:** Handles millions of entities with sub-millisecond iteration for simple systems
- **Bevy ECS:** Comparable archetype iteration performance with automatic parallelism
- **EnTT:** Slightly slower raw iteration than archetypes for large counts, but faster structural changes
- **Unity DOTS + Burst:** Achieves C++-level performance through Burst auto-vectorization

### Structural Changes (Add/Remove Components)

- **Sparse-set (EnTT):** O(1) add/remove, no data copying
- **Archetype (Flecs, Bevy, Unity):** O(n) where n is the number of components on the entity (must copy all component data to a new archetype table)
- For games with frequent component changes (e.g., adding/removing buffs), sparse sets may outperform archetypes

### Memory Usage

- **Archetype:** Memory-efficient for homogeneous entity populations; can waste space with many small archetypes
- **Sparse-set:** Sparse arrays use memory proportional to the maximum entity ID; paging mitigates this
- **Bitset:** Memory proportional to max entity ID times number of component types

### Scaling Characteristics

The 2025 Eurographics study comparing sparse-set and archetype ECS found:
- Archetypes excel at iteration with entity counts above ~100K
- Sparse sets are faster for modification-heavy workloads
- The crossover point depends on the ratio of iteration to structural changes

---

## Integration with Godot

For the Chat Attack project (Godot 4.5, multiplayer voxel factions), there are several integration paths:

### Option 1: Node-Based Component Pattern

Use child nodes as components, keeping Godot's inspector and scene workflow:

```gdscript
# entity.tscn - Entity scene with component children
# + Entity (Node3D)
#   + HealthComponent (Node)
#   + FactionComponent (Node)
#   + ClaimComponent (Node)

# health_component.gd
class_name HealthComponent extends Node
@export var current: int = 100
@export var maximum: int = 100
```

### Option 2: Resource-Based Components with GECS

Use GECS for data-heavy systems (chunk management, economy transactions) while keeping Godot nodes for presentation:

```gdscript
# Chunk claim data in ECS
class_name C_ChunkClaim extends Component
@export var faction_id: int = -1
@export var claimed_at: float = 0.0

# Voxel edit ledger in ECS
class_name C_VoxelEdit extends Component
@export var position: Vector3i
@export var old_type: int
@export var new_type: int
@export var timestamp: float
```

### Option 3: Pure GDScript ECS for Server Simulation

For server-authoritative simulation, a lightweight ECS can process factions, claims, and economy without scene tree overhead:

```gdscript
# Minimal ECS world for server simulation
var entities: Dictionary = {}  # id -> component_dict
var next_id: int = 0

func create_entity() -> int:
    var id = next_id
    next_id += 1
    entities[id] = {}
    return id

func add_component(entity_id: int, component_name: String, data: Dictionary):
    entities[entity_id][component_name] = data

func query(required_components: Array) -> Array:
    var results = []
    for id in entities:
        var has_all = true
        for comp in required_components:
            if not entities[id].has(comp):
                has_all = false
                break
        if has_all:
            results.append(id)
    return results
```

### Recommendation for Chat Attack

Use a **hybrid approach**: Godot's node system for the client (rendering, UI, player controller) and ECS-inspired data patterns for the server simulation (factions, claims, economy ledger, voxel edit log). The server benefits from ECS's data-oriented access patterns for processing thousands of chunks and transactions, while the client benefits from Godot's scene tree for visual presentation.

---

## Citations

- [Entity Component System - Wikipedia](https://en.wikipedia.org/wiki/Entity_component_system)
- [ECS FAQ - Sander Mertens](https://github.com/SanderMertens/ecs-faq)
- [Building an ECS: Storage in Pictures - Sander Mertens](https://ajmmertens.medium.com/building-an-ecs-storage-in-pictures-642b8bfd6e04)
- [Building Games in ECS with Entity Relationships - Sander Mertens](https://ajmmertens.medium.com/building-games-in-ecs-with-entity-relationships-657275ba2c6c)
- [ECS Back and Forth Part 9: Sparse Sets and EnTT - skypjack](https://skypjack.github.io/2020-08-02-ecs-baf-part-9/)
- [ECS Back and Forth Part 4: Hierarchies - skypjack](https://skypjack.github.io/2019-06-25-ecs-baf-part-4/)
- [Run-time Performance Comparison of Sparse-set and Archetype ECS - Eurographics 2025](https://diglib.eg.org/bitstreams/766b72a4-70ae-4e8e-935b-949d589ed962/download)
- [Deep Diving into ECS Architecture and DOD - PRDeving](https://prdeving.wordpress.com/2023/12/14/deep-diving-into-entity-component-system-ecs-architecture-and-data-oriented-programming/)
- [Data Oriented Design is Not About SoA and ECS - Alex Dixon](https://polymonster.co.uk/blog/dod-ecs)
- [Nomad Game Engine: AoS vs SoA - Niko Savas](https://medium.com/@savas/nomad-game-engine-part-4-3-aos-vs-soa-storage-5bec879aa38c)
- [Flecs: A Fast Entity Component System for C and C++](https://github.com/SanderMertens/flecs)
- [Flecs Documentation: Relationships](https://www.flecs.dev/flecs/md_docs_2Relationships.html)
- [Flecs Documentation: Quickstart](https://www.flecs.dev/flecs/md_docs_2Quickstart.html)
- [EnTT: Gaming Meets Modern C++](https://github.com/skypjack/entt)
- [EnTT Wiki: Entity Component System](https://github.com/skypjack/entt/wiki/Entity-Component-System)
- [Bevy ECS Quick Start](https://bevy.org/learn/quick-start/getting-started/ecs/)
- [bevy_ecs Documentation](https://docs.rs/bevy_ecs/latest/bevy_ecs/)
- [Unity ECS](https://unity.com/ecs)
- [Unity DOTS](https://unity.com/dots)
- [ECS Development Status - Unity Discussions (March 2025)](https://discussions.unity.com/t/ecs-development-status-milestones-march-2025/1615810)
- [Unity DOTS and ECS Intermediate Guide 2025](https://quickunitytips.blogspot.com/2025/11/unity-dots-ecs-2025-guide.html)
- [Why Isn't Godot an ECS-Based Game Engine? - Godot Engine](https://godotengine.org/article/why-isnt-godot-ecs-based-game-engine/)
- [GECS: Godot Entity Component System](https://github.com/csprance/gecs)
- [Code the Entity-Component Pattern in Godot - GDQuest](https://www.gdquest.com/tutorial/godot/design-patterns/entity-component-pattern/)
- [ECS vs OOP - flamendless](https://flamendless.github.io/ecs-vs-oop/)
- [ECS: Inheritance vs Composition - LeatherBee Games](https://leatherbee.org/index.php/2019/09/12/ecs-1-inheritance-vs-composition-and-ecs-background/)
- [Design Decisions When Building Games Using ECS - Ariel Coppes](https://arielcoppes.dev/2023/07/13/design-decisions-when-building-games-using-ecs.html)
- [A Critique of the Entity Component Model - GameDev.net](https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/a-critique-of-the-entity-component-model-r3621/)
- [ECS Benchmark (C/C++) - abeimler](https://github.com/abeimler/ecs_benchmark)
- [ECS Benchmark (JS) - noctjs](https://github.com/noctjs/ecs-benchmark)
- [Entity Relations - Arche ECS](https://mlange-42.github.io/arche/guide/relations/)
- [ECS Scheduler Thoughts - ratysz](https://ratysz.github.io/article/scheduling-1/)
- [Benchmarking Component Allocation Strategies in ECS - Cerulean Skies](https://cerulean-skies.com/index.php?article=2)
- [The Entity-Component-System Design Pattern - UMLBoard](https://www.umlboard.com/design-patterns/entity-component-system.html)
- [The Essence of Entity Component System - Tasnim (SAC 2026)](https://boyang.cs.uwm.edu/publication/sac2026_ECS.pdf)
- [Legion ECS - GitHub](https://github.com/amethyst/legion)
- [Rust Entity Component Systems - Rodney Lab](https://rodneylab.com/rust-entity-component-systems/)
- [Specs and Legion: Two Very Different Approaches to ECS](https://csherratt.github.io/blog/posts/specs-and-legion/)
