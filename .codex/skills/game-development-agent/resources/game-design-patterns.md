# Game Design Patterns - Comprehensive Reference

## Why Game-Specific Patterns Matter

Games operate under constraints that typical business software does not face. Every frame must complete
within a hard real-time budget (16.6 ms at 60 FPS, 8.3 ms at 120 FPS). Memory allocation during gameplay
causes garbage collection stalls. Cache misses on hot paths destroy frame times. Physics, AI, rendering,
networking, and audio all compete for the same CPU time.

Design patterns in games are not academic exercises -- they are survival tools for shipping software that
must process thousands of entities, handle unpredictable player input, synchronize state across a network,
and render a convincing world, all within a few milliseconds per frame.

**Key constraints that shape game architecture:**
- **Frame budget**: All simulation, rendering, and I/O must complete within a fixed time slice.
- **Memory pressure**: Consoles and mobile devices have hard memory ceilings. Fragmentation kills.
- **Cache coherency**: Data layout matters more than class hierarchy. A cache miss is 100x slower than a hit.
- **Determinism**: Multiplayer replay and rollback netcode require identical outputs from identical inputs.
- **Iteration speed**: Designers need to tune gameplay without recompiling. Data-driven design is essential.

---

## Classic Gang of Four Patterns in Game Context

### Singleton (and Why to Avoid It)

Ensures a class has exactly one instance and provides a global access point.

```
class AudioManager:
    static instance = null

    static get():
        if instance == null:
            instance = new AudioManager()
        return instance

    play_sound(clip):
        # ...
```

**When to use**: Almost never. Acceptable for truly one-of-a-kind engine services during prototyping.

**When to avoid**: Production code. Singletons create hidden coupling, make testing difficult (cannot
substitute mocks), impose rigid initialization order, persist across scenes causing stale state bugs,
and make multithreading hazardous because every system touches the same global.

**Preferred alternatives**: Service Locator (see below), dependency injection, or simply passing
references through constructors.

---

### Observer / Event System

Defines a one-to-many dependency so that when one object changes state, all dependents are notified.

```
class EventBus:
    listeners = {}   # event_name -> list of callables

    subscribe(event_name, callback):
        listeners[event_name].append(callback)

    unsubscribe(event_name, callback):
        listeners[event_name].remove(callback)

    emit(event_name, data):
        for callback in listeners[event_name]:
            callback(data)

# Usage
EventBus.subscribe("player_died", ui.on_player_died)
EventBus.subscribe("player_died", audio.on_player_died)
EventBus.emit("player_died", { player_id: 1 })
```

**When to use**: Decoupling UI from gameplay, achievement tracking, audio triggers, analytics events.
Any case where the sender should not know who is listening.

**When to avoid**: Performance-critical inner loops (virtual dispatch per listener per frame adds up).
Avoid deeply chained events that trigger other events, creating hard-to-debug cascades. Always provide
a way to unsubscribe to prevent dangling references.

---

### Command Pattern

Encapsulates a request as an object, enabling parameterization, queueing, undo/redo, and replay.

```
class Command:
    execute(actor): pass
    undo(actor): pass

class MoveCommand extends Command:
    direction = Vector3.ZERO
    previous_position = null

    execute(actor):
        previous_position = actor.position
        actor.position += direction

    undo(actor):
        actor.position = previous_position

# Input handler produces commands
func handle_input():
    if pressed("move_right"):
        return MoveCommand(Vector3.RIGHT)
    return null

# History stack for undo/redo
history = []
redo_stack = []

func execute_command(cmd, actor):
    cmd.execute(actor)
    history.push(cmd)
    redo_stack.clear()

func undo():
    cmd = history.pop()
    cmd.undo(actor)
    redo_stack.push(cmd)

func redo():
    cmd = redo_stack.pop()
    cmd.execute(actor)
    history.push(cmd)
```

**When to use**: Input remapping (bind keys to command objects, not functions directly), undo/redo in
level editors or strategy games, replay systems (record command stream per frame instead of full state),
networked games (serialize commands and send to server for authoritative execution), AI (AI produces
the same command objects a player would).

**When to avoid**: Simple fire-and-forget actions where undo is meaningless and the overhead of object
allocation is unnecessary.

---

### State Pattern / Finite State Machine

Allows an object to alter its behavior when its internal state changes.

```
class State:
    enter(entity): pass
    update(entity, delta): pass
    exit(entity): pass
    handle_input(entity, event): pass

class IdleState extends State:
    handle_input(entity, event):
        if event == "jump":
            return JumpState()
        if event == "move":
            return RunState()
        return null

class JumpState extends State:
    enter(entity):
        entity.velocity.y = JUMP_FORCE

    update(entity, delta):
        if entity.is_on_floor():
            return IdleState()
        return null

# State machine driver
class StateMachine:
    current_state = null

    transition(entity, new_state):
        if current_state: current_state.exit(entity)
        current_state = new_state
        current_state.enter(entity)

    update(entity, delta):
        next = current_state.update(entity, delta)
        if next: transition(entity, next)
```

**When to use**: Player character controllers, NPC behavior, UI screen management, game phase
management (menu, playing, paused, game over), animation state machines.

**When to avoid**: When the number of states and transitions grows beyond ~15-20 states -- at that
point, consider Hierarchical State Machines or Behavior Trees.

---

### Strategy Pattern

Defines a family of algorithms, encapsulates each one, and makes them interchangeable at runtime.

