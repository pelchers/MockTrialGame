# Game AI & Pathfinding Reference

> Comprehensive resource covering decision-making architectures, pathfinding algorithms,
> navigation systems, steering behaviors, perception, group tactics, and machine learning
> for game development. Oriented toward Chat Attack's multiplayer voxel factions context.

---

## 1. AI Architecture Overview

### 1.1 Decision-Making Layers

Game AI is typically organized into three decision-making layers, each operating at a
different level of abstraction and update frequency:

| Layer | Responsibility | Update Rate | Example |
|---|---|---|---|
| **Strategic** | Long-term goals, resource allocation, faction-level plans | Seconds to minutes | "Expand territory to the north" |
| **Tactical** | Mid-level positioning, squad coordination, engagement rules | 0.5 -- 2 seconds | "Flank the enemy base from the east" |
| **Reactive** | Immediate responses, dodging, target switching | Every frame or tick | "Dodge incoming projectile" |

Separating layers prevents expensive strategic re-evaluation from blocking frame-critical
reactive responses. Each layer writes intent to a shared data store (blackboard or
context object) that lower layers consume.

### 1.2 AI Update Frequency and Budgeting

Running every AI agent every frame is prohibitively expensive. Standard techniques:

- **Time-slicing**: Spread agent updates across multiple frames. If 200 agents each need
  a tactical update, process 20 per frame over 10 frames.
- **LOD (Level of Detail) AI**: Agents far from the player or outside the area of interest
  use cheaper decision models (simplified FSM instead of full behavior tree).
- **Budget caps**: Allocate a fixed millisecond budget per frame for AI. A priority queue
  determines which agents get updated first (e.g., agents in combat > idle agents).
- **Event-driven wakeup**: Idle agents sleep until an event (damage taken, player spotted)
  triggers re-evaluation instead of polling every tick.

### 1.3 AI Manager Patterns

A centralized AI Manager (singleton or service) coordinates:

- Agent registration and deregistration
- Time-slice scheduling and budget enforcement
- Shared spatial queries (perception, line of sight batch processing)
- Group coordination requests (squad formation, focus fire)
- Blackboard ownership for global data (faction threat levels, resource counts)

```
# Pseudocode: AI Manager time-slicing
class AIManager:
    var agents: Array[AIAgent] = []
    var current_index: int = 0
    var budget_ms: float = 2.0  # 2ms per frame for AI

    func _process(delta):
        var start = Time.get_ticks_msec()
        while Time.get_ticks_msec() - start < budget_ms:
            if current_index >= agents.size():
                current_index = 0
                break
            agents[current_index].update_ai(delta)
            current_index += 1
```

---

## 2. Finite State Machines (FSM)

### 2.1 Simple FSM Implementation

An FSM defines a set of **states** and **transitions** between them. Only one state is
active at a time. Each state has `enter()`, `update()`, and `exit()` callbacks.

```
# Pseudocode: Simple FSM
class State:
    func enter(): pass
    func update(delta): pass
    func exit(): pass

class FSM:
    var current_state: State
    var states: Dictionary = {}

    func transition_to(state_name: String):
        if current_state:
            current_state.exit()
        current_state = states[state_name]
        current_state.enter()

    func update(delta):
        if current_state:
            current_state.update(delta)

# Example states for a guard NPC
class IdleState extends State:
    func update(delta):
        if can_see_enemy():
            fsm.transition_to("chase")

class ChaseState extends State:
    func enter():
        play_animation("run")
    func update(delta):
        move_toward(target.position)
        if in_attack_range():
            fsm.transition_to("attack")
        elif lost_target():
            fsm.transition_to("idle")
```

### 2.2 Hierarchical FSM (HFSM)

HFSM nests FSMs inside states of a parent FSM, reducing transition explosion. A "Combat"
superstate might contain sub-states like "Approach", "Attack", "Retreat" with their own
internal transitions. Transitions shared by all sub-states (e.g., "player_lost" -> Patrol)
are defined once on the superstate rather than duplicated across every sub-state.

```
# Pseudocode: HFSM structure
CombatSuperState:
    sub_fsm:
        Approach -> Attack (when in_range)
        Attack -> Retreat (when health < 30%)
        Retreat -> Approach (when healed)
    global_transitions:
        -> Patrol (when target_lost)

PatrolSuperState:
    sub_fsm:
        WalkToPoint -> Wait -> WalkToPoint
    global_transitions:
        -> Combat (when enemy_spotted)
```

### 2.3 Limitations and When to Upgrade

| Problem | Description | Solution |
|---|---|---|
| **State explosion** | N states can require up to N x N transitions | Use HFSM to group states |
| **Rigid behavior** | Difficult to represent "best of several options" | Switch to Utility AI |
| **Poor reuse** | States tightly coupled to specific characters | Switch to Behavior Trees |
| **No planning** | Cannot reason about multi-step future actions | Switch to GOAP |

**Rule of thumb**: If an FSM exceeds ~15 states or transitions become difficult to
visualize, consider upgrading to HFSM, Behavior Trees, or Utility AI.

---

## 3. Behavior Trees

