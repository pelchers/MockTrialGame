# Physics & Collision Systems Reference

Comprehensive reference for game physics engines, collision detection, response systems,
constraints, character controllers, soft bodies, voxel physics, multiplayer physics,
popular engines, and performance optimization.

---

## 1. Physics Engine Fundamentals

### Rigid Body Dynamics

A rigid body is an idealized solid that does not deform under force. Each rigid body has:

- **Mass** and **inertia tensor** (resistance to rotation)
- **Position** (center of mass) and **orientation** (quaternion or matrix)
- **Linear velocity** and **angular velocity**
- Accumulated **forces** and **torques**

The simulation loop each tick:

1. Accumulate external forces and torques (gravity, player input, explosions).
2. Integrate accelerations into velocities (linear: `F/m`; angular: `I^-1 * torque`).
3. Integrate velocities into positions and orientations.
4. Detect collisions and generate contacts.
5. Resolve constraints and contacts (impulses / position corrections).

### Integration Methods

| Method | Order | Cost per step | Energy drift | Symplectic | Best for |
|---|---|---|---|---|---|
| Explicit Euler | 1 | Very low | Gains energy, unstable | No | Prototyping only |
| Semi-implicit Euler | 1 | Low | Stable, slight drift | Yes | Most game physics engines |
| Velocity Verlet | 2 | Low-medium | Very stable | Yes | Particle systems, molecular dynamics |
| RK4 (Runge-Kutta 4) | 4 | 4x force evals | Accurate but drifts energy | No | Orbital mechanics, smooth curves |

**Pseudocode -- Semi-implicit Euler (most common in games):**

```
func integrate(body, dt):
    body.velocity += (body.force / body.mass) * dt
    body.position += body.velocity * dt
    body.angular_velocity += body.inverse_inertia * body.torque * dt
    body.orientation += quaternion_derivative(body.orientation, body.angular_velocity) * dt
    body.orientation = normalize(body.orientation)
    body.force = Vector3.ZERO
    body.torque = Vector3.ZERO
```

**Pseudocode -- Velocity Verlet:**

```
func integrate_verlet(body, dt):
    var half_dt = dt * 0.5
    body.velocity += body.acceleration * half_dt
    body.position += body.velocity * dt
    var new_accel = compute_acceleration(body)
    body.velocity += new_accel * half_dt
    body.acceleration = new_accel
```

**Key insight:** Symplectic integrators (semi-implicit Euler, Verlet) conserve energy over long
simulations and resist "explosion" instabilities. RK4 is more accurate per step but can
gain or lose energy over time, making it less suited for constrained rigid body simulations.

### Fixed Timestep vs Variable Timestep

**Variable timestep** uses the actual frame delta. Physics becomes frame-rate dependent -- faster
machines simulate differently. Collisions can be missed at low FPS; simulation may explode.

**Fixed timestep** decouples physics from rendering. The canonical pattern (from Glenn Fiedler's
"Fix Your Timestep"):

```
var accumulator = 0.0
var physics_dt = 1.0 / 60.0  # 60 Hz physics
var previous_state: PhysicsState
var current_state: PhysicsState

func _process(frame_dt):
    accumulator += frame_dt
    while accumulator >= physics_dt:
        previous_state = current_state
        integrate(current_state, physics_dt)
        accumulator -= physics_dt
    var alpha = accumulator / physics_dt
    render_state = lerp(previous_state, current_state, alpha)
```

The **spiral of death** occurs when physics simulation takes longer than `physics_dt` per step,
causing the accumulator to grow unboundedly. Clamp `accumulator` to a maximum (e.g., `0.25s`)
to prevent this.

### Physics Substeps and Stability

Running multiple physics substeps per tick improves constraint solver convergence and collision
accuracy at the cost of CPU time. For example, 2 substeps at 60 Hz effectively gives 120 Hz
physics precision. Substeps are critical for:

- Small / fast objects (bullets, projectiles)
- Stiff constraints (chains, ragdolls)
- Stacked objects (boxes piled on each other)

Godot 4 exposes `physics/common/physics_ticks_per_second` and the Jolt integration supports
configurable substeps per tick.

---

## 2. Collision Detection

### Broad Phase

Reduces O(n^2) pair checks to a manageable set of potentially colliding pairs.

**Spatial Hashing / Uniform Grid:**
- Divide world into cells of fixed size. Each object is inserted into cells it overlaps.
- O(1) insertion and lookup. Works best when objects are similar size.
- Poor for worlds with vastly different object scales.