```
class DamageCalculator:
    calculate(attacker, defender): pass

class MeleeDamage extends DamageCalculator:
    calculate(attacker, defender):
        return attacker.strength - defender.armor

class MagicDamage extends DamageCalculator:
    calculate(attacker, defender):
        return attacker.intellect - defender.magic_resist

class RangedDamage extends DamageCalculator:
    calculate(attacker, defender):
        distance = attacker.position.distance_to(defender.position)
        falloff = clamp(1.0 - distance / MAX_RANGE, 0, 1)
        return attacker.dexterity * falloff

# Weapon holds a strategy
class Weapon:
    damage_strategy: DamageCalculator

    attack(wielder, target):
        return damage_strategy.calculate(wielder, target)
```

**When to use**: Swappable AI behaviors, different pathfinding algorithms, damage formulas, loot
generation strategies, difficulty scaling.

**When to avoid**: When there is genuinely only one algorithm and no foreseeable variation. Adding
strategy overhead for a single implementation is over-engineering.

---

### Factory / Abstract Factory

Centralizes object creation, decoupling the caller from the concrete class being instantiated.

```
class EnemyFactory:
    static create(type_name, position):
        match type_name:
            "goblin":  return Goblin(position)
            "dragon":  return Dragon(position)
            "slime":   return Slime(position)
            _:         push_error("Unknown enemy: " + type_name)

# Data-driven factory using a registry
class EntityFactory:
    registry = {}   # string -> callable

    register(type_name, constructor):
        registry[type_name] = constructor

    create(type_name, params):
        return registry[type_name](params)

# Register from data files at startup
factory.register("goblin", GoblinScene.instantiate)
```

**When to use**: Spawning systems, projectile creation, particle effect instantiation, loading
entities from save files or network messages, level generation from data.

**When to avoid**: When instantiation is trivial and there is only one concrete type. Factories add
indirection; only use them when that indirection pays for itself.

---

### Flyweight

Uses sharing to support large numbers of fine-grained objects efficiently by separating intrinsic
(shared) state from extrinsic (per-instance) state.

```
# Intrinsic (shared) data -- one per tree type
class TreeModel:
    mesh: Mesh
    bark_texture: Texture
    leaf_texture: Texture
    # Large data, loaded once

# Extrinsic (per-instance) data -- one per tree in the world
class TreeInstance:
    model: TreeModel      # shared reference
    position: Vector3
    scale: float
    health: int

# 10,000 trees but only 5 TreeModel objects
forest = []
oak_model = TreeModel("oak")
pine_model = TreeModel("pine")
for i in range(5000):
    forest.append(TreeInstance(oak_model, random_pos(), 1.0, 100))
    forest.append(TreeInstance(pine_model, random_pos(), 1.0, 100))
```

**When to use**: Tile maps, particle systems, instanced rendering of vegetation/rocks/debris, bullet
pools, character font rendering. Any scenario with many visually similar objects.

**When to avoid**: When every instance is truly unique with no shared data. The split between
intrinsic and extrinsic data adds complexity; only worthwhile at scale.

---

### Prototype

Creates new objects by cloning an existing instance rather than constructing from scratch.

```
class Monster:
    health: int
    speed: float
    attack: int
    sprite: Texture

    clone():
        copy = Monster()
        copy.health = self.health
        copy.speed = self.speed
        copy.attack = self.attack
        copy.sprite = self.sprite
        return copy

# Prototype registry
prototypes = {
    "goblin": Monster(health=30, speed=5, attack=3, sprite=goblin_tex),
    "orc":    Monster(health=80, speed=3, attack=8, sprite=orc_tex),
}

func spawn(type_name, position):
    entity = prototypes[type_name].clone()
    entity.position = position
    return entity
```

**When to use**: Spawners that create many variations of similar entities, level editors that let
designers place and clone configured objects, networked entity replication from templates.

**When to avoid**: When object construction is simple and cheap, or when the Type Object pattern
(see below) is a better fit for data-driven variation.

---

## Game-Specific Patterns (from "Game Programming Patterns")

### Game Loop

The central heartbeat of every game. Processes input, updates simulation, and renders, all while
maintaining consistent game speed regardless of hardware.

```
func game_loop():
    previous_time = get_time()

    while running:
        current_time = get_time()
        elapsed = current_time - previous_time
        previous_time = current_time

        process_input()

        # Fixed timestep for deterministic physics
        accumulator += elapsed
        while accumulator >= FIXED_STEP:
            update(FIXED_STEP)
            accumulator -= FIXED_STEP

        # Variable timestep rendering with interpolation
        alpha = accumulator / FIXED_STEP
        render(alpha)
```

**When to use**: Every game needs a game loop. The fixed-timestep variant is essential for
deterministic physics and networked games.

**When to avoid**: You do not avoid this pattern; you choose the right variant (fixed, variable,
or semi-fixed timestep) for your needs.

---

### Update Method

Each game entity has an `update()` method called once per frame by the game loop, letting entities
simulate independently.

```
class Entity:
    update(delta): pass

class World:
    entities = []

    update(delta):
        for entity in entities:
            entity.update(delta)

class Skeleton extends Entity:
    update(delta):
        patrol()
        check_for_player()

class Fireball extends Entity:
    update(delta):
        position += velocity * delta
        if lifetime <= 0:
            destroy()
```

**When to use**: Any game with multiple independent entities that need per-frame simulation.

**When to avoid**: When entity counts become very large (10,000+) and per-entity virtual dispatch
becomes a bottleneck. At that scale, consider data-oriented approaches (ECS, Data Locality).

---

### Component Pattern

Decomposes a game entity into reusable, composable components instead of a deep inheritance tree.