### 3.1 Node Types

Behavior Trees (BTs) use a tree of nodes that are "ticked" each update cycle. Each node
returns one of three statuses: `SUCCESS`, `FAILURE`, or `RUNNING`.

#### Composite Nodes (control flow)
- **Sequence**: Executes children left-to-right. Returns `FAILURE` on the first child
  failure. Returns `SUCCESS` only if all children succeed. (Logical AND)
- **Selector (Fallback)**: Executes children left-to-right. Returns `SUCCESS` on the
  first child success. Returns `FAILURE` only if all children fail. (Logical OR)
- **Parallel**: Runs all children simultaneously. Completion policy configurable
  (succeed-on-one, succeed-on-all, etc.).

#### Decorator Nodes (modify single child)
- **Inverter**: Flips `SUCCESS` to `FAILURE` and vice versa.
- **Repeater**: Re-runs child N times or until failure.
- **Succeeder**: Always returns `SUCCESS` regardless of child result.
- **Conditional / Guard**: Gates child execution based on a blackboard value or function.
- **Cooldown**: Prevents child re-execution for a specified duration.
- **Limiter**: Allows child to run only N times total.

#### Leaf Nodes (actions and conditions)
- **Action**: Performs game logic (move, attack, play animation). Returns status.
- **Condition**: Checks a predicate (is_health_low, can_see_target). Returns
  `SUCCESS`/`FAILURE` immediately with no side effects.

### 3.2 Execution Flow

**Tick-based**: The tree is ticked from the root each update cycle. Nodes that returned
`RUNNING` on the previous tick are resumed. This is the most common approach.

**Event-driven**: Nodes register for events. The tree only re-evaluates branches affected
by a fired event (e.g., "target_spotted" triggers the combat subtree). More efficient but
harder to implement and debug.

```
# Pseudocode: Behavior Tree tick
class BTNode:
    func tick(blackboard) -> Status: pass

class Sequence extends BTNode:
    var children: Array[BTNode]
    func tick(blackboard) -> Status:
        for child in children:
            var result = child.tick(blackboard)
            if result != SUCCESS:
                return result
        return SUCCESS

class Selector extends BTNode:
    var children: Array[BTNode]
    func tick(blackboard) -> Status:
        for child in children:
            var result = child.tick(blackboard)
            if result != FAILURE:
                return result
        return FAILURE
```

### 3.3 Blackboard Data Sharing

A **blackboard** is a key-value store acting as shared memory for the behavior tree:

- Nodes read/write data (target_position, threat_level, current_weapon).
- Decouples nodes -- they communicate through data, not direct references.
- Can be scoped: per-agent blackboard, per-squad blackboard, global blackboard.
- Common implementation: `Dictionary<String, Variant>` with typed accessors.

### 3.4 Dynamic Subtree Injection

Advanced BT systems allow swapping subtrees at runtime:

- Equip different weapon -> inject weapon-specific attack subtree.
- NPC role changes (recruit to officer) -> inject leadership subtree.
- Modding support: load subtrees from external resource files.

### 3.5 Common Behavior Patterns

**Patrol**: Sequence[ GetNextWaypoint -> MoveTo(waypoint) -> Wait(2s) ]

**Chase**: Selector[ Sequence[ IsTargetVisible -> MoveTo(target) ] , InvestigateLastKnown ]

**Flee**: Sequence[ IsHealthLow -> GetFleePosition -> MoveTo(flee_pos) ]

**Attack**: Sequence[ IsInRange -> FaceTarget -> PlayAttack -> ApplyDamage ]

**Investigate**: Sequence[ HasLastKnownPosition -> MoveTo(last_known) -> LookAround ]

---

## 4. Goal-Oriented Action Planning (GOAP)

### 4.1 World State Representation

GOAP represents the world as a set of boolean or numeric key-value pairs:

```
# World state example
world_state = {
    "has_weapon": true,
    "weapon_loaded": false,
    "target_visible": true,
    "target_dead": false,
    "at_cover": false,
    "health": 75
}
```

### 4.2 Action Preconditions and Effects

Each action defines what must be true before it can execute (preconditions) and what
changes after it executes (effects):

```
Action: ReloadWeapon
    preconditions: { "has_weapon": true, "weapon_loaded": false }
    effects:       { "weapon_loaded": true }
    cost: 2

Action: ShootTarget
    preconditions: { "weapon_loaded": true, "target_visible": true }
    effects:       { "target_dead": true }
    cost: 1

Action: MoveToCover
    preconditions: { "at_cover": false }
    effects:       { "at_cover": true }
    cost: 3

Action: MeleeAttack
    preconditions: { "target_visible": true, "in_melee_range": true }
    effects:       { "target_dead": true }
    cost: 4
```

### 4.3 Planning Algorithm

The planner uses **backward search** (regressive A*) from the goal state:

1. Start with the desired goal (e.g., `{ "target_dead": true }`).
2. Find actions whose effects satisfy unsatisfied goal conditions.
3. Add that action's preconditions to the open requirements.
4. Repeat until all preconditions are satisfied by the current world state.
5. Use A* with action cost as the edge weight and unsatisfied conditions as the heuristic.