```
func broad_phase_grid(objects, cell_size):
    var grid = {}
    for obj in objects:
        var min_cell = floor(obj.aabb.min / cell_size)
        var max_cell = floor(obj.aabb.max / cell_size)
        for x in range(min_cell.x, max_cell.x + 1):
            for y in range(min_cell.y, max_cell.y + 1):
                for z in range(min_cell.z, max_cell.z + 1):
                    var key = Vector3i(x, y, z)
                    if key not in grid:
                        grid[key] = []
                    grid[key].append(obj)
    var pairs = Set()
    for cell in grid.values():
        for i in range(cell.size()):
            for j in range(i + 1, cell.size()):
                if cell[i].aabb.intersects(cell[j].aabb):
                    pairs.add((cell[i], cell[j]))
    return pairs
```

**Bounding Volume Hierarchy (BVH / AABB Tree):**
- Binary tree where each node stores an AABB enclosing its children.
- Efficient for static and semi-dynamic scenes. O(n log n) build, O(log n) query.
- PhysX, Jolt, and Godot Physics all use BVH variants internally.

**Sweep-and-Prune (Sort and Sweep / SAP):**
- Project AABBs onto each axis, sort by min extent.
- Overlaps on all axes indicate potential collision.
- Exploits temporal coherence: insertion sort on nearly-sorted lists is O(n).
- Used by Box2D and many real-time engines.

### Narrow Phase

Once broad phase identifies candidate pairs, narrow phase tests exact geometry.

**Separating Axis Theorem (SAT):**
- For two convex shapes, if a separating axis exists (an axis along which projections don't
  overlap), the shapes do not intersect.
- Test face normals and edge cross products as candidate axes.
- Returns the minimum penetration axis (MTV -- Minimum Translation Vector).
- Fast for boxes and low-poly convex hulls. Cost grows with face/edge count.

**GJK (Gilbert-Johnson-Keerthi):**
- Iteratively builds a simplex in the Minkowski difference of two convex shapes.
- Determines if the origin is contained in the Minkowski difference (collision) or finds
  the closest points (no collision).
- Works with any convex shape via a support function.
- Typically paired with EPA for penetration depth.

```
func gjk_support(shape_a, shape_b, direction):
    return shape_a.furthest_point(direction) - shape_b.furthest_point(-direction)
```

**EPA (Expanding Polytope Algorithm):**
- After GJK confirms overlap, EPA expands the simplex into a polytope to find the
  penetration depth and contact normal.
- Returns the minimum penetration vector needed to separate the shapes.

### Collision Shapes

| Shape | Cost | Use Case |
|---|---|---|
| Sphere | Cheapest | Characters, projectiles, particles |
| Box (AABB/OBB) | Very cheap | Crates, buildings, triggers |
| Capsule | Cheap | Characters, limbs, beams |
| Convex hull | Medium | Vehicles, irregular props |
| Triangle mesh (trimesh) | Expensive | Static terrain, complex level geometry |
| Heightmap | Medium | Terrain (optimized grid) |

### Compound Shapes and Optimization

- Combine multiple primitive shapes into one body (e.g., a chair = box seat + 4 cylinder legs).
- Much cheaper than a single convex hull or trimesh for dynamic bodies.
- Triangle meshes should only be used for static colliders; dynamic trimesh is very expensive.
- Convex decomposition tools (V-HACD) can auto-split concave meshes into convex parts.

---

## 3. Collision Response

### Contact Generation and Manifolds

A **contact manifold** stores collision information between two bodies:

- **Contact points** (position in world space)
- **Contact normal** (direction of separation)
- **Penetration depth** (how far objects overlap)
- **Tangent vectors** (for friction)

Manifolds are typically cached frame-to-frame for warm starting the constraint solver.
A manifold usually holds 1-4 contact points for 3D (up to 2 for 2D).

### Impulse-Based Resolution

The core collision response formula computes an impulse magnitude `j`:

```
j = -(1 + e) * v_rel_dot_n / (1/m_a + 1/m_b + (I_a^-1 * (r_a x n)) x r_a + (I_b^-1 * (r_b x n)) x r_b) . n
```