```
class Entity:
    components = {}

    add(component):
        components[component.type] = component
        component.owner = self

    get(type):
        return components[type]

    update(delta):
        for comp in components.values():
            comp.update(delta)

class TransformComponent:
    position = Vector3.ZERO
    rotation = Quaternion.IDENTITY

class PhysicsComponent:
    velocity = Vector3.ZERO
    update(delta):
        owner.get(Transform).position += velocity * delta

class RenderComponent:
    mesh: Mesh
    update(delta):
        draw(mesh, owner.get(Transform).position)

# Compose entities from components
player = Entity()
player.add(TransformComponent())
player.add(PhysicsComponent())
player.add(RenderComponent(player_mesh))
player.add(InputComponent())
```

**When to use**: When entities share behavior in overlapping ways that do not fit a single
inheritance hierarchy. Central to most modern engines (Godot nodes, Unity MonoBehaviours, Unreal
ActorComponents).

**When to avoid**: Very simple games with few entity types where a flat class per entity is clearer.

---

### Type Object

Avoids a proliferation of subclasses by moving type-specific data into a separate data object
that instances reference.

```
class Breed:
    name: String
    max_health: int
    attack_power: int
    loot_table: Array

class Monster:
    breed: Breed
    current_health: int

    init(breed):
        self.breed = breed
        self.current_health = breed.max_health

    attack():
        return breed.attack_power

# Define breeds in data files, not code
goblin_breed  = Breed("Goblin",  30, 3, ["gold_coin", "dagger"])
dragon_breed  = Breed("Dragon", 500, 40, ["dragon_scale", "gold_pile"])

# Spawn without subclassing
monster = Monster(goblin_breed)
```

**When to use**: RPG enemy types, item types, spell types, building types -- anywhere designers
need to define new "types" without programmer intervention. Pairs naturally with JSON/YAML data
files.

**When to avoid**: When types need truly unique behavior, not just unique data. In that case,
combine with Strategy pattern or Bytecode.

---

### Subclass Sandbox

A base class provides a protected set of operations. Subclasses implement behavior by combining
those operations, sandboxed from the rest of the engine.

```
class Superpower:
    # Protected toolkit -- these are the ONLY operations subclasses use
    _play_sound(sound): audio.play(sound)
    _spawn_particles(type, pos): particles.emit(type, pos)
    _deal_damage(target, amount): target.take_damage(amount)

    # Abstract -- subclasses implement this
    activate(caster): pass

class FireballPower extends Superpower:
    activate(caster):
        _play_sound("fireball_cast")
        _spawn_particles("fire", caster.position + caster.forward * 2)
        _deal_damage(caster.target, 25)

class IceBlastPower extends Superpower:
    activate(caster):
        _play_sound("ice_blast")
        _spawn_particles("ice", caster.target.position)
        _deal_damage(caster.target, 15)
        caster.target.apply_slow(0.5, 3.0)
```

**When to use**: Spells, abilities, power-ups -- any system where many behaviors combine a small
set of engine operations. Keeps subclasses decoupled from engine internals.

**When to avoid**: When the "toolkit" would need to be enormous, or when data-driven approaches
(Bytecode, Type Object) offer more flexibility.

---

### Service Locator

Provides global access to a service without coupling to the concrete implementation.

```
class ServiceLocator:
    services = {}

    static provide(name, implementation):
        services[name] = implementation

    static get(name):
        return services[name]

# At startup
ServiceLocator.provide("audio", OpenALAudioService())
ServiceLocator.provide("physics", BulletPhysicsService())

# Anywhere in the codebase
ServiceLocator.get("audio").play("explosion")

# For testing
ServiceLocator.provide("audio", NullAudioService())  # silent during tests
```

**When to use**: When you need global access to an engine service but want to swap implementations
(real vs null vs mock), support multiple backends, or defer initialization. Better than Singleton
because it decouples the consumer from the concrete class.

**When to avoid**: Overuse creates the same problems as singletons -- hidden dependencies and
unclear initialization order. Prefer passing dependencies explicitly when practical.

---

### Event Queue / Message Bus

Decouples event senders from receivers in time, not just in identity. Events are enqueued and
processed later, preventing cascading call stacks.

```
class EventQueue:
    queue = []

    push(event):
        queue.append(event)

    process():
        # Swap to avoid infinite loops from handlers pushing new events
        current = queue
        queue = []
        for event in current:
            dispatch(event)

    dispatch(event):
        for listener in listeners[event.type]:
            listener.handle(event)

# Producer (gameplay code)
EventQueue.push(DamageEvent(target=enemy, amount=25, source=player))

# Consumer (processed at a safe point in the frame)
# In game loop:
func update(delta):
    simulate(delta)
    event_queue.process()  # events handled after simulation is stable
```

**When to use**: Audio system (queue sounds, deduplicate, prioritize), network message handling,
deferred UI updates, cross-system communication without direct coupling. Essential for avoiding
re-entrant bugs in complex systems.

**When to avoid**: When immediate response is required and the latency of deferred processing is
unacceptable (rare in practice -- most systems tolerate one-frame delay).

---

### Double Buffer

Maintains two copies of state so readers see a complete, consistent snapshot while writers modify
the other copy. After the write phase, the buffers swap.

```
class Scene:
    buffer_a = FrameBuffer()
    buffer_b = FrameBuffer()
    current = buffer_a
    next = buffer_b

    render():
        next.clear()
        draw_world(next)
        draw_ui(next)

        # Atomic swap
        temp = current
        current = next
        next = temp

        display(current)
```

**When to use**: Rendering (prevents tearing), AI systems where agents read each other's state
(read from current buffer, write to next, swap after all agents update), physics double-buffering
of transforms.

**When to avoid**: When the data being buffered is very large and the memory cost of two copies is
prohibitive. When single-threaded sequential processing makes tearing impossible.

---

### Dirty Flag

Avoids expensive recomputation by tracking whether derived data is out of date.