```
# Pseudocode: GOAP Planner (simplified)
func plan(current_state, goal_state, available_actions) -> Array[Action]:
    var open = PriorityQueue()  # sorted by cost + heuristic
    open.push(PlanNode(state=goal_state, actions=[], cost=0))

    while not open.empty():
        var node = open.pop()
        if current_state.satisfies(node.state):
            return node.actions.reversed()

        for action in available_actions:
            if action.effects_satisfy_any(node.state):
                var new_state = node.state.apply_regression(action)
                var new_cost = node.cost + action.cost
                var h = count_unsatisfied(current_state, new_state)
                open.push(PlanNode(new_state, node.actions + [action], new_cost + h))

    return []  # no plan found
```

### 4.4 When GOAP Beats Behavior Trees

| Scenario | GOAP Advantage |
|---|---|
| Many possible action combinations | Planner finds optimal sequence automatically |
| Emergent behavior desired | Unexpected but valid plans emerge from action definitions |
| Frequent world state changes | Replanning adapts to new conditions without manual transitions |
| Designer-friendly action authoring | Define actions independently; planner handles chaining |

GOAP is **not** ideal for: simple AI with few behaviors (overhead not justified), strictly
scripted sequences, or real-time twitch reactions (planning latency).

---

## 5. Utility AI

### 5.1 Scoring Functions and Considerations

Utility AI scores every candidate action using **considerations** -- individual scoring
functions that evaluate one aspect of the decision. Each consideration maps an input
value to a 0--1 score via a **response curve** (linear, quadratic, logistic, etc.).

```
# Pseudocode: Consideration scoring
class Consideration:
    var input_func: Callable      # returns raw value (e.g., distance_to_enemy)
    var curve: ResponseCurve      # maps input to 0..1
    var weight: float = 1.0

    func score(context) -> float:
        var raw = input_func.call(context)
        var normalized = clamp(remap(raw, min_val, max_val, 0.0, 1.0), 0.0, 1.0)
        return curve.evaluate(normalized) * weight
```

Multiple considerations for a single action are combined (usually multiplied) to produce
a final action score. The action with the highest score is selected.

### 5.2 Response Curves

Common curve types:
- **Linear**: `y = mx + b` -- proportional response
- **Quadratic**: `y = x^2` -- slow start, accelerating importance
- **Logistic (S-curve)**: `y = 1 / (1 + e^(-k*(x-0.5)))` -- threshold behavior
- **Inverse**: `y = 1 - x` -- high score when input is low

### 5.3 Action Selection

```
# Pseudocode: Utility-based action selection
func select_action(agent, actions) -> Action:
    var best_action = null
    var best_score = -1.0

    for action in actions:
        var score = 1.0
        for consideration in action.considerations:
            var c_score = consideration.score(agent)
            score *= c_score
            if score == 0.0:
                break  # early exit optimization
        # Compensation factor: score^(1/n) prevents many considerations from
        # always producing tiny scores
        score = pow(score, 1.0 / action.considerations.size())
        if score > best_score:
            best_score = score
            best_action = action

    return best_action
```

### 5.4 Infinite Axis Utility System (IAUS)

Developed by Dave Mark and Mike Lewis (GDC AI Summit 2015), IAUS is a data-driven
architecture with these key principles:

- **Infinite axes**: No hard limit on the number of considerations per action. Each axis
  is an independent input + curve pair.
- **Context-based scoring**: Actions are scored per target. "Shoot Chuck" and "Shoot
  Ralph" are scored independently, avoiding a two-step "decide behavior then pick target"
  problem.
- **Performance optimizations**: Memoization tables for repeated input queries, early exit
  on zero score, weight-ordered evaluation (cheap checks first, expensive ones like line
  of sight last).
- **Designer-friendly**: Curves and weights are tuned in visual editors without code changes.

### 5.5 Combining with Other Approaches

Utility AI pairs well with other systems:
- **Utility + BT**: Utility selects which behavior subtree to run; BT handles execution.
- **Utility + FSM**: Utility scores state transitions instead of hard-coded conditions.
- **Utility + GOAP**: Utility sets goal priorities; GOAP plans how to achieve them.

---

## 6. Pathfinding Algorithms

### 6.1 Breadth-First Search (BFS)

Explores all nodes at distance N before distance N+1. Guarantees shortest path on
**unweighted** graphs. Time: O(V + E). Not suitable for weighted terrain costs.

### 6.2 Dijkstra's Algorithm

BFS generalized to weighted graphs. Explores nodes in order of cumulative cost from the
start. Guarantees optimal path. Time: O((V + E) log V) with a priority queue. Explores
in all directions (no heuristic).

### 6.3 A* (A-Star)

The standard game pathfinding algorithm. Extends Dijkstra with a heuristic `h(n)` that
estimates cost from node `n` to the goal:

```
f(n) = g(n) + h(n)
where:
    g(n) = actual cost from start to n
    h(n) = heuristic estimate from n to goal (must be admissible: never overestimates)
```