Where:
- `e` = coefficient of restitution (bounciness, 0..1)
- `v_rel` = relative velocity at contact point
- `n` = contact normal
- `r_a`, `r_b` = vectors from centers of mass to contact point
- `m_a`, `m_b` = masses
- `I_a`, `I_b` = inertia tensors

The impulse is applied: `body_a.velocity -= j * n / m_a`, `body_b.velocity += j * n / m_b`,
with analogous angular impulse applications.

### Penetration Resolution (Position Correction)

Two main approaches:

1. **Baumgarte stabilization:** Add a bias velocity proportional to penetration depth to the
   velocity constraint. Pushes objects apart over a few frames. Can cause energy injection.

2. **Split impulse / pseudo-velocity:** Separate position correction from velocity resolution.
   Avoids adding energy while still resolving overlap. Used by Bullet, Box2D.

3. **Direct position projection:** Move objects apart by a fraction of penetration depth after
   impulse resolution. Simple but can cause jitter if overdone.

```
func position_correction(body_a, body_b, normal, depth):
    var slop = 0.01       # allowable penetration before correction
    var percent = 0.4     # correction fraction per frame
    var correction = max(depth - slop, 0.0) / (1.0/body_a.mass + 1.0/body_b.mass) * percent * normal
    body_a.position -= correction / body_a.mass
    body_b.position += correction / body_b.mass
```

### Friction Models

**Coulomb friction:** Friction impulse magnitude is bounded by `mu * |j_normal|`, where `mu`
is the friction coefficient. The friction cone is approximated as a friction pyramid (box
friction) for computational efficiency.

- **Static friction (`mu_s`):** Prevents sliding when force is below threshold.
- **Dynamic friction (`mu_d`):** Resists sliding motion (typically `mu_d < mu_s`).

Box friction linearizes the cone into two perpendicular tangent directions, solving each
independently. Simpler and faster, slightly less accurate on curved surfaces.

### Restitution (Bounciness)

The coefficient of restitution `e` determines how much kinetic energy is preserved:
- `e = 0`: Perfectly inelastic (no bounce, like clay)
- `e = 1`: Perfectly elastic (full bounce, like a superball)
- Typical values: rubber ~0.8, wood ~0.4, steel ~0.6

Combined restitution between two materials is typically computed as `max(e_a, e_b)` or
`(e_a + e_b) / 2`, depending on the engine.

---

## 4. Constraints and Joints

### Joint Types

| Joint | DOF removed | Description |
|---|---|---|
| Fixed | 6 | Welds two bodies together (zero relative motion) |
| Hinge (Revolute) | 5 | One rotational axis free (doors, wheels) |
| Ball-and-Socket (Spherical) | 3 | Free rotation around a point (shoulders, ragdoll hips) |
| Slider (Prismatic) | 5 | One translational axis free (pistons, rails) |
| Spring-Damper | Soft | Applies spring force `F = -k*x - c*v` between anchor points |
| Cone-Twist | 3-4 | Ball joint with angular limits (spine, neck) |
| Generic 6-DOF | Configurable | Per-axis limits on all 6 DOF |

### Constraint Solvers

**Sequential Impulse (SI) / Projected Gauss-Seidel (PGS):**
- The dominant solver in game physics (Box2D, Bullet, PhysX, Jolt, Godot Physics).
- Iteratively applies corrective impulses to each constraint.
- PGS is the mathematical formulation; SI is the equivalent impulse-based formulation
  (popularized by Erin Catto of Box2D).
- More iterations = more accurate but more expensive.
- Warm starting: use previous frame's impulses as initial guess for faster convergence.

```
func solve_constraints(constraints, iterations):
    # Warm start
    for c in constraints:
        apply_cached_impulse(c)
    # Iterate
    for i in range(iterations):
        for c in constraints:
            var error = compute_constraint_error(c)
            var impulse = compute_corrective_impulse(c, error)
            impulse = clamp_impulse(impulse, c.limits)
            apply_impulse(c.body_a, c.body_b, impulse)
            c.cached_impulse += impulse
```

**Soft Constraints:**
- Add compliance (inverse stiffness) to the constraint equation.
- Allows controlled "give" in joints, simulating springs and dampers.
- XPBD (Extended Position-Based Dynamics) uses compliance for soft constraints elegantly.

**Solver iteration count trade-offs:**
- 4-8 iterations: suitable for most games.
- 10-20 iterations: needed for complex stacking, vehicle chains.
- 50+: engineering simulation territory.

---

## 5. Character Controllers

### Kinematic vs Physics-Based