```
class SceneNode:
    local_transform: Matrix
    world_transform: Matrix
    is_dirty: bool = true
    parent: SceneNode = null
    children: Array = []

    set_position(pos):
        local_transform.origin = pos
        mark_dirty()

    mark_dirty():
        if not is_dirty:
            is_dirty = true
            for child in children:
                child.mark_dirty()

    get_world_transform():
        if is_dirty:
            if parent:
                world_transform = parent.get_world_transform() * local_transform
            else:
                world_transform = local_transform
            is_dirty = false
        return world_transform
```

**When to use**: Scene graph world transforms, navigation mesh recomputation, shadow map
invalidation, UI layout, any derived data that is expensive to compute and read more often than
it changes.

**When to avoid**: When the derived data changes every frame anyway (the flag adds overhead with
no benefit). When the propagation of dirty flags through a hierarchy is itself expensive.

---

### Object Pool

Pre-allocates a fixed set of reusable objects to avoid runtime allocation and GC pressure.

```
class BulletPool:
    pool = []
    active_count = 0

    init(size):
        for i in range(size):
            pool.append(Bullet())

    acquire():
        if active_count >= pool.size():
            return null  # pool exhausted
        bullet = pool[active_count]
        active_count += 1
        bullet.activate()
        return bullet

    release(bullet):
        # Swap with last active to keep pool partitioned
        index = bullet.pool_index
        active_count -= 1
        pool[index] = pool[active_count]
        pool[active_count] = bullet
        pool[index].pool_index = index
        bullet.pool_index = active_count
        bullet.deactivate()
```

**When to use**: Bullets, particles, audio sources, network messages, any object created and
destroyed frequently during gameplay. Essential on platforms with expensive allocation or GC pauses.

**When to avoid**: Objects with widely varying lifetimes (long-lived objects clog the pool). When
the maximum count is unpredictable and a fixed pool would either waste memory or be too small.

---

### Spatial Partition

Organizes objects by position in a spatial data structure for efficient proximity queries.

```
# Simple grid partition
class SpatialGrid:
    cell_size: float
    cells = {}   # (ix, iy) -> list of entities

    insert(entity):
        key = _cell_key(entity.position)
        cells[key].append(entity)

    remove(entity):
        key = _cell_key(entity.position)
        cells[key].remove(entity)

    query_radius(center, radius):
        results = []
        min_cell = _cell_key(center - Vector2(radius, radius))
        max_cell = _cell_key(center + Vector2(radius, radius))
        for ix in range(min_cell.x, max_cell.x + 1):
            for iy in range(min_cell.y, max_cell.y + 1):
                for entity in cells[(ix, iy)]:
                    if center.distance_to(entity.position) <= radius:
                        results.append(entity)
        return results

    _cell_key(pos):
        return (floor(pos.x / cell_size), floor(pos.y / cell_size))
```

**Common structures**: Grid (uniform density), Quadtree/Octree (adaptive), k-d tree (static
scenes), BVH (dynamic scenes), spatial hashing (large open worlds).

**When to use**: Collision broad phase, nearest-neighbor queries, area-of-interest for networking,
AI perception, rendering culling.

**When to avoid**: Fewer than ~50 entities, where brute-force O(n^2) checks are faster than the
overhead of maintaining the structure.

---

### Data Locality

Arranges data in memory to exploit CPU cache lines, dramatically improving iteration performance.

```
# Bad: array of pointers to heap-allocated objects (cache-hostile)
entities = [new Entity(), new Entity(), ...]  # scattered in memory

# Good: flat arrays of components (cache-friendly)
class ComponentArrays:
    positions  = Array[Vector3](MAX_ENTITIES)   # contiguous
    velocities = Array[Vector3](MAX_ENTITIES)   # contiguous
    healths    = Array[int](MAX_ENTITIES)        # contiguous
    count      = 0

func update_physics(delta):
    # Iterates contiguous memory -- CPU prefetcher loves this
    for i in range(components.count):
        components.positions[i] += components.velocities[i] * delta
```

**When to use**: Any system iterating over thousands of entities per frame -- physics, particle
updates, AI ticks, animation. The ECS pattern is essentially Data Locality applied at the
architectural level.

**When to avoid**: Low-count systems where cache behavior is irrelevant. Code that is dominated
by I/O or GPU time rather than CPU iteration.

---

### Bytecode (Scripting / Modding)

Encodes behavior as data (instructions for a virtual machine), enabling runtime-defined logic
without recompilation.

```
# Define opcodes
OPCODE_LITERAL = 0x01
OPCODE_GET_HP  = 0x02
OPCODE_ADD     = 0x03
OPCODE_GT      = 0x04
OPCODE_JUMP_IF = 0x05
OPCODE_HEAL    = 0x06

# A "spell script" compiled to bytecode
# if (caster.hp > 50) then heal(caster, 20)
bytecode = [
    OPCODE_GET_HP,             # push caster.hp
    OPCODE_LITERAL, 50,        # push 50
    OPCODE_GT,                 # push (hp > 50)
    OPCODE_JUMP_IF, 7,         # if false, jump to end
    OPCODE_LITERAL, 20,        # push 20
    OPCODE_HEAL,               # heal(caster, top_of_stack)
]

class VM:
    stack = []

    execute(bytecode, context):
        ip = 0
        while ip < len(bytecode):
            op = bytecode[ip]
            match op:
                OPCODE_LITERAL:
                    stack.push(bytecode[ip + 1])
                    ip += 2
                OPCODE_GET_HP:
                    stack.push(context.caster.hp)
                    ip += 1
                OPCODE_ADD:
                    b, a = stack.pop(), stack.pop()
                    stack.push(a + b)
                    ip += 1
                # ... etc
```

**When to use**: Mod support, designer-authored abilities/quests, sandboxed user-generated content
where you need to control execution time and memory.