Common heuristics:
- **Manhattan distance**: `|dx| + |dy|` for 4-directional grids
- **Chebyshev distance**: `max(|dx|, |dy|)` for 8-directional grids
- **Euclidean distance**: `sqrt(dx^2 + dy^2)` for any-angle movement
- **Octile distance**: `max(|dx|, |dy|) + (sqrt(2) - 1) * min(|dx|, |dy|)` for grids

```
# Pseudocode: A* algorithm
func a_star(start, goal, graph) -> Array[Node]:
    var open = PriorityQueue()  # sorted by f = g + h
    var came_from = {}
    var g_score = { start: 0 }

    open.push(start, heuristic(start, goal))

    while not open.empty():
        var current = open.pop()
        if current == goal:
            return reconstruct_path(came_from, current)

        for neighbor in graph.neighbors(current):
            var tentative_g = g_score[current] + graph.cost(current, neighbor)
            if tentative_g < g_score.get(neighbor, INF):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                var f = tentative_g + heuristic(neighbor, goal)
                open.push(neighbor, f)

    return []  # no path found
```

### 6.4 Weighted A*

Multiplies the heuristic by a weight `w > 1`: `f(n) = g(n) + w * h(n)`. Finds paths
faster but sacrifices optimality. Paths are at most `w` times the optimal cost. Useful
when "good enough" paths are acceptable and speed matters.

### 6.5 Jump Point Search (JPS)

A* optimization for **uniform-cost grids** (no variable terrain weights). JPS skips
intermediate nodes by "jumping" along straight lines and diagonals, only adding nodes at
forced neighbors (points where direction must change due to obstacles). Can be 10--100x
faster than A* on open grids. Not applicable to weighted grids or navmeshes.

### 6.6 Theta* (Any-Angle Pathfinding)

Extends A* by allowing parent pointers to skip grid constraints. When expanding a node,
checks line-of-sight to the grandparent; if clear, connects directly, producing
**smooth, any-angle paths** without post-processing. Slightly more expensive per node
than A* due to line-of-sight checks, but produces visually superior paths.

### 6.7 D* Lite (Dynamic Replanning)

Designed for environments that change during traversal. Maintains the search tree and
incrementally updates when edge costs change (e.g., destructible terrain in a voxel
world). Far cheaper than re-running A* from scratch when only a few cells change.
Particularly relevant for Chat Attack where voxel destruction alters walkability.

### 6.8 Hierarchical Pathfinding (HPA*)

Decomposes the map into a hierarchy of abstraction levels:

1. **Preprocessing**: Divide map into sectors. Compute intra-sector paths and
   inter-sector connections.
2. **High-level search**: A* on the abstract graph (sector connections) to find a
   corridor of sectors.
3. **Low-level refinement**: A* within each sector for the final detailed path.

Benefits: 100--1000x fewer nodes visited for long-distance paths. Suboptimal but fast.
Particularly useful for large voxel worlds where the full grid has millions of cells.

### 6.9 Flow Fields

Used when many agents share the same destination (common in RTS games):

1. Run Dijkstra from the destination, filling every cell with its distance.
2. Compute a direction vector per cell pointing toward the neighbor with lowest distance.
3. Agents sample the flow field at their position and steer accordingly.

Cost is **per-destination, not per-agent**, making it efficient when hundreds of units
move to the same target. Used in Supreme Commander 2, Planetary Annihilation, and others.

---

## 7. Navigation Meshes (NavMesh)

### 7.1 Generation and Baking

A NavMesh is a polygon mesh representing walkable surfaces. Generation typically uses the
**Recast** algorithm:

1. Voxelize the geometry into a heightfield.
2. Filter non-walkable voxels (too steep, too low clearance).
3. Build regions of contiguous walkable area.
4. Trace contour polygons around regions.
5. Triangulate contours into the final mesh.

Baking can happen offline (editor-time) or at runtime for dynamic content.

### 7.2 Runtime NavMesh Modification

For games with dynamic or destructible environments:

- **Tile-based NavMesh**: The mesh is divided into tiles. When geometry changes, only
  affected tiles are rebaked. Godot and Recast/Detour both support this.
- **NavMesh obstacles**: Carve temporary holes in the navmesh for moving objects (doors,
  vehicles). Cheaper than rebaking but less precise.
- **Dynamic rebaking**: Schedule incremental rebakes over multiple frames to avoid hitches.

### 7.3 NavMesh Agents and Obstacles

- **Agent**: An entity that queries paths on the navmesh and follows them. Defined by
  radius, height, max slope, and step height.
- **Obstacle**: A shape that either carves the navmesh (static) or is avoided via local
  avoidance (dynamic). In Godot, `NavigationObstacle3D` auto-detects parent size.

### 7.4 Off-Mesh Links / Connections

Represent non-standard traversals: jumping across gaps, climbing ladders, using
teleporters. Defined as a pair of positions with a traversal type. The agent's navigation
system detects these links and triggers the appropriate animation or action.

### 7.5 NavMesh in Godot (NavigationServer3D)

Godot 4.x provides `NavigationServer3D` with these key features:

- **NavigationRegion3D**: Holds a `NavigationMesh` resource. Multiple regions are
  automatically merged by the server at their edges.
- **NavigationAgent3D**: Queries paths, handles path following, provides avoidance.
  Key properties: `path_desired_distance`, `target_desired_distance`, `max_speed`.
- **NavigationObstacle3D**: Dynamic avoidance obstacle. Auto-sizes from parent collision.
- **Runtime baking**: `NavigationMeshSourceGeometryData3D` + `bake_from_source_geometry_data()`
  for procedural or destructible terrain.
- **Multiple maps**: Support for separate navigation maps (e.g., ground vs. flying agents).
- **Avoidance**: RVO-based local avoidance built into the navigation server, with layers
  and masks for avoidance groups.

```
# Godot 4.x NavMesh agent setup (GDScript)
@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D

func _ready():
    nav_agent.path_desired_distance = 0.5
    nav_agent.target_desired_distance = 0.5
    nav_agent.max_speed = 5.0

func move_to(target: Vector3):
    nav_agent.target_position = target

func _physics_process(delta):
    if nav_agent.is_navigation_finished():
        return
    var next_pos = nav_agent.get_next_path_position()
    var direction = (next_pos - global_position).normalized()
    velocity = direction * nav_agent.max_speed
    move_and_slide()
```

---

## 8. Pathfinding in Voxel Worlds

### 8.1 3D Grid Pathfinding

Voxel worlds are naturally represented as 3D grids, but naively running A* on a full
3D grid is extremely expensive (a 256x64x256 world has 4+ million cells). Strategies:

- **Surface-only search**: Only consider voxels on walkable surfaces (top of solid blocks
  with air above). Reduces the search space by ~90%.
- **Multi-layer 2D grid**: Project the 3D world into stacked 2D layers at different
  heights, connected by vertical links (stairs, ladders, jumps).
- **Sparse Voxel Octree (SVO)**: Hierarchical spatial subdivision. Large empty volumes
  collapse into single nodes. Efficient for worlds with significant open space.

### 8.2 Dynamic Obstacle Handling for Destructible Terrain

In Chat Attack, players destroy and build voxels, invalidating cached paths:

- **Local graph invalidation**: When voxels change, mark affected pathfinding nodes as
  dirty. Only recalculate the local area, not the entire graph.
- **D* Lite**: Incrementally update the path when costs change, avoiding full replanning.
- **Dirty chunk queue**: Track which chunks have been modified. A background thread
  updates the navigation graph for dirty chunks each frame, bounded by time budget.
- **Path validity checks**: Agents periodically verify their current path is still
  traversable. If a segment is blocked, request a local repath.

### 8.3 Chunk-Based Path Caching

Align pathfinding data with the chunk system (Chat Attack uses 16x16 chunks):

- **Per-chunk navigation data**: Each chunk stores its internal walkable graph and
  boundary connection points to adjacent chunks.
- **Hierarchical search**: High-level path through chunk connections, low-level path
  within each chunk (HPA* approach).
- **Cache invalidation**: When a chunk is modified, only that chunk's navigation data
  is rebuilt. Adjacent chunk connections are rechecked.
- **Streaming**: Navigation data for chunks is generated alongside terrain streaming,
  so newly loaded chunks are immediately pathfindable.

### 8.4 Vertical Movement (Climbing, Flying, Swimming)

Different movement modes require separate navigation layers:

| Mode | Graph Structure | Special Considerations |
|---|---|---|
| Walking | 2D surface grid | Step height, max slope, gap jumping |
| Climbing | Vertical surface adjacency | Ladder nodes, climbable material flags |
| Flying | Full 3D grid or octree | No ground constraint, 3D heuristic |
| Swimming | Water volume subgraph | Water surface transitions, currents |

Agents switch between navigation layers at transition points (water surface, ladder base,
ledge edge). Each layer can use different pathfinding parameters.

---

## 9. Steering Behaviors

Craig Reynolds (1999) defined autonomous steering behaviors that produce natural-looking
movement from simple rules. These operate at the **locomotion layer** -- they produce a
velocity/force vector each frame, independent of high-level decisions.

### 9.1 Individual Behaviors

```
# Pseudocode: Core steering behaviors (all return a Vector3 force)

func seek(agent, target_pos) -> Vector3:
    var desired = (target_pos - agent.position).normalized() * agent.max_speed
    return desired - agent.velocity

func flee(agent, threat_pos) -> Vector3:
    return -seek(agent, threat_pos)

func arrive(agent, target_pos, slow_radius) -> Vector3:
    var offset = target_pos - agent.position
    var distance = offset.length()
    var speed = agent.max_speed
    if distance < slow_radius:
        speed *= distance / slow_radius  # decelerate proportionally
    var desired = offset.normalized() * speed
    return desired - agent.velocity

func pursue(agent, quarry) -> Vector3:
    var prediction_time = (quarry.position - agent.position).length() / agent.max_speed
    var predicted_pos = quarry.position + quarry.velocity * prediction_time
    return seek(agent, predicted_pos)

func evade(agent, pursuer) -> Vector3:
    var prediction_time = (pursuer.position - agent.position).length() / agent.max_speed
    var predicted_pos = pursuer.position + pursuer.velocity * prediction_time
    return flee(agent, predicted_pos)
```