**Kinematic controller:**
- Directly sets position/velocity; not affected by external physics forces.
- Full control over movement; no unwanted sliding, bouncing, or jitter.
- Must implement collision detection and response manually (move-and-slide).
- Best for: platformers, action games, any game wanting snappy movement.

**Physics-based (dynamic) controller:**
- Uses a rigid body; the physics engine handles collisions automatically.
- Natural interactions with the physics world (pushable by objects, affected by explosions).
- Less precise control; requires tuning damping, friction, max velocity.
- Best for: ragdoll-heavy games, physics sandboxes, realistic simulations.

### The Floating Capsule Approach

Popularized by Toyful Games for "Very Very Valet":

1. Model the character as an upright capsule rigid body hovering slightly above the ground.
2. Cast a ray downward from the capsule to detect the ground.
3. Apply a spring force to maintain a target hover height (spring-damper on the Y axis).
4. Snap orientation upright using a torque-based spring (resist tilting).
5. Set horizontal velocity directly based on input; let the spring handle vertical positioning.

Benefits: smooth step climbing, automatic slope handling, natural ground conformity, works
on moving platforms (the spring tracks the platform surface).

### Ground Detection and Slope Handling

- Cast a ray or short shape cast downward from the character's feet.
- Compare the ground normal to a maximum walkable slope angle (typically 45-60 degrees).
- Project movement along the ground plane to prevent climbing steep slopes.
- Apply a downward force or snap when walking down slopes to prevent "staircase bouncing."

### Step Climbing and Ledge Detection

- Cast a ray forward at step height; if blocked, cast another ray from step height downward.
- If the upper ray is clear and the surface above the step is walkable, move the character up.
- Typical max step height: 0.3 - 0.5 meters.
- Ledge detection: cast downward at the character's edges to detect drop-offs.

### Movement on Moving Platforms

- Track the platform's velocity (linear + angular around the contact point).
- Add the platform's velocity contribution to the character's desired velocity.
- In the floating capsule approach, the ground spring naturally tracks the platform surface.
- For kinematic controllers, record the platform transform delta each frame and apply it.

---

## 6. Raycasting and Queries

### Query Types

| Query | Input | Output | Cost |
|---|---|---|---|
| Raycast | Origin + direction + max distance | Hit point, normal, collider | Low |
| Shape cast (sweep) | Shape + origin + direction + distance | First hit along swept volume | Medium |
| Overlap (intersection test) | Shape + position | All overlapping colliders | Medium |
| Point test | Single point | Whether point is inside any collider | Low |

### Use Cases

- **Line of sight / visibility:** Raycast from enemy to player; if it hits terrain first, no LOS.
- **Ground check:** Short raycast downward from character feet.
- **Projectile hit detection:** Raycast (hitscan) or shape cast (projectile with radius).
- **Explosion radius:** Overlap sphere query to find all bodies within blast radius.
- **Beam weapons:** Capsule or box shape cast for volumetric hit detection.
- **Interaction prompts:** Raycast from camera forward to detect interactable objects.
- **Vehicle suspension:** Raycast downward from each wheel to compute spring compression.

### Collision Filtering with Queries

Queries support the same collision layer/mask system as physics bodies:
- Specify which layers to test against.
- Exclude specific bodies (e.g., exclude the character casting the ray).
- Use collision groups to separate gameplay layers (terrain, characters, projectiles, triggers).

---

## 7. Soft Body Physics

### Mass-Spring Systems

The simplest soft body model. A mesh of particles connected by springs:

- **Structural springs:** Connect adjacent particles (maintain shape).
- **Shear springs:** Connect diagonal particles (resist shearing).
- **Bend springs:** Connect particles two apart (resist folding).

```
func spring_force(p_a, p_b, rest_length, stiffness, damping):
    var delta = p_b.position - p_a.position
    var distance = delta.length()
    var direction = delta / distance
    var stretch = distance - rest_length
    var relative_vel = p_b.velocity - p_a.velocity
    var force = (stiffness * stretch + damping * relative_vel.dot(direction)) * direction
    return force
```

Pros: Intuitive, easy to implement.
Cons: Stiffness limited by timestep (explicit integration), hard to make truly rigid.

### Position-Based Dynamics (PBD)

Instead of computing forces, PBD directly adjusts particle positions to satisfy constraints:

1. Apply external forces (gravity) to predict new positions.
2. For each constraint, project particles to satisfy it.
3. Iterate until convergence.
4. Derive velocity from position change.

```
func pbd_step(particles, constraints, dt, iterations):
    for p in particles:
        p.predicted = p.position + p.velocity * dt + gravity * dt * dt
    for i in range(iterations):
        for c in constraints:
            c.project(particles)  # Move particles to satisfy constraint
    for p in particles:
        p.velocity = (p.predicted - p.position) / dt
        p.position = p.predicted
```

Pros: Unconditionally stable, handles stiff constraints.
Cons: Stiffness depends on iteration count, not physically accurate without XPBD extension.

**XPBD** adds a compliance parameter to each constraint, making stiffness independent of
iteration count and timestep. This is the modern standard for game soft body simulation.

### Cloth Simulation

Cloth is typically a rectangular grid of particles with structural, shear, and bend constraints.
Key challenges:

- **Self-collision:** Cloth folding on itself; expensive to detect and resolve.
- **Wind:** Apply aerodynamic forces based on triangle normals and wind direction.
- **Pinning:** Fix certain particles (shoulders of a cape, top of a curtain).
- **Two-sided collision:** Prevent cloth from passing through solid objects in either direction.

### Deformable Terrain

For voxel games, terrain deformation is handled by modifying the voxel data directly rather
than using traditional soft body physics. See Section 8 for voxel-specific approaches.

---

## 8. Voxel Physics (Relevant to Chat Attack)

### Block Physics (Falling Sand, Water Flow)

**Falling blocks (gravity-affected voxels):**
- After a voxel modification, check if blocks above the edit are unsupported.
- Unsupported blocks convert to falling entities (rigid bodies or kinematic movers).
- Falling entities check for ground each tick; when they land, convert back to static voxels.

**Cellular automata for fluids:**
- Water and lava use cellular automata rules: flow to adjacent empty/lower cells.
- Each cell stores a fill level (0-7 or 0-15). Fluid tries to equalize with neighbors.
- Process in defined order (down first, then cardinal directions) to avoid simulation bias.
- Run at a lower tick rate than physics to save CPU (e.g., 4-10 Hz).

### Structural Integrity and Cascading Destruction

**Structural integrity (SI) system (e.g., 7 Days to Die):**
- Each block type has a support value (stone > wood > dirt).
- Support propagates from "ground" blocks upward, decaying with distance.
- When a supporting block is destroyed, recalculate SI for affected region.
- Blocks with zero support become falling entities -- triggers cascade.

```
func recalculate_support(destroyed_pos, max_range):
    var queue = get_neighbors(destroyed_pos)
    var visited = Set()
    var unsupported = []
    while queue.size() > 0:
        var pos = queue.pop_front()
        if pos in visited:
            continue
        visited.add(pos)
        var block = get_block(pos)
        if block.is_ground_anchored():
            continue  # This branch is safe
        var support = calculate_support_from_neighbors(pos)
        if support <= 0:
            unsupported.append(pos)
            queue.append_array(get_neighbors(pos))
    for pos in unsupported:
        convert_to_falling_entity(pos)
```

**Flood-fill connectivity check:**
- After destruction, flood-fill from the destroyed area to find connected components.
- Any component not connected to the ground becomes a falling structure.
- Can be computed asynchronously to avoid frame hitches.

### Voxel-Based Collision Shapes

Two primary approaches for voxel collision:

1. **Per-block collision:** Each solid voxel gets a box collider. Simple but very expensive for
   large worlds. Suitable for small voxel structures converted to physics objects.

2. **Greedy mesh collision:** Merge adjacent solid voxels into larger box colliders.
   Dramatically reduces collider count. Rebuild collision meshes per chunk when voxels change.

3. **Heightmap collision (terrain surface):** For terrain-like voxel worlds, extract a
   heightmap per chunk and use heightmap colliders. Very efficient for ground collision.

For Chat Attack specifically:
- Use greedy-meshed box colliders for chunk collision geometry.
- Rebuild chunk colliders on voxel edit (can be done on a background thread).
- Falling block entities use simple box colliders.
- Player collision uses a capsule against the voxel collision mesh.

---

## 9. Physics in Multiplayer

### Deterministic Physics for Lockstep

Deterministic simulation means identical inputs produce identical state on all machines.
Requirements:

- Fixed-point math or IEEE 754 compliance with identical rounding modes.
- Deterministic iteration order (no hash maps with pointer-based hashing).
- Same integration timestep on all clients.
- No floating-point nondeterminism from multithreading.

Lockstep networking: all clients simulate in sync, exchanging only inputs.
- Very bandwidth efficient.
- Input delay equals round-trip time (mitigated by input prediction / rollback).
- Used in RTS games (StarCraft, Age of Empires) and fighting games (GGPO).
- Not suitable for large open worlds with streaming (can't deterministically stream).

### Authority Models for Physics Objects

**Server-authoritative (recommended for Chat Attack):**
- Server runs the canonical physics simulation.
- Clients send inputs; server applies them, simulates, broadcasts state.
- Clients predict locally and correct on server updates (reconciliation).
- Most secure against cheating.

**Owner-authoritative:**
- The player who "owns" a physics object simulates it and sends state to others.
- Reduces server load but opens cheating vectors.
- Useful for cooperative games or non-competitive contexts.

**Hybrid:**
- Player characters are server-authoritative.
- Low-importance physics debris is owner-authoritative or purely cosmetic (client-only).
- Important objects (vehicles, siege equipment) are server-authoritative.

### Physics Prediction and Rollback

**Client-side prediction:**
1. Client applies input locally and simulates forward.
2. Server processes the same input and sends authoritative state.
3. Client compares its predicted state to server state.
4. On mismatch, client rewinds to server state and re-simulates forward with buffered inputs.

**Challenges:**
- Rolling back and re-simulating physics is expensive (all constraints must be re-solved).
- Most physics engines are not designed for state snapshot/restore.
- Rapier supports full serialization for snapshot/rollback.
- For Chat Attack: rollback is impractical for full voxel physics. Use server-authoritative
  with client-side prediction for player movement only; physics objects sync via state broadcast.

### Networking Physics State Efficiently

- **Quantization:** Compress positions to 16-bit fixed point relative to chunk origin.
- **Delta compression:** Only send changed properties.
- **Priority system:** Nearby objects update more frequently than distant ones.
- **Unreliable channel:** Use unreliable UDP for position updates (latest-state-wins).
- **Reliable channel:** Use reliable delivery for important events (block destroyed, entity spawned).
- **Interest management:** Only send physics state for objects within the client's Area of Interest.

---

## 10. Popular Physics Engines

### 2D Engines

| Engine | Language | License | Notes |
|---|---|---|---|
| Box2D | C | MIT | Industry standard 2D. Created by Erin Catto. Version 3.0 rewritten for performance. |
| Chipmunk2D | C | MIT | Lightweight, clean API. Used in Cocos2d. |
| Planck.js | JavaScript | MIT | Box2D port for web games. |

### 3D Engines

| Engine | Language | License | Notes |
|---|---|---|---|
| Bullet | C++ | zlib | Veteran engine, used in Blender and many games. Feature-rich. |
| PhysX | C++ | BSD-3 | NVIDIA. GPU acceleration, used in Unity and Unreal. Mature ecosystem. |
| Jolt | C++ | MIT | Modern, fast. Used in Horizon Forbidden West. Default in Godot 4.6. |
| Rapier | Rust | Apache 2.0 | Modern, deterministic-friendly, serializable state. Bevy integration. |
| Havok | C++ | Proprietary | Industry-leading. Used in AAA titles. Now free for game dev. |

### Godot's Built-in Physics

**GodotPhysics (3D):**
- Custom engine built into Godot. Adequate for simple scenarios.
- Known issues with stacking stability and performance at scale.
- Supports SoftBody3D (not yet available in Jolt integration).

**Jolt Physics in Godot:**
- Available as built-in option since Godot 4.4.
- Default for new 3D projects in Godot 4.6.
- Significantly better performance and stability than GodotPhysics.
- Drop-in replacement: same node types (RigidBody3D, StaticBody3D, Area3D, etc.).
- Enable in Project Settings > Physics > 3D > Physics Engine > Jolt.

**Godot 2D Physics:**
- Custom Box2D-inspired engine. Generally stable and performant for 2D use.

**For Chat Attack:** Use Jolt Physics (default in Godot 4.5+). Its superior stacking stability
and performance are critical for a voxel world with many physics interactions.

---

## 11. Performance Optimization

### Sleeping / Deactivation

Bodies at rest (velocity below threshold for several frames) are put to "sleep":
- Skip integration, collision detection, and constraint solving.
- Wake on contact with an active body, external force, or explicit code trigger.
- Dramatically reduces CPU usage in scenes with many static or resting objects.
- Critical for voxel games where most of the world is static.

### Collision Layers and Masks

Organize physics objects into layers to eliminate unnecessary checks:

| Layer | Contains | Collides with |
|---|---|---|
| 1: Terrain | Voxel chunks | Players, NPCs, Projectiles, Items |
| 2: Players | Player capsules | Terrain, NPCs, Projectiles, Items, Players |
| 3: NPCs | NPC colliders | Terrain, Players, Projectiles |
| 4: Projectiles | Bullet/arrow shapes | Terrain, Players, NPCs |
| 5: Items | Dropped item colliders | Terrain |
| 6: Triggers | Area3D zones | Players |

Reducing layer interactions from the default "everything collides with everything" can
cut broad-phase work by 50-80% in typical game scenarios.

### Physics LOD (Level of Detail)

- **Near:** Full physics simulation, all constraints, high-frequency updates.
- **Medium:** Reduced solver iterations, simplified collision shapes, lower tick rate.
- **Far:** Sleep aggressively, use AABB-only collision or disable physics entirely.
- **Out of range:** Despawn or serialize to disk.

For Chat Attack with chunk streaming, physics LOD maps naturally to chunk distance:
- Loaded chunks within player AOI: full physics.
- Edge chunks: simplified or sleeping physics.
- Unloaded chunks: no physics (state persisted in region files).

### Multithreaded Physics

Modern engines parallelize physics across cores:
- **Broad phase** can be parallelized via spatial partitioning.
- **Narrow phase** runs contact generation for independent pairs in parallel.
- **Constraint solving** is harder to parallelize (PGS is inherently sequential per island).
  - **Island splitting:** Group connected bodies into independent "islands."
  - Each island can be solved on a separate thread.
  - Jolt Physics uses a job system for parallel island solving.

**Godot threading notes:**
- Godot 4 runs physics on the main thread by default.
- `physics/common/physics_jitter_fix` can be tuned for smoother interpolation.
- Jolt in Godot leverages its internal job system for some parallelism.
- Heavy voxel collision mesh rebuilds should be done on background threads, with the
  resulting collision shape swapped in atomically on the physics thread.

### Additional Optimization Tips

- **Prefer simple shapes:** Sphere > capsule > box > convex hull > trimesh, in order of cost.
- **Limit active bodies:** Use object pooling; despawn physics debris after a timeout.
- **Batch raycasts:** Group queries and execute them together for cache efficiency.
- **Avoid small objects:** Tiny colliders cause tunneling; use swept checks or substeps instead.
- **Profile regularly:** Use Godot's built-in profiler to identify physics bottlenecks.

---

## Citations

- [Gaffer On Games - Integration Basics](https://gafferongames.com/post/integration_basics/)
- [Gaffer On Games - Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/)
- [Gaffer On Games - Collision Response and Coulomb Friction](https://gafferongames.com/post/collision_response_and_coulomb_friction/)
- [Toptal - Video Game Physics Part I: Rigid Body Dynamics](https://www.toptal.com/developers/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics)
- [Toptal - Video Game Physics Part II: Collision Detection](https://www.toptal.com/developers/game/video-game-physics-part-ii-collision-detection-for-solid-objects)
- [Toptal - Video Game Physics Part III: Constrained Rigid Body Simulation](https://www.toptal.com/game/video-game-physics-part-iii-constrained-rigid-body-simulation)
- [Allen Chou - Game Physics: Constraints & Sequential Impulse](https://allenchou.net/2013/12/game-physics-constraints-sequential-impulse/)
- [Allen Chou - Game Physics: Contact Constraints](https://allenchou.net/2013/12/game-physics-resolution-contact-constraints/)
- [GameDev.net - Understanding Constraint Resolution in Physics Engine](https://www.gamedev.net/tutorials/programming/math-and-physics/understanding-constraint-resolution-in-physics-engine-r4839/)
- [Newcastle University - Constraints and Solvers Tutorial](https://research.ncl.ac.uk/game/mastersdegree/gametechnologies/physicstutorials/8constraintsandsolvers/Physics%20-%20Constraints%20and%20Solvers.pdf)
- [Newcastle University - Collision Response Tutorial](https://research.ncl.ac.uk/game/mastersdegree/gametechnologies/physicstutorials/5collisionresponse/Physics%20-%20Collision%20Response.pdf)
- [Envato Tuts+ - Custom 2D Physics Engine: Impulse Resolution](https://code.tutsplus.com/how-to-create-a-custom-2d-physics-engine-the-basics-and-impulse-resolution--gamedev-6331t)
- [Wikipedia - Physics Engine](https://en.wikipedia.org/wiki/Physics_engine)
- [Wikipedia - Collision Response](https://en.wikipedia.org/wiki/Collision_response)
- [Wikipedia - Soft-body Dynamics](https://en.wikipedia.org/wiki/Soft-body_dynamics)
- [Grokipedia - Collision Detection](https://grokipedia.com/page/Collision_detection)
- [GarageFarm - Collision Detection in 2D and 3D](https://garagefarm.net/blog/collision-detection-in-2d-and-3d-concepts-and-techniques)
- [NVIDIA Developer - Broad-Phase Collision Detection with CUDA](https://developer.nvidia.com/gpugems/gpugems3/part-v-physics-simulation/chapter-32-broad-phase-collision-detection-cuda)
- [NVIDIA PhysX - Character Controllers](https://docs.nvidia.com/gameworks/content/gameworkslibrary/physx/guide/3.3.4/Manual/CharacterControllers.html)
- [NVIDIA PhysX - Scene Queries](https://nvidia-omniverse.github.io/PhysX/physx/5.1.0/docs/SceneQueries.html)
- [Rapier Physics - Character Controller](https://rapier.rs/docs/user_guides/rust/character_controller/)
- [Dimforge - Announcing Rapier Physics Engine](https://dimforge.com/blog/2020/08/25/announcing-the-rapier-physics-engine/)
- [Matthias Muller - Position Based Dynamics (paper)](https://matthias-research.github.io/pages/publications/posBasedDyn.pdf)
- [Procworld - Voxel Physics](http://procworld.blogspot.com/2013/12/voxel-physics.html)
- [GitHub - voxel-physics-engine](https://github.com/fenomas/voxel-physics-engine)
- [University of Akron - Implementing a C++ Voxel Game Engine with Destructible Terrain](https://ideaexchange.uakron.edu/honors_research_projects/217/)
- [Godot Docs - Using Jolt Physics](https://docs.godotengine.org/en/latest/tutorials/physics/using_jolt_physics.html)
- [GameFromScratch - Godot 4.4 Gets Native Jolt Physics Support](https://gamefromscratch.com/godot-4-4-gets-native-jolt-physics-support/)
- [GitHub - godot-jolt](https://github.com/godot-jolt/godot-jolt)
- [mas-bandwidth - Choosing the Right Network Model](https://mas-bandwidth.com/choosing-the-right-network-model-for-your-multiplayer-game/)
- [Box2D - Determinism](https://box2d.org/posts/2024/08/determinism/)
- [Coherence Docs - Determinism, Prediction and Rollback](https://docs.coherence.io/manual/advanced-topics/competitive-games/determinism-prediction-rollback)
- [Medium - Predicting Chaos: Physics-Based Multiplayer Games](https://medium.com/@yaman_15640/predicting-chaos-implementing-physics-based-multiplayer-games-with-client-side-prediction-and-d82571316d5f)
- [Unity - Enhanced Physics Performance](https://unity.com/how-to/enhanced-physics-performance-smooth-gameplay)
- [Unity Docs - Optimizing Physics Performance](https://docs.unity3d.com/560/Documentation/Manual/iphone-Optimizing-Physics.html)
- [Daily.dev - 10 Strategies to Optimize Physics in Mobile Games](https://daily.dev/blog/10-strategies-to-optimize-physics-in-mobile-games)
- [Photon Quantum - Physics Performance & Optimization](https://doc.photonengine.com/quantum/current/manual/physics/physics-performance)
- [GameDev.net - Euler, Velocity Verlet, and RK4 Integration](https://www.gamedev.net/forums/topic/645439-euler-velocity-verlet-and-rk4-integration/)
- [Wordpress - Numerical Integration in Games Development](https://jdickinsongames.wordpress.com/2015/01/22/numerical-integration-in-games-development-2/)
- [Build New Games - Broad Phase Collision Detection Using Spatial Partitioning](http://buildnewgames.com/broad-phase-collision-detection/)
- [Joe Binns - Stylised Physics Character Controller (GitHub)](https://github.com/joebinns/stylised-character-controller)