**When to avoid**: When an existing scripting language (Lua, GDScript) already meets your needs.
Building a VM is significant engineering effort.

---

## Architectural Patterns

### Entity-Component-System (ECS)

Separates identity (Entity), data (Component), and logic (System). Entities are lightweight IDs.
Components are plain data structs. Systems iterate over components.

```
# Entity is just an ID
entity_id = world.create_entity()

# Components are pure data
struct Position: x: float, y: float
struct Velocity: dx: float, dy: float
struct Health:   current: int, max: int

# Attach components
world.add_component(entity_id, Position(0, 0))
world.add_component(entity_id, Velocity(1, 0))

# Systems contain logic and operate on component queries
class MovementSystem:
    query = [Position, Velocity]

    update(delta):
        for entity in world.query(Position, Velocity):
            pos = world.get(entity, Position)
            vel = world.get(entity, Velocity)
            pos.x += vel.dx * delta
            pos.y += vel.dy * delta
```

**When to use**: Large entity counts (1000+), performance-critical simulation, games needing
extreme composition flexibility. See dedicated ECS resource for deeper coverage.

**When to avoid**: Small games, rapid prototyping where OOP is faster to iterate, or when your
engine does not provide ECS infrastructure.

---

### Model-View-Controller (MVC) in Games

Separates game state (Model), presentation (View), and input/logic (Controller).

```
# Model -- pure game state, no rendering knowledge
class GameModel:
    player_health: int = 100
    score: int = 0
    enemies: Array = []

# View -- reads model, produces visuals
class GameView:
    update(model):
        health_bar.value = model.player_health
        score_label.text = str(model.score)

# Controller -- processes input, mutates model
class GameController:
    model: GameModel
    view: GameView

    handle_input(event):
        if event == "attack":
            model.enemies[0].health -= 10
            model.score += 5

    update(delta):
        view.update(model)
```

**When to use**: UI-heavy games, turn-based games, separating networking (model replication) from
rendering.

**When to avoid**: Action games where the separation feels forced. Most game engines blur MVC
boundaries by design.

---

### Blackboard Pattern (AI)

A shared data store that multiple AI systems read from and write to, enabling decoupled coordination.

```
class Blackboard:
    data = {}

    write(key, value, source):
        data[key] = { value: value, source: source, timestamp: now() }

    read(key):
        return data[key].value if key in data else null

    has(key):
        return key in data

# Perception system writes to blackboard
class PerceptionSystem:
    update(blackboard, npc):
        enemies = detect_enemies(npc)
        blackboard.write("nearest_enemy", enemies[0], "perception")
        blackboard.write("enemy_count", len(enemies), "perception")

# Decision system reads from blackboard
class DecisionSystem:
    update(blackboard, npc):
        if blackboard.read("enemy_count") > 3:
            npc.set_behavior("flee")
        elif blackboard.has("nearest_enemy"):
            npc.set_behavior("attack")
```

**When to use**: Squad AI coordination, complex NPC decision-making with multiple perception
sources, boss AI with multiple phases reading shared state.

**When to avoid**: Simple AI that does not need shared state between subsystems.

---

### Pub/Sub and Message Passing

Generalizes Observer into a system where publishers and subscribers are fully decoupled via a
message broker, often with topic-based filtering.

```
class MessageBroker:
    subscribers = {}  # topic -> list of handlers

    subscribe(topic, handler):
        subscribers[topic].append(handler)

    publish(topic, message):
        for handler in subscribers.get(topic, []):
            handler(message)

# Systems subscribe to topics
broker.subscribe("combat/damage", damage_numbers_ui.on_damage)
broker.subscribe("combat/damage", sound_manager.on_damage)
broker.subscribe("combat/kill", achievement_tracker.on_kill)

# Gameplay publishes
broker.publish("combat/damage", { target: enemy, amount: 25 })
```

**When to use**: Cross-system communication in large codebases, plugin/mod architectures,
networked event distribution.

**When to avoid**: When direct function calls are clearer and the systems are few.

---

### CQRS (Command Query Responsibility Segregation)

Separates read operations (queries) from write operations (commands) into distinct models,
enabling independent optimization of each path.

```
# Write model -- processes commands, emits events
class GameCommandHandler:
    handle_attack(cmd):
        target = entity_store.get(cmd.target_id)
        damage = calculate_damage(cmd.attacker_id, target)
        target.health -= damage
        event_store.append(DamageEvent(target.id, damage, now()))

# Read model -- optimized for queries, built from events
class LeaderboardReadModel:
    scores = {}

    on_event(event):
        if event is KillEvent:
            scores[event.killer_id] += event.points

    get_top_players(n):
        return sorted(scores, reverse=True)[:n]
```

**When to use**: Game servers with heavy read traffic (leaderboards, world state queries) alongside
write traffic (player actions). Scales reads and writes independently.

**When to avoid**: Simple single-player games where the overhead of two models is not justified.

---

### Event Sourcing

Stores all state changes as an immutable, append-only sequence of events. Current state is derived
by replaying the event log.

```
class EventStore:
    events = []  # append-only

    append(event):
        events.append(event)

    replay(from_index=0):
        state = initial_state()
        for event in events[from_index:]:
            state = apply(state, event)
        return state

# Events
PlayerMoved(player_id=1, position=Vector3(10,0,5), timestamp=1234)
BlockPlaced(player_id=2, block_type="stone", position=Vector3(3,4,5), timestamp=1235)
DamageDealt(source=1, target=2, amount=15, timestamp=1236)

# Replay for audit or debugging
state_at_time_1235 = event_store.replay_until(1235)
```

**When to use**: Audit logs (who did what, when), grief rollback in multiplayer, replay systems,
debugging (reproduce exact game state), server crash recovery.