### 9.2 Wander and Obstacle Avoidance

**Wander**: Projects a circle in front of the agent. A target point moves randomly around
the circle's perimeter each frame, producing smooth, natural-looking wandering.

**Obstacle avoidance**: Casts a detection volume (ray or box) ahead of the agent. When an
obstacle is detected, generates a lateral steering force proportional to proximity and
inversely proportional to the agent's distance from the obstacle center.

### 9.3 Flocking (Separation, Alignment, Cohesion)

Three rules applied to local neighbors (within a perception radius):

- **Separation**: Steer away from neighbors that are too close. Prevents crowding.
- **Alignment**: Steer toward the average heading of neighbors. Produces parallel movement.
- **Cohesion**: Steer toward the average position of neighbors. Keeps the flock together.

```
func flocking(agent, neighbors) -> Vector3:
    var separation = Vector3.ZERO
    var alignment = Vector3.ZERO
    var cohesion = Vector3.ZERO

    for neighbor in neighbors:
        var offset = agent.position - neighbor.position
        separation += offset.normalized() / max(offset.length(), 0.001)
        alignment += neighbor.velocity
        cohesion += neighbor.position

    if neighbors.size() > 0:
        alignment = (alignment / neighbors.size()).normalized() * agent.max_speed - agent.velocity
        cohesion = seek(agent, cohesion / neighbors.size())

    return separation * 1.5 + alignment * 1.0 + cohesion * 1.0
```

### 9.4 Path Following and Flow Fields

**Path following**: The agent finds the nearest point on a predefined path, then seeks a
target point slightly ahead on the path. If the agent drifts too far from the path, it
steers back.

**Flow fields**: Precomputed vector fields (see Section 6.9). The agent samples the field
at its position and applies the vector as a steering force. Extremely efficient for many
agents sharing a destination.

### 9.5 RVO / ORCA for Crowd Simulation

**Reciprocal Velocity Obstacles (RVO)** and **Optimal Reciprocal Collision Avoidance
(ORCA)** handle multi-agent collision avoidance without central coordination:

- Each agent computes a set of velocities that would cause collision with each neighbor.
- ORCA takes **half responsibility** for each pairwise avoidance, preventing oscillation.
- Reduces to a low-dimensional linear program per agent.
- Scales to thousands of agents in real-time.
- Godot's NavigationServer includes built-in RVO avoidance via `NavigationAgent3D`.

---

## 10. Spatial Awareness

### 10.1 Perception Systems

Perception simulates an agent's senses, filtering the world into what the AI "knows":

**Vision**: Cone-shaped detection volume defined by:
- Range (max distance)
- Field of view angle (e.g., 110 degrees)
- Line-of-sight raycasts (blocked by walls, terrain)

**Hearing**: Spherical detection triggered by noise events with a loudness value.
Loudness attenuates with distance. Walls and materials can dampen sound.

**Memory**: Perceived stimuli persist with a decay timer. An agent "remembers" a target's
last known position for N seconds after losing sight, enabling investigation behavior.

```
# Pseudocode: Vision perception check
func can_see(agent, target) -> bool:
    var to_target = target.position - agent.position
    var distance = to_target.length()
    if distance > agent.sight_range:
        return false
    var angle = agent.forward.angle_to(to_target.normalized())
    if angle > agent.fov / 2.0:
        return false
    # Line-of-sight raycast
    var result = agent.get_world_3d().direct_space_state.intersect_ray(
        PhysicsRayQueryParameters3D.create(agent.eye_position, target.position)
    )
    return result.is_empty() or result.collider == target
```

### 10.2 Threat Assessment

Agents evaluate threats using weighted factors:
- Distance (closer = more threatening)
- Damage potential (weapon type, level)
- Current aggression (attacking me vs. attacking ally vs. idle)
- Health (low-health enemies are less threatening but easier to finish)
- Numbers (multiple enemies in a group compound threat)

### 10.3 Influence Maps and Heat Maps

**Influence maps** overlay a grid on the world where each cell stores a numeric value
representing some quality (threat, ally presence, resource density):

- Values propagate outward from sources with decay by distance.
- Multiple layers can be combined (ally influence - enemy influence = safety map).
- Updated incrementally: only recalculate when sources move or change.

**Applications**:
- Movement decisions: seek high-safety cells, avoid high-threat areas
- Tactical positioning: find positions with high visibility and low threat
- Territory control visualization: which faction dominates each area

**Heat maps** are temporal influence maps that accumulate over time, showing where
activity has historically concentrated (player death locations, patrol routes, combat
hotspots). Useful for dynamic difficulty and content placement.

### 10.4 Tactical Position Evaluation

Scoring positions for tactical quality:

```
func evaluate_position(pos, agent, enemies) -> float:
    var score = 0.0
    # Cover value
    if has_cover_from(pos, enemies):
        score += 30.0
    # Height advantage
    score += (pos.y - average_enemy_height(enemies)) * 5.0
    # Distance to nearest enemy (not too close, not too far)
    var dist = distance_to_nearest(pos, enemies)
    score += 20.0 - abs(dist - agent.preferred_range) * 2.0
    # Line of sight to enemies
    score += count_visible_enemies(pos, enemies) * 10.0
    # Escape routes (not cornered)
    score += count_open_adjacent(pos) * 3.0
    return score
```

---

## 11. Group AI and Coordination

### 11.1 Squad Tactics

A **squad** is a coordinated group of agents sharing a common objective. The squad
manager handles:

- **Target prioritization**: Select the highest-value target for the group.
- **Suppression**: Some members provide covering fire while others advance.
- **Flanking**: Assign members to approach from different angles.
- **Retreating**: Ordered withdrawal with rearguard covering.

The "Frontline" concept (as used in Days Gone) defines the spatial boundary between
a squad and its enemies, answering queries like "which side should I approach from?"

### 11.2 Formation Movement

Formations define relative positions for group members:

```
# Pseudocode: Formation system
class Formation:
    var leader: AIAgent
    var slots: Array[Vector3]  # offsets relative to leader

    func get_world_position(slot_index: int) -> Vector3:
        var offset = slots[slot_index]
        return leader.position + leader.basis * offset

    func update():
        for i in range(members.size()):
            var target = get_world_position(i)
            members[i].move_to(target)
```

Common formations: line, wedge/V, column, circle, staggered column. Formations
dynamically compress when passing through narrow spaces and re-expand afterward.

### 11.3 Communication Between Agents

- **Direct signaling**: Agent A tells Agent B about a spotted enemy (function call or
  message bus).
- **Shared blackboard**: Squad-level blackboard stores shared knowledge (spotted
  enemies, captured positions).
- **Radio chatter / barks**: Verbal communication serves dual purpose: informs player
  of AI intent and synchronizes AI behavior (as in F.E.A.R.).

### 11.4 Role Assignment

Roles specialize agent behavior within a group:

| Role | Behavior Priority |
|---|---|
| Point | Lead the formation, first to engage |
| Flanker | Move to enemy sides, suppress from angles |
| Support | Stay back, provide ranged fire or healing |
| Rearguard | Watch behind, cover retreat routes |

Roles can be assigned statically (by agent class) or dynamically (utility-scored based
on agent capabilities, position, and current squad needs).

---

## 12. Machine Learning in Games

### 12.1 Reinforcement Learning for NPC Behavior

RL trains agents through trial-and-error in a reward-driven loop:

1. Agent observes game state (position, health, nearby entities).
2. Agent selects an action from its policy.
3. Environment returns a reward signal (+1 for damage dealt, -1 for damage taken, etc.).
4. Policy is updated to maximize cumulative reward.

**Strengths**: Produces emergent, adaptive behavior. NPCs learn to flank, use cover, and
exploit player patterns without explicit programming.

**Challenges**: Long training times, reward shaping is difficult, behavior may be
unpredictable or "unfun." Typically trained offline and deployed with a frozen policy.

### 12.2 Neural Networks for Difficulty Adjustment

Dynamic Difficulty Adjustment (DDA) systems use player performance metrics to modulate
challenge:

- Track metrics: kill/death ratio, health at end of encounters, time to complete objectives.
- A neural network or simpler model predicts player skill level.
- Game parameters are adjusted: enemy health, damage, spawn rates, AI aggressiveness.
- Goal: keep the player in a "flow state" -- challenged but not frustrated.

### 12.3 When ML Is / Isn't Appropriate

| Use ML When | Avoid ML When |
|---|---|
| Large behavior spaces that are hard to hand-author | Simple, predictable behavior is required |
| Adaptation to player behavior is a core feature | Deterministic, testable responses are needed |
| Training data or simulation time is available | Ship date is tight and debugging ML is a risk |
| The game genre tolerates occasional odd behavior | Players expect precise, reliable AI (e.g., allies) |

**For Chat Attack specifically**: Traditional AI (behavior trees + utility scoring) is
recommended for faction NPCs. ML could be explored for adaptive difficulty in PvE
encounters or for detecting exploitation patterns in the economy (anomaly detection on
the transaction ledger), but is not a priority for initial development.

---

## Quick Reference: Algorithm Selection Guide

```
Decision Framework:

Simple NPC (< 5 behaviors)?
    -> FSM

Complex NPC (5-15 behaviors, no planning)?
    -> Behavior Tree

NPC needs to weigh many factors continuously?
    -> Utility AI (or Utility + BT hybrid)

NPC needs multi-step plans that adapt to world state?
    -> GOAP

Short-distance pathfinding on a grid?
    -> A*

Long-distance pathfinding on a large map?
    -> HPA* (hierarchical A*)

Any-angle smooth paths needed?
    -> Theta*

Terrain changes during traversal (destructible voxels)?
    -> D* Lite or local A* re-pathing

Many agents, same destination?
    -> Flow Fields

3D navmesh-based pathfinding in Godot?
    -> NavigationServer3D + NavigationAgent3D

Local collision avoidance for crowds?
    -> RVO/ORCA (built into Godot NavigationServer)
```