**When to avoid**: When storage of every event is prohibitively expensive, or when state is so
large that replaying from scratch is too slow (use periodic snapshots to mitigate).

---

## State Management Patterns

### Hierarchical State Machines (HSM)

Nests states within parent states. A child state inherits transitions from its parent, reducing
duplication.

```
# States form a tree:
# Alive
#   |- OnGround
#   |    |- Idle
#   |    |- Running
#   |    |- Attacking
#   |- InAir
#        |- Jumping
#        |- Falling
# Dead

class HierarchicalState:
    parent: HierarchicalState = null
    children = {}

    handle_input(entity, event):
        # Try self first, then delegate to parent
        result = _handle(entity, event)
        if result: return result
        if parent: return parent.handle_input(entity, event)
        return null

# "Alive" state handles "take_damage" for ALL children
# Individual children only handle their specific transitions
```

**When to use**: Character controllers with many states sharing common transitions (e.g.,
any "Alive" sub-state can transition to "Dead" on fatal damage).

**When to avoid**: When the hierarchy adds complexity without reducing duplication.

---

### Pushdown Automata

Combines a state machine with a stack. New states are pushed on, and when they complete, the
previous state resumes.

```
class PushdownFSM:
    stack = []

    push(state, entity):
        if stack.size() > 0:
            stack.top().pause(entity)
        stack.push(state)
        state.enter(entity)

    pop(entity):
        old = stack.pop()
        old.exit(entity)
        if stack.size() > 0:
            stack.top().resume(entity)

    update(entity, delta):
        stack.top().update(entity, delta)

# Example: player opens inventory during combat
# Stack: [CombatState, InventoryState]
# Close inventory -> pop -> resume CombatState exactly where it left off
```

**When to use**: Pause menus, dialog overlays, nested UI screens, any state that should
"return" to the previous state upon completion.

**When to avoid**: When states do not logically nest or when the stack can grow unbounded.

---

### Behavior Trees

Hierarchical tree of nodes that model AI decision-making. Nodes are Composites (Sequence,
Selector), Decorators (Inverter, Repeater), and Leaves (actions, conditions).

```
# Tree structure (pseudocode):
# Selector (try children until one succeeds)
#   |- Sequence "Flee"
#   |    |- Condition: health < 20%
#   |    |- Action: run_to_safety()
#   |- Sequence "Attack"
#   |    |- Condition: enemy_visible
#   |    |- Action: move_to_enemy()
#   |    |- Action: attack()
#   |- Action: patrol()

class BTNode:
    tick(blackboard) -> Status:  # SUCCESS, FAILURE, RUNNING
        pass

class Selector extends BTNode:
    children = []
    tick(blackboard):
        for child in children:
            status = child.tick(blackboard)
            if status != FAILURE:
                return status
        return FAILURE

class Sequence extends BTNode:
    children = []
    tick(blackboard):
        for child in children:
            status = child.tick(blackboard)
            if status != SUCCESS:
                return status
        return SUCCESS
```

**When to use**: NPC AI with complex decision logic, boss fight patterns, RTS unit behavior.
See dedicated AI resource for deeper coverage.

**When to avoid**: Very simple AI (a basic FSM is sufficient) or when designers cannot easily
visualize/edit the tree.

---

### GOAP (Goal-Oriented Action Planning)

AI selects actions by searching for a plan that satisfies a goal, given a set of available actions
with preconditions and effects.

```
class Action:
    name: String
    preconditions: Dictionary   # world state requirements
    effects: Dictionary         # world state changes
    cost: float

class GOAPPlanner:
    find_plan(current_state, goal, available_actions):
        # Backward-chaining search from goal to current state
        open = [PlanNode(goal, [], 0)]
        while open.size() > 0:
            node = open.pop_lowest_cost()
            if satisfies(current_state, node.requirements):
                return node.actions
            for action in available_actions:
                if action_contributes(action, node.requirements):
                    new_node = PlanNode(
                        requirements = merge(node.requirements, action.preconditions) - action.effects,
                        actions = [action] + node.actions,
                        cost = node.cost + action.cost
                    )
                    open.push(new_node)
        return null  # no plan found

# Example actions
actions = [
    Action("chop_tree",   pre={"has_axe": true},          eff={"has_wood": true},   cost=2),
    Action("get_axe",     pre={"at_shed": true},           eff={"has_axe": true},    cost=1),
    Action("go_to_shed",  pre={},                          eff={"at_shed": true},     cost=1),
    Action("build_house", pre={"has_wood": true},          eff={"has_shelter": true}, cost=5),
]
# Goal: {"has_shelter": true}
# Planner finds: go_to_shed -> get_axe -> chop_tree -> build_house
```

**When to use**: Complex AI with many interacting actions, emergent NPC behavior, simulation games.

**When to avoid**: Simple AI, performance-constrained scenarios (planning search can be expensive),
when deterministic scripted behavior is preferred.

---

## Resource Management Patterns

### Asset Loading / Streaming

Loads assets asynchronously in the background so the game never hitches on I/O.

```
class AssetManager:
    cache = {}         # path -> asset
    loading = {}       # path -> Future
    ref_counts = {}    # path -> int

    load_async(path) -> Future:
        if path in cache:
            ref_counts[path] += 1
            return Future.resolved(cache[path])
        if path in loading:
            ref_counts[path] += 1
            return loading[path]

        future = background_thread.submit(load_from_disk, path)
        loading[path] = future
        ref_counts[path] = 1
        future.on_complete(func(asset):
            cache[path] = asset
            loading.erase(path)
        )
        return future

    release(path):
        ref_counts[path] -= 1
        if ref_counts[path] <= 0:
            cache.erase(path)
            ref_counts.erase(path)
```

**When to use**: Open-world streaming, level transitions, large asset sets that cannot all fit in
memory.

**When to avoid**: Small games where all assets load at startup within an acceptable time.

---

### Handle-Based Systems

Indirects resource access through lightweight handles rather than raw pointers, enabling
relocation, streaming, and hot-reloading without invalidating references.

```
class Handle:
    index: int
    generation: int  # detects use-after-free

class HandleManager:
    entries = []     # array of { resource, generation, active }

    acquire(resource) -> Handle:
        # Find free slot or grow
        slot = find_free_slot()
        entries[slot].resource = resource
        entries[slot].generation += 1
        entries[slot].active = true
        return Handle(slot, entries[slot].generation)

    get(handle) -> Resource:
        entry = entries[handle.index]
        assert(entry.generation == handle.generation, "Stale handle")
        return entry.resource

    release(handle):
        entries[handle.index].active = false
```

**When to use**: Any system where resources may be reloaded, relocated, or invalidated (textures,
meshes, audio clips, entity references). Prevents dangling pointer bugs.

**When to avoid**: Trivial systems where direct references are safe and the indirection overhead
is unnecessary.

---

### Hot Reloading

Detects file changes at runtime and reloads assets or scripts without restarting the game.

```
class HotReloader:
    watched = {}   # path -> last_modified_time

    watch(path, on_reload_callback):
        watched[path] = { mtime: file_mtime(path), callback: on_reload_callback }

    poll():
        for path, info in watched:
            current_mtime = file_mtime(path)
            if current_mtime > info.mtime:
                info.mtime = current_mtime
                new_asset = reload_from_disk(path)
                info.callback(new_asset)
```

**When to use**: Development workflows -- designers tweaking shaders, balance data, UI layouts
without restarting the game. Requires handle-based resources so references remain valid after reload.

**When to avoid**: Shipping builds (disable the file watcher). Stateful scripts where reloading
mid-execution would corrupt game state.

---

## Concurrency Patterns for Games

### Job / Task Systems

Breaks work into small, self-contained jobs dispatched to a pool of worker threads.

```
class Job:
    dependencies: Array[Job] = []
    execute(): pass

class JobScheduler:
    workers: Array[Thread]
    queue: ThreadSafeQueue

    schedule(job):
        if all_dependencies_complete(job):
            queue.push(job)
        else:
            defer_until_dependencies_complete(job)

    worker_loop():
        while running:
            job = queue.pop_blocking()
            job.execute()
            notify_dependents(job)

# Usage
physics_job = Job(func: update_physics)
render_job  = Job(func: prepare_render_data, dependencies=[physics_job])
scheduler.schedule(physics_job)
scheduler.schedule(render_job)  # waits for physics_job automatically
```

**When to use**: Physics updates, pathfinding, procedural generation, particle simulation -- any
CPU-bound work that can be parallelized.

**When to avoid**: Work that is inherently sequential or has so many dependencies that
parallelization yields no benefit.

---

### Thread-Safe Patterns

Common strategies for safe shared-state access in multithreaded game code.

```
# 1. Immutable shared data (zero contention)
class SharedConfig:
    # Loaded once, never modified, safe to read from any thread
    gravity: float = 9.8
    max_speed: float = 15.0

# 2. Per-thread data (no sharing needed)
class PerThreadAllocator:
    # Each worker has its own allocator -- no locks needed
    thread_local buffer = MemoryPool(1_MB)

# 3. Lock-free queue (atomic CAS operations)
class LockFreeQueue:
    head: AtomicPointer
    tail: AtomicPointer

    push(item):
        node = new Node(item)
        while true:
            old_tail = tail.load()
            if tail.compare_and_swap(old_tail, node):
                old_tail.next = node
                break

# 4. Double-buffer swap (write to back buffer, atomic pointer swap)
# See Double Buffer pattern above
```

**When to use**: Any multithreaded game system. Prefer (1) and (2) over (3) and (4) -- the best
lock is no lock at all.

**When to avoid**: Do not add threading to systems that are not bottlenecks. Concurrency bugs are
among the hardest to diagnose.

---

### Fiber / Coroutine-Based Concurrency

Cooperative multitasking where functions yield execution voluntarily, enabling complex multi-frame
logic without callback spaghetti.

```
# Coroutine-based AI behavior
func guard_patrol():
    while true:
        walk_to(patrol_point_a)
        yield wait_until_arrived()
        look_around()
        yield wait_seconds(2.0)
        walk_to(patrol_point_b)
        yield wait_until_arrived()
        look_around()
        yield wait_seconds(2.0)

# Coroutine scheduler (runs on main thread)
class CoroutineScheduler:
    active = []

    start(coroutine):
        active.append(coroutine)

    update(delta):
        for co in active:
            if co.is_waiting() and not co.wait_condition_met(delta):
                continue
            co.resume()
            if co.is_finished():
                active.remove(co)
```

**When to use**: Multi-frame AI scripts, cutscene sequencing, tutorial flows, tween chains,
any logic that spans many frames and reads more naturally as sequential code.

**When to avoid**: Performance-critical inner loops (coroutine overhead per yield). Deep coroutine
stacks that make debugging difficult.

---

## Anti-Patterns in Game Development

### God Objects

**Symptom**: A single class (GameManager, Player, World) accumulates hundreds of methods and
references to nearly every other system.

**Why it happens**: Quick iteration during prototyping -- it is easy to add one more method to
the class that already has everything.

**Fix**: Decompose into components or services. A Player does not need to know about audio, UI,
networking, and persistence. Split into PlayerMovement, PlayerCombat, PlayerInventory, etc.

---

### Deep Inheritance Hierarchies