---

## Citations

- Reynolds, Craig W. "Steering Behaviors For Autonomous Characters." GDC 1999.
  https://www.red3d.com/cwr/steer/gdc99/
- Orkin, Jeff. "Building the AI of F.E.A.R. with Goal Oriented Action Planning."
  Gamedeveloper.com. https://www.gamedeveloper.com/design/building-the-ai-of-f-e-a-r-with-goal-oriented-action-planning
- Patel, Amit. "Introduction to A*." Red Blob Games.
  https://www.redblobgames.com/pathfinding/a-star/introduction.html
- Patel, Amit. "Flow Field Pathfinding." Red Blob Games.
  https://www.redblobgames.com/blog/2024-04-27-flow-field-pathfinding/
- Mark, Dave and Lewis, Mike. "Choosing Effective Utility-Based Considerations."
  Game AI Pro 3, Chapter 13.
  http://www.gameaipro.com/GameAIPro3/GameAIPro3_Chapter13_Choosing_Effective_Utility-Based_Considerations.pdf
- Mark, Dave. "Modular Tactical Influence Maps." Game AI Pro 2, Chapter 30.
  https://www.gameaipro.com/GameAIPro2/GameAIPro2_Chapter30_Modular_Tactical_Influence_Maps.pdf
- Sunshine-Hill, Ben. "RVO and ORCA: How They Really Work." Game AI Pro 3, Chapter 19.
  http://www.gameaipro.com/GameAIPro3/GameAIPro3_Chapter19_RVO_and_ORCA_How_They_Really_Work.pdf
- Emerson, Elijah. "Crowd Pathfinding and Steering Using Flow Field Tiles."
  Game AI Pro, Chapter 23.
  http://www.gameaipro.com/GameAIPro/GameAIPro_Chapter23_Crowd_Pathfinding_and_Steering_Using_Flow_Field_Tiles.pdf
- Lewis, Mike. "Escaping the Grid: Infinite-Resolution Influence Mapping."
  Game AI Pro 2, Chapter 29.
  http://www.gameaipro.com/GameAIPro2/GameAIPro2_Chapter29_Escaping_the_Grid_Infinite-Resolution_Influence_Mapping.pdf
- Van den Berg, Jur et al. "Reciprocal n-body Collision Avoidance." ORCA.
  https://gamma.cs.unc.edu/ORCA/
- Karlsson, Tobias. "Squad Coordination in Days Gone." Game AI Pro Online Edition 2021.
  http://www.gameaipro.com/GameAIProOnlineEdition2021/GameAIProOnlineEdition2021_Chapter12_Squad_Coordination_in_Days_Gone.pdf
- Harabor, Daniel and Grastien, Alban. "Jump Point Search." (Referenced via)
  https://www.gamedev.net/tutorials/programming/artificial-intelligence/jump-point-search-fast-a-pathfinding-for-uniform-cost-grids-r4220/
- GDC Vault. "Hierarchical Dynamic Pathfinding for Large Voxel Worlds."
  https://gdcvault.com/play/1025151/Hierarchical-Dynamic-Pathfinding-for-Large
- Godot Engine. "Navigation Server for Godot 4.0."
  https://godotengine.org/article/navigation-server-godot-4-0/
- Godot Engine. "Using NavigationAgents." Godot Docs.
  https://docs.godotengine.org/en/latest/tutorials/navigation/navigation_using_navigationagents.html
- Costello, Darby. "Nav3D: 3D Pathfinding with Sparse Voxel Octrees." GitHub.
  https://github.com/darbycostello/Nav3D
- Nystrom, Robert. "State - Game Programming Patterns."
  https://gameprogrammingpatterns.com/state.html
- Gamedeveloper.com. "Behavior Trees for AI: How They Work."
  https://www.gamedeveloper.com/programming/behavior-trees-for-ai-how-they-work
- Tono Game Consultants. "Smarter Game AI with Infinite Axis Utility Systems."
  https://tonogameconsultants.com/infinite-axis-utility-systems/
- Tono Game Consultants. "Perception in Game AI: Smarter NPC Awareness."
  https://tonogameconsultants.com/game-ai-perception/
- Chaudhari, Vedant. "Goal Oriented Action Planning." Medium.
  https://medium.com/@vedantchaudhari/goal-oriented-action-planning-34035ed40d0b
- Stanford CS123. "Hierarchical FSM & Behavior Trees." Lecture notes.
  https://web.stanford.edu/class/cs123/lectures/CS123_lec08_HFSM_BT.pdf
- Generalist Programmer. "Game AI Behavior Trees: Complete Implementation Tutorial 2025."
  https://generalistprogrammer.com/tutorials/game-ai-behavior-trees-complete-implementation-tutorial
- jdxdev. "RTS Pathfinding 1 - Flowfields."
  https://www.jdxdev.com/blog/2020/05/03/flowfields/
- GameDev.net. "The Core Mechanics of Influence Mapping."
  https://www.gamedev.net/tutorials/programming/artificial-intelligence/the-core-mechanics-of-influence-mapping-r2799/