**Symptom**: Entity -> Character -> NPC -> Enemy -> FlyingEnemy -> DragonEnemy -> ElderDragonEnemy.
Adding a "FlyingAlly" requires duplicating the flying code or contorting the hierarchy.

**Why it happens**: OOP textbooks teach inheritance as the primary reuse mechanism.

**Fix**: Prefer composition. Use Component pattern, Strategy pattern, or mixins. Keep inheritance
to at most 2-3 levels.

---

### Premature Optimization vs Actual Bottlenecks

**Symptom**: Hand-rolled memory allocators, SIMD intrinsics, and bit-packing in code that runs
once per frame for 10 entities.

**Why it happens**: Developers optimize what they think is slow without profiling.

**Fix**: Profile first. Optimize the actual hotspots (which are almost always rendering, physics
broad-phase, or memory allocation patterns -- not gameplay logic). A clear, maintainable codebase
is easier to optimize later when real bottlenecks are identified.

---

### Spaghetti Event Systems

**Symptom**: Events trigger events that trigger events. Debugging requires tracing through dozens
of unrelated handlers. A single player action causes 47 callbacks to fire in unpredictable order.

**Why it happens**: Observer/Pub-Sub makes it easy to add "just one more listener" without seeing
the full picture.

**Fix**: Limit event chain depth (events should not emit other events synchronously). Use an
Event Queue to defer processing. Establish a clear event taxonomy with documented contracts.
Audit listener counts periodically.

---

## Quick Reference: Pattern Selection Guide

| Problem Domain              | Recommended Patterns                               |
|-----------------------------|-----------------------------------------------------|
| Input handling              | Command, Observer                                   |
| Character behavior          | State (FSM), HSM, Pushdown Automata                 |
| NPC AI                      | Behavior Trees, Blackboard, GOAP                    |
| Entity architecture         | Component, ECS, Type Object                         |
| Object creation             | Factory, Prototype, Object Pool                     |
| Cross-system communication  | Event Queue, Pub/Sub, Message Bus                   |
| Global services             | Service Locator (prefer over Singleton)              |
| Performance optimization    | Data Locality, Spatial Partition, Object Pool        |
| Resource management         | Handle-based, Reference Counting, Async Loading      |
| Replay / Audit              | Command, Event Sourcing                              |
| Multiplayer server          | CQRS, Event Sourcing, Double Buffer                  |
| Concurrency                 | Job System, Coroutines, Lock-free Queues             |
| Modding / Scripting         | Bytecode, Subclass Sandbox                           |
| Ability / Spell systems     | Subclass Sandbox, Strategy, Type Object              |

---

## Citations

- Nystrom, Robert. *Game Programming Patterns*. https://gameprogrammingpatterns.com/
- Nystrom, Robert. Table of Contents. https://gameprogrammingpatterns.com/contents.html
- Nystrom, Robert. Command Pattern. https://gameprogrammingpatterns.com/command.html
- Nystrom, Robert. Service Locator. https://gameprogrammingpatterns.com/service-locator.html
- Nystrom, Robert. Object Pool. https://gameprogrammingpatterns.com/object-pool.html
- Nystrom, Robert. Spatial Partition. https://gameprogrammingpatterns.com/spatial-partition.html
- Nystrom, Robert. Data Locality. https://gameprogrammingpatterns.com/data-locality.html
- Nystrom, Robert. Double Buffer. https://gameprogrammingpatterns.com/double-buffer.html
- Nystrom, Robert. Subclass Sandbox. https://gameprogrammingpatterns.com/subclass-sandbox.html
- Nystrom, Robert. Type Object. https://gameprogrammingpatterns.com/type-object.html
- Nystrom, Robert. Component Pattern. https://gameprogrammingpatterns.com/component.html
- Gamma, Helm, Johnson, Vlissides. *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley, 1994.
- SanderMertens. ECS FAQ. https://github.com/SanderMertens/ecs-faq
- UMLBoard. Entity-Component-System Design Pattern. https://www.umlboard.com/design-patterns/entity-component-system.html
- PRDeving. Deep Diving into ECS Architecture. https://prdeving.wordpress.com/2023/12/14/deep-diving-into-entity-component-system-ecs-architecture-and-data-oriented-programming/
- Young, Tyler A. Notes on Game Programming Patterns. https://tylerayoung.com/2017/01/23/notes-on-game-programming-patterns-by-robert-nystrom/
- Aversa, Davide. Choosing between Behavior Tree and GOAP. https://www.davideaversa.it/blog/choosing-behavior-tree-goap-planning/
- Tono Game Consultants. AI Blackboard Architecture. https://tonogameconsultants.com/ai-blackboard/
- Tono Game Consultants. Game AI Planning: GOAP, Utility, and Behavior Trees. https://tonogameconsultants.com/game-ai-planning/
- GDQuest. Blackboard Pattern Glossary. https://school.gdquest.com/glossary/ai_blackboard
- PulseGeek. Multithreaded Job Systems in Game Engines. https://pulsegeek.com/articles/multithreaded-job-systems-in-game-engines/
- Graphite Master. Fibers, Oh My! https://graphitemaster.github.io/fibers/
- Microsoft Learn. CQRS Pattern. https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs
- Microsoft Learn. Event Sourcing Pattern. https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing
- Wayline. The God Class Intervention. https://www.wayline.io/blog/god-class-intervention-avoiding-anti-pattern
- AbstractExpr. Better than Singletons: The Service Locator Pattern. https://abstractexpr.com/2023/04/25/better-than-singletons-the-service-locator-pattern/
- Habrador. Game Programming Patterns in Unity. https://www.habrador.com/tutorials/programming-patterns/
- Coppes, Ariel. Design Decisions When Building Games Using ECS. https://arielcoppes.dev/2023/07/13/design-decisions-when-building-games-using-ecs.html
