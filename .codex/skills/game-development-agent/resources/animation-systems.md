# Animation Systems Reference

Comprehensive reference for game animation systems covering fundamentals, skeletal animation, procedural techniques, networking, and performance optimization.

---

## 1. Animation Fundamentals

### 1.1 Keyframes and Interpolation

A **keyframe** defines a property value at a specific point in time. The animation system interpolates between keyframes to produce smooth motion.

**Interpolation methods:**

| Method | Description | Use Case |
|--------|-------------|----------|
| Linear | Constant rate between keyframes | Mechanical motion, simple transitions |
| Bezier | Cubic curve with two control points | Artist-driven easing, UI animation |
| Hermite | Defined by position + tangent at each keyframe | Smooth camera paths, natural motion |
| Cubic (Catmull-Rom) | Passes through all control points | Spline-based paths, autopilot motion |

```
# Linear interpolation pseudocode
func lerp(a, b, t):
    return a + (b - a) * t

# Cubic Bezier interpolation
func cubic_bezier(p0, p1, p2, p3, t):
    u = 1.0 - t
    return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3

# Hermite interpolation
func hermite(p0, m0, p1, m1, t):
    t2 = t * t
    t3 = t2 * t
    h00 = 2*t3 - 3*t2 + 1
    h10 = t3 - 2*t2 + t
    h01 = -2*t3 + 3*t2
    h11 = t3 - t2
    return h00*p0 + h10*m0 + h01*p1 + h11*m1
```

### 1.2 Animation Curves and Easing Functions

Easing functions map a normalized time `t` in `[0, 1]` to a modified progression value, controlling the feel of motion. Common families:

- **Ease-In**: Starts slow, accelerates. `f(t) = t^n`
- **Ease-Out**: Starts fast, decelerates. `f(t) = 1 - (1-t)^n`
- **Ease-In-Out**: Slow at both ends. Combines in/out curves.
- **Back**: Overshoots the target, then settles.
- **Elastic**: Spring-like oscillation.
- **Bounce**: Simulates a bouncing ball on arrival.

```
# Common easing functions
func ease_in_quad(t):    return t * t
func ease_out_quad(t):   return t * (2.0 - t)
func ease_in_out_quad(t):
    if t < 0.5: return 2.0 * t * t
    return -1.0 + (4.0 - 2.0 * t) * t

func ease_out_elastic(t):
    if t == 0 or t == 1: return t
    return pow(2, -10 * t) * sin((t - 0.075) * TWO_PI / 0.3) + 1.0
```

### 1.3 Frame-Rate Independence and Delta Time

All animation updates must be multiplied by delta time (`dt`) to remain consistent regardless of frame rate.

```
# Frame-rate independent animation update
func _process(dt):
    elapsed += dt
    normalized_t = clamp(elapsed / duration, 0.0, 1.0)
    current_value = lerp(start, end, easing_func(normalized_t))
```

### 1.4 Playback Modes

| Mode | Behavior |
|------|----------|
| One-shot | Plays once, then stops on the last frame or resets |
| Loop | Restarts from frame 0 when it reaches the end |
| Ping-pong | Plays forward then backward in alternation |
| Reverse | Plays backward from end to start |

Speed scaling multiplies the playback rate: `effective_dt = dt * speed_scale`. Negative speed plays in reverse.

---

## 2. Sprite Animation

### 2.1 Sprite Sheets and Atlases

A **sprite sheet** packs multiple animation frames into a single texture arranged in a grid. A **texture atlas** is a more general packing of non-uniform sprites into one texture.

Benefits:
- **Fewer draw calls**: One texture bind per batch instead of per frame.
- **Reduced GPU state changes**: All sprites share one material.
- **Efficient memory**: Eliminates per-image overhead and power-of-two waste.

```
# Sprite sheet frame lookup
func get_frame_rect(sheet_width, frame_width, frame_height, frame_index):
    columns = sheet_width / frame_width
    col = frame_index % columns
    row = frame_index / columns
    return Rect2(col * frame_width, row * frame_height, frame_width, frame_height)
```

### 2.2 Frame-by-Frame Animation

The simplest form of animation: display a sequence of images at a fixed interval (e.g., 12 fps). Each frame is a hand-drawn or rendered image. The animation timer advances an index into the frame array.

```
# Frame-by-frame animation controller
var frame_index = 0
var frame_timer = 0.0
var frame_duration = 1.0 / 12.0  # 12 fps

func _process(dt):
    frame_timer += dt
    if frame_timer >= frame_duration:
        frame_timer -= frame_duration
        frame_index = (frame_index + 1) % total_frames
    sprite.region_rect = get_frame_rect(frame_index)
```

### 2.3 Sprite Animation Workflows

Common tools: Aseprite, Pyxel Edit, TexturePacker, Spine (2D skeletal). Workflow steps:
1. Author individual frames or bones in a 2D editor.
2. Export as a sprite sheet or atlas with accompanying metadata (JSON/XML).
3. Import into the engine; the animation player reads metadata to define frame regions and timing.

---

## 3. Skeletal Animation

### 3.1 Bones, Joints, and Rigging

A skeleton is a hierarchy of **bones** (transforms) connected at **joints**. Each bone stores a local transform relative to its parent. The world-space transform of any bone is the product of all ancestor transforms down to the root.

```
# Computing world-space bone transform
func compute_world_transform(bone):
    if bone.parent == null:
        return bone.local_transform
    return compute_world_transform(bone.parent) * bone.local_transform
```

**Rigging** is the process of creating the skeleton and defining how the mesh deforms with it. Key considerations:
- Place joints at natural pivot points (elbows, knees, spine segments).
- Maintain a clean hierarchy: root > hips > spine > chest > head / arms.
- Use helper bones for twist distribution (forearm twist, upper arm roll).

### 3.2 Skinning

Skinning binds each mesh vertex to one or more bones with **weights** that determine influence. When bones move, vertices follow.

**Linear Blend Skinning (LBS)** is the standard technique:

```
# Linear Blend Skinning (LBS)
func skin_vertex(vertex, bone_indices, bone_weights, bone_matrices, bind_poses):
    result = Vector3.ZERO
    for i in range(MAX_INFLUENCES):  # typically 4
        bone_idx = bone_indices[i]
        weight   = bone_weights[i]
        skinning_matrix = bone_matrices[bone_idx] * bind_poses[bone_idx].inverse()
        result += weight * (skinning_matrix * vertex)
    return result
```

LBS artifacts: "candy-wrapper" collapse at twisted joints, volume loss at bent elbows.

**Dual Quaternion Skinning (DQS)** eliminates these artifacts by blending rigid transforms (rotation + translation) in dual quaternion space. It preserves volume and prevents collapsing, at a marginally higher computation cost. Upgrading from LBS to DQS is straightforward and has negligible runtime overhead.

### 3.3 Forward Kinematics (FK) and Inverse Kinematics (IK)

**FK**: Rotating a parent bone propagates down the chain. The animator specifies each joint rotation explicitly. Gives precise artistic control but is tedious for positioning end effectors.

**IK**: Given a target position for the end effector (e.g., a hand or foot), the solver computes joint rotations automatically.

Common IK solvers:
- **Two-Bone IK**: Analytical solution for a two-joint chain (upper arm + forearm). Fast and exact.
- **CCD (Cyclic Coordinate Descent)**: Iterative; rotates each joint toward the target, cycling from tip to root. Works for arbitrary chain lengths.
- **FABRIK (Forward And Backward Reaching IK)**: Iterative position-based solver. Fast convergence, handles constraints well.

```
# Two-bone IK (analytical)
func solve_two_bone_ik(upper_length, lower_length, target_pos, root_pos):
    target_dist = (target_pos - root_pos).length()
    target_dist = clamp(target_dist, abs(upper_length - lower_length),
                        upper_length + lower_length)
    # Law of cosines for elbow angle
    cos_angle = (upper_length^2 + lower_length^2 - target_dist^2) /
                (2 * upper_length * lower_length)
    elbow_angle = acos(clamp(cos_angle, -1, 1))
    # Compute upper bone angle toward target
    cos_upper = (upper_length^2 + target_dist^2 - lower_length^2) /
                (2 * upper_length * target_dist)
    upper_angle = acos(clamp(cos_upper, -1, 1))
    return upper_angle, PI - elbow_angle

# FABRIK solver (simplified)
func fabrik(joints, target, tolerance, max_iterations):
    origin = joints[0]
    for iter in range(max_iterations):
        # Forward pass: move last joint to target, adjust backward
        joints[-1] = target
        for i in range(len(joints) - 2, -1, -1):
            dir = (joints[i] - joints[i+1]).normalized()
            joints[i] = joints[i+1] + dir * bone_lengths[i]
        # Backward pass: fix root, adjust forward
        joints[0] = origin
        for i in range(1, len(joints)):
            dir = (joints[i] - joints[i-1]).normalized()
            joints[i] = joints[i-1] + dir * bone_lengths[i-1]
        if (joints[-1] - target).length() < tolerance:
            break
    return joints
```

### 3.4 Animation Retargeting

Retargeting transfers animations from one skeleton to another with different proportions or bone counts. The process:
1. Define a **skeleton mapping** between source and target bone names/indices.
2. Extract rotations from source animation data.
3. Apply rotations to the target skeleton, adjusting bone translations by the ratio of source-to-target bone lengths.
4. Optionally apply IK post-processing to maintain foot contact or hand placement.

Retargeting modes:
- **Animation**: Use translation directly from source animation data, unchanged.
- **Skeleton**: Use the target skeleton's bind pose translation (only rotations come from animation).
- **AnimationScaled**: Scale source translation by the ratio of target bone length to source bone length.

---

## 4. Animation State Machines

### 4.1 States and Transitions

An animation state machine (ASM) organizes animations into discrete **states** (Idle, Walk, Run, Jump, Attack) connected by **transitions** with conditions.

```
# State machine structure
StateMachine:
  states:
    Idle:    animation = "idle_loop"
    Walk:    animation = "walk_cycle"
    Run:     animation = "run_cycle"
    Jump:    animation = "jump"
  transitions:
    Idle -> Walk:   condition = speed > 0.1
    Walk -> Run:    condition = speed > 5.0
    Walk -> Idle:   condition = speed < 0.1
    Run -> Walk:    condition = speed < 5.0
    Any -> Jump:    condition = is_jumping, priority = high
    Jump -> Idle:   condition = is_grounded, after_animation = true
```

Transition properties:
- **Crossfade duration**: Time to blend between outgoing and incoming animations.
- **Transition offset**: Where to start the incoming animation (0 = beginning).
- **Interruption policy**: Can higher-priority transitions cancel in-progress transitions?

### 4.2 Blend Trees

Blend trees replace a single animation with a parameterized blend of multiple animations.

**1D Blend**: Controlled by one parameter (e.g., speed). Animations are placed along a number line. The two nearest neighbors are blended by proximity.

**2D Directional**: Controlled by two parameters (e.g., speed_x, speed_y). Animations are placed at direction vectors. Uses gradient band interpolation or Delaunay triangulation to compute weights.

**2D Freeform**: Similar to directional but uses freeform cartesian placement, suitable when animations are not evenly distributed around a circle.

```
# 1D blend tree evaluation
func evaluate_1d_blend(parameter, entries):
    # entries = [(threshold, animation), ...] sorted by threshold
    for i in range(len(entries) - 1):
        if parameter <= entries[i+1].threshold:
            t = inverse_lerp(entries[i].threshold, entries[i+1].threshold, parameter)
            return blend(entries[i].animation, entries[i+1].animation, t)
    return entries[-1].animation
```

### 4.3 Animation Layers and Masks

Layers allow multiple animations to play simultaneously on different body parts:
- **Base layer**: Full-body locomotion (walk, run, idle).
- **Upper body layer**: Aiming, reloading, waving (masked to spine and above).
- **Additive layer**: Breathing, hit reactions overlaid on top of base.

A **bone mask** defines which bones a layer affects. Typically a bit-set or weight-per-bone structure.

### 4.4 Sub-State Machines

Complex states (e.g., "Combat") can contain their own internal state machine with sub-states (Idle-Combat, Light-Attack, Heavy-Attack, Block). This keeps the top-level graph clean and modular.

---

## 5. Procedural Animation

### 5.1 Procedural Walk Cycles

Instead of playing a pre-authored walk animation, procedural walk cycles compute leg motion at runtime based on velocity, terrain, and body state.

Approach:
1. Define step targets based on velocity prediction (where the foot should land next).
2. When a foot's current target is too far from the predicted target, initiate a step.
3. Interpolate the foot along an arc (lift, move, plant) using a parametric curve.
4. Use IK to position the leg chain to reach the foot target.

### 5.2 Ragdoll Physics

Ragdoll replaces animated motion with physics simulation. Each bone becomes a rigid body connected by constrained joints (hinge for elbows/knees, cone-twist for shoulders/hips).

**Active ragdoll** blends between authored animation and physics:
- Apply animation pose as target rotations on physics joints using PD controllers (proportional-derivative).
- Physics resolves collisions and external forces while trying to maintain the animated pose.
- Blend factor controls how "limp" vs. "animated" the character appears.

```
# PD controller for active ragdoll joint
func apply_joint_torque(current_rotation, target_rotation, angular_velocity, kp, kd):
    error = shortest_arc(current_rotation, target_rotation)
    torque = kp * error - kd * angular_velocity
    return torque
```

### 5.3 Spring-Damper Systems for Secondary Motion

Springs add follow-through and overlapping action (capes, hair, tails, antennas, equipment). A damped spring system models:

```
# Damped spring update (semi-implicit Euler)
func spring_update(current, target, velocity, stiffness, damping, dt):
    force = stiffness * (target - current) - damping * velocity
    velocity += force * dt
    current += velocity * dt
    return current, velocity
```

Parameters:
- **Stiffness (k)**: Higher = snappier response, lower = more lag.
- **Damping (c)**: Higher = less oscillation. Critical damping at `c = 2 * sqrt(k * mass)`.

Applications: camera follow, weapon sway, UI element bounce, cloth approximation, "jiggle" on loose parts.

### 5.4 Look-At and Aim Constraints

**Look-at** rotates a bone (typically the head or eyes) to face a world-space target. Often uses a weighted multi-bone chain (spine segments contribute partially) to avoid unnatural neck-only rotation.

**Aim constraints** orient a bone so a specified axis points toward a target, with an up-vector to prevent roll ambiguity. Used for aiming weapons, turret tracking, and eye focus.

```
# Look-at with multi-bone weight distribution
func apply_look_at(bone_chain, target, weights):
    # weights: [0.1, 0.2, 0.3, 0.4] for spine1, spine2, neck, head
    total_rotation = compute_rotation_to(bone_chain[-1].position, target)
    for i, bone in enumerate(bone_chain):
        bone.rotation *= slerp(Quaternion.IDENTITY, total_rotation, weights[i])
```

### 5.5 Foot Placement and Terrain Adaptation

IK-based foot placement prevents feet from floating above or sinking into uneven terrain:
1. Cast rays downward from each foot bone position.
2. Move the foot IK target to the hit point (plus a small offset for the sole).
3. Rotate the foot to align with the surface normal.
4. Adjust the hip height downward so the lowest foot stays planted.

```
# Foot placement with raycasting and IK
func apply_foot_ik(foot_bone, hip_bone, raycast_origin):
    hit = raycast(raycast_origin, Vector3.DOWN, max_distance)
    if hit:
        foot_target = hit.position + Vector3.UP * sole_thickness
        foot_normal = hit.normal
        ik_solver.solve(foot_bone, foot_target)
        foot_bone.align_to_normal(foot_normal)
        # Lower hips if needed
        offset = foot_bone.global_position.y - foot_target.y
        if offset > 0:
            hip_bone.global_position.y -= offset
```

---

## 6. Root Motion vs. In-Place Animation

### 6.1 In-Place Animation

The character animates on the spot; all movement is driven by gameplay code (velocity, input).

**Advantages**: Full programmatic control over speed and direction. Easy to tune movement feel independently of animation. Simpler for networked games (position driven by authoritative server).

**Disadvantages**: Risk of foot sliding if animation speed does not match character velocity. Requires careful speed-matching or foot IK to look correct.

### 6.2 Root Motion

The animation clip itself moves the root bone. The engine extracts the root's displacement each frame and applies it as character movement.

**Advantages**: Animations look perfectly grounded (no sliding). Ideal for complex authored motions (climbing, vaulting, combat combos). Collision capsule follows the visual motion.

**Disadvantages**: Less programmatic control; changing speed requires re-authoring or blending. Harder to synchronize with server-authoritative movement in multiplayer. Combining with physics-driven movement adds complexity.

### 6.3 When to Use Each

| Scenario | Recommended Approach |
|----------|---------------------|
| Locomotion (walk/run) | In-place with speed matching |
| Combat attacks, finishers | Root motion |
| Climbing, vaulting, parkour | Root motion |
| Networked player movement | In-place (server-authoritative position) |
| Cutscene choreography | Root motion |
| AI patrol/navigation | In-place (NavMesh driven) |

---

## 7. Animation Blending

### 7.1 Crossfade Blending

The most common transition: linearly interpolate all bone transforms from animation A to animation B over a duration.

```
# Crossfade blend
func crossfade(pose_a, pose_b, blend_weight):
    result_pose = new Pose()
    for each bone in skeleton:
        result_pose[bone].position = lerp(pose_a[bone].position,
                                          pose_b[bone].position, blend_weight)
        result_pose[bone].rotation = slerp(pose_a[bone].rotation,
                                           pose_b[bone].rotation, blend_weight)
        result_pose[bone].scale    = lerp(pose_a[bone].scale,
                                          pose_b[bone].scale, blend_weight)
    return result_pose
```

### 7.2 Additive Blending

An additive animation stores the **difference** from a reference pose. At runtime, this difference is added on top of any base animation, enabling layered effects like breathing, leaning, or hit reactions without authoring every combination.

```
# Creating additive animation (offline)
func make_additive(animation, reference_pose):
    additive = new Animation()
    for each frame in animation:
        for each bone:
            additive[bone].rotation = reference_pose[bone].rotation.inverse() *
                                      animation[bone].rotation
            additive[bone].position = animation[bone].position -
                                      reference_pose[bone].position
    return additive

# Applying additive at runtime
func apply_additive(base_pose, additive_pose, weight):
    for each bone:
        base_pose[bone].rotation *= slerp(Quaternion.IDENTITY,
                                          additive_pose[bone].rotation, weight)
        base_pose[bone].position += additive_pose[bone].position * weight
```

### 7.3 Partial Body Blending

Applies different animations to different body parts using bone masks. Example: lower body runs a walk cycle while upper body plays a reload animation.

The mask defines a weight per bone (0.0 = use base layer, 1.0 = use overlay layer). Intermediate values give smooth transitions at boundary bones (spine segments).

### 7.4 Pose Matching for Transitions

Rather than blending at arbitrary times, **pose matching** finds the frame in the target animation whose pose is closest to the current pose, ensuring minimal visual pop. A distance metric compares bone positions, velocities, and trajectory.

```
# Pose matching: find best entry frame
func find_best_frame(current_pose, current_velocity, target_animation):
    best_cost = INF
    best_frame = 0
    for frame in target_animation.frames:
        cost = 0.0
        for bone in key_bones:  # feet, hips, hands
            cost += (current_pose[bone].position - frame.pose[bone].position).length_sq()
            cost += (current_velocity[bone] - frame.velocity[bone]).length_sq() * vel_weight
        if cost < best_cost:
            best_cost = cost
            best_frame = frame.index
    return best_frame
```

This technique is central to **Motion Matching**, a data-driven animation system used in modern AAA games.

---

## 8. Tweening

### 8.1 Property Tweening

Tweens animate any numeric property (position, rotation, scale, color, opacity) from one value to another over time. Ideal for UI animation, camera movement, and simple gameplay effects.

```
# Basic tween structure
class Tween:
    var target_object
    var property_name
    var start_value
    var end_value
    var duration
    var elapsed = 0.0
    var easing_func = ease_linear

    func update(dt):
        elapsed += dt
        t = clamp(elapsed / duration, 0.0, 1.0)
        eased_t = easing_func(t)
        target_object.set(property_name, lerp(start_value, end_value, eased_t))
        return t >= 1.0  # returns true when complete
```

### 8.2 Sequence and Parallel Tweens

- **Sequence**: Tweens execute one after another. Useful for multi-step animations (fade in, wait, slide, fade out).
- **Parallel**: Tweens execute simultaneously. Useful for compound effects (move + rotate + scale at once).

```
# Sequence: execute tweens in order
class TweenSequence:
    var tweens = []
    var current_index = 0

    func update(dt):
        if current_index >= tweens.size(): return true
        if tweens[current_index].update(dt):
            current_index += 1
        return current_index >= tweens.size()

# Parallel: execute all tweens at once
class TweenParallel:
    var tweens = []

    func update(dt):
        all_done = true
        for tween in tweens:
            if not tween.update(dt):
                all_done = false
        return all_done
```

### 8.3 Common Tween Patterns

- **Delay**: Insert a wait step before a tween sequence begins.
- **Callback**: Fire a function when a tween completes (e.g., destroy object after fade-out).
- **Looping**: Repeat a tween or sequence indefinitely or N times.
- **Relative tweens**: Animate by a delta rather than to an absolute value.
- **Method tweens**: Call a method with an interpolated value each frame (useful for shader parameters).

---

## 9. Vertex Animation

### 9.1 Morph Targets / Blend Shapes

Morph targets store per-vertex position offsets from a base mesh. Multiple targets can be blended simultaneously with independent weights. Primary use case: facial animation (smile, blink, phonemes).

```
# Morph target blending
func apply_blend_shapes(base_mesh, targets, weights):
    result = base_mesh.copy()
    for i, target in enumerate(targets):
        for v in range(vertex_count):
            result.vertices[v] += (target.vertices[v] - base_mesh.vertices[v]) * weights[i]
    return result
```

Advantages: Precise artist control per vertex, no skeletal rig needed. Disadvantages: High memory cost (full vertex buffer per target), no procedural interpolation between uncreated shapes.

### 9.2 Vertex Animation Textures (VAT)

VAT bakes per-vertex position data into a texture where each row is a vertex and each column is a frame. The vertex shader samples this texture to reconstruct the animated position. All computation runs on the GPU.

Use cases: Crowds, destruction debris, fluid meshes, vegetation, RTS units. VAT avoids CPU skinning overhead entirely, enabling thousands of animated instances.

Limitations: No runtime blending between different VAT animations (without custom interpolation). Best for looping or sequential animations without complex transitions.

### 9.3 Cloth and Soft-Body Animation

Cloth simulation uses a mass-spring lattice or position-based dynamics (PBD) to compute vertex positions each frame. Soft bodies extend this to volumetric meshes. In games, simplified models are common:

- **Verlet integration**: Position-based, stable for cloth. Each vertex stores current and previous position; constraints enforce distance between connected vertices.
- **Skinned cloth**: Approximate cloth with extra bones driven by spring physics (lower cost, less accurate).

---

## 10. Particle Systems as Animation

### 10.1 GPU Particles

Modern particle systems run entirely on the GPU using compute shaders. Each particle stores position, velocity, lifetime, color, and size. The GPU updates millions of particles per frame in parallel.

Pipeline:
1. **Emit**: Spawn particles with initial properties (position, velocity, randomness).
2. **Update**: Apply forces (gravity, wind, turbulence), integrate velocity, age particles.
3. **Render**: Draw as billboards, mesh instances, or trail strips.

### 10.2 Trails and Ribbon Effects

Trail particles connect sequential positions into a continuous strip (ribbon). Each segment stores a position and timestamp. Old segments fade and shrink. Used for sword slashes, magic projectiles, and movement trails.

### 10.3 Common VFX Patterns

| Effect | Technique |
|--------|-----------|
| Fire | Animated sprite particles + emission over time + upward velocity + color gradient |
| Smoke | Large soft particles + turbulence noise + slow expansion + opacity fade |
| Sparks | Small bright particles + high initial velocity + gravity + short lifetime |
| Explosions | Burst emission + radial velocity + debris sub-emitters + camera shake |
| Magic spells | Orbital motion + color cycling + trail ribbons + light emission |
| Rain/snow | World-space emitter volume + downward velocity + collision with terrain |

---

## 11. Animation in Multiplayer

### 11.1 Syncing Animations Across the Network

Animation state is typically derived from replicated gameplay variables rather than syncing raw animation data. The server replicates:
- **Locomotion parameters** (speed, direction, is_crouching) from which the client animation system derives the correct state.
- **Animation triggers** (attack, jump, emote) as reliable RPCs that the client plays locally.
- **Bone overrides** (aim pitch/yaw) for look-direction, sent as compressed angles.

This approach is far more bandwidth-efficient than replicating bone transforms.

### 11.2 Prediction and Interpolation of Animations

For remote players, the client renders their state slightly in the past using **entity interpolation**:
- Buffer the two most recent snapshots from the server.
- Render at a time between these snapshots (typically 100ms behind real time).
- Linearly interpolate position, rotation, and animation parameters between snapshots.

For the local player, **client-side prediction** runs the animation state machine locally using local input, then reconciles if the server sends a correction.

```
# Entity interpolation for remote player animations
func interpolate_remote_player(snapshot_buffer, render_time):
    # Find the two snapshots that bracket render_time
    s0, s1 = find_bracketing_snapshots(snapshot_buffer, render_time)
    t = inverse_lerp(s0.timestamp, s1.timestamp, render_time)
    # Interpolate gameplay variables that drive animation
    speed     = lerp(s0.speed, s1.speed, t)
    direction = lerp_angle(s0.direction, s1.direction, t)
    position  = lerp(s0.position, s1.position, t)
    # The local animation state machine uses these interpolated values
    animation_tree.set("parameters/speed", speed)
    animation_tree.set("parameters/direction", direction)
```

### 11.3 Bandwidth-Efficient Animation Replication

Techniques to minimize animation-related bandwidth:
- **Delta compression**: Only send parameters that changed since the last update.
- **Quantization**: Compress floats to smaller bit widths (e.g., 8-bit normalized speed, 10-bit angle).
- **Interest management**: Only replicate animation data for entities within the player's area of interest.
- **Event-driven triggers**: Send one-shot animation events (attack, reload) as small RPCs instead of continuous state.
- **Prioritized updates**: Nearby entities update at higher frequency; distant entities update less often.

---

## 12. Performance Optimization

### 12.1 Animation LOD

Reduce animation complexity based on distance from the camera:

| LOD Level | Distance | Technique |
|-----------|----------|-----------|
| LOD 0 | Near (< 10m) | Full skeleton, all bones, IK, procedural effects |
| LOD 1 | Medium (10-30m) | Reduced bone set, no IK, no secondary motion |
| LOD 2 | Far (30-60m) | Half-rate animation update (every other frame) |
| LOD 3 | Very far (> 60m) | Freeze on a single pose or use simple billboard |

### 12.2 GPU Skinning

Move skinning calculations from CPU to GPU:
- Upload bone matrices as a uniform buffer or texture.
- The vertex shader multiplies each vertex by its weighted bone matrices.
- Frees the CPU for gameplay logic while the GPU handles the parallel math it excels at.

For large crowds, **compute shader skinning** processes all characters in one dispatch, writing results to a shared vertex buffer.

### 12.3 Animation Compression

Techniques to reduce animation memory footprint:
- **Keyframe reduction**: Remove keyframes that can be reconstructed within a tolerance via interpolation.
- **Quantization**: Store rotations as 48-bit "smallest three" quaternion (drop the largest component, store 3 values at 16 bits each).
- **Curve fitting**: Replace dense keyframe data with fitted curves (fewer control points).
- **ACL (Animation Compression Library)**: Industry-standard library achieving 2-10x compression with sub-millimeter error.

```
# "Smallest three" quaternion compression
func compress_quaternion(q):
    # Find the component with the largest absolute value
    max_index = argmax(abs(q.x), abs(q.y), abs(q.z), abs(q.w))
    # Drop that component (it can be reconstructed from the other 3)
    # Pack remaining 3 components into 16 bits each (range [-1/sqrt(2), 1/sqrt(2)])
    components = [q.x, q.y, q.z, q.w]
    components.remove(max_index)
    sign = sign_of(components[max_index])  # store sign to reconstruct
    packed = [quantize_to_16bit(c * sign) for c in components]
    return max_index, packed
```

### 12.4 Culling Off-Screen Animations

- **Frustum culling**: Skip animation updates for characters outside the camera frustum.
- **Occlusion culling**: Skip characters hidden behind large occluders.
- **Significance-based culling**: Assign a significance score (distance, screen size, gameplay relevance) and only update the top N most significant characters per frame.
- **Frozen pose**: When culled, hold the last computed pose rather than resetting. Resume seamlessly when the character re-enters view.

```
# Significance-based animation budgeting
func update_animations(characters, budget):
    # Sort by significance (inverse distance * screen_size * gameplay_weight)
    characters.sort_by(func(c): return -c.significance_score())
    updated = 0
    for character in characters:
        if updated >= budget:
            character.freeze_animation()
        else:
            character.update_animation(dt)
            updated += 1
```

---

## Citations

- [GarageFarm - Skeletal Animation: A Comprehensive Guide](https://garagefarm.net/blog/skeletal-animation-a-comprehensive-guide)
- [Prolific Studio - Skeletal Animation Guide for Animators & Developers](https://prolificstudio.co/blog/skeletal-animation/)
- [Pascal Walloner - Bringing Characters to Life: The Fundamentals of Skeletal Animation](https://pascalwalloner.com/posts/skeletal_animation/)
- [LearnOpenGL - Skeletal Animation](https://learnopengl.com/Guest-Articles/2020/Skeletal-Animation)
- [The Mind Studios - 3D Game Animation: Techniques & Trends](https://games.themindstudios.com/post/3d-game-animation/)
- [Godot Engine - New Animation Tree + State Machine](https://godotengine.org/article/godot-gets-new-animation-tree-state-machine/)
- [Unity Documentation - Animation Blend Trees](https://docs.unity3d.com/Manual/class-BlendTree.html)
- [Unity - Build Animator Controllers](https://unity.com/how-to/build-animator-controllers)
- [Unreal Engine Documentation - Animation Blending](https://dev.epicgames.com/documentation/en-us/unreal-engine/blending-animations-in-unreal-engine)
- [Unreal Engine Documentation - Animation Retargeting](https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-retargeting-in-unreal-engine)
- [Unreal Engine Documentation - IK Rig Animation Retargeting](https://dev.epicgames.com/documentation/en-us/unreal-engine/ik-rig-animation-retargeting-in-unreal-engine)
- [Wicked Engine - Animation Retargeting](https://wickedengine.net/2022/09/animation-retargeting/)
- [Anim Coding - Animation Tech Intro Part 3: Blending](https://animcoding.com/post/animation-tech-intro-part-3-blending/)
- [ozz-animation - Additive Blending Sample](https://guillaumeblanc.github.io/ozz-animation/samples/additive/)
- [ozz-animation - Animation Blending Sample](https://guillaumeblanc.github.io/ozz-animation/samples/blend/)
- [Alan Zucconi - An Introduction to Procedural Animations](https://www.alanzucconi.com/2017/04/17/procedural-animations/)
- [Game Developer - 8 Tips For Animating Active Ragdolls](https://www.gamedeveloper.com/design/8-tips-for-animating-active-ragdolls)
- [Generalist Programmer - Inverse Kinematics Unity Tutorial](https://generalistprogrammer.com/tutorials/inverse-kinematics-unity-complete-animation-tutorial)
- [Wikipedia - Ragdoll Physics](https://en.wikipedia.org/wiki/Ragdoll_physics)
- [RootMotion - Final IK and Grounder](http://root-motion.com/)
- [Jay Gould - Root Motion vs In-Place Motion in Unity](https://jaygould.co.uk/2022-12-20-unity-root-motion-vs-in-place-motion/)
- [Unreal Engine Forums - Root Motion vs In-Place](https://forums.unrealengine.com/t/what-is-the-difference-between-using-root-motion-and-not-when-should-we-use-it/470594)
- [Kavan et al. - Skinning with Dual Quaternions (University of Utah)](https://users.cs.utah.edu/~ladislav/kavan07skinning/kavan07skinning.html)
- [Rodolphe Vaillant - Dual Quaternion Skinning Tutorial](http://rodolphe-vaillant.fr/?e=29)
- [NVIDIA GPU Gems 3 - DirectX 10 Blend Shapes](https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-3-directx-10-blend-shapes-breaking-limits)
- [Wikipedia - Morph Target Animation](https://en.wikipedia.org/wiki/Morph_target_animation)
- [Stoyan Dimitrov - Vertex Animation Texture (VAT)](https://stoyan3d.wordpress.com/2021/07/23/vertex-animation-texture-vat/)
- [Wildlife Studios - Texture Animation: Morphing and Vertex Animation Techniques](https://medium.com/tech-at-wildlife-studios/texture-animation-techniques-1daecb316657)
- [Game Developer - Instant Game Feel: Springs Explained](https://www.gamedeveloper.com/game-platforms/instant-game-feel---springs-explained)
- [The Orange Duck - Spring-It-On: Game Developer's Spring-Roll-Call](https://theorangeduck.com/page/spring-roll-call)
- [Gaffer On Games - Spring Physics](https://gafferongames.com/post/spring_physics/)
- [Ryan Juckett - Damped Springs](https://www.ryanjuckett.com/damped-springs/)
- [Wayline - Jiggle Physics: Implementation Guide](https://www.wayline.io/blog/jiggle-physics-implementation-guide)
- [Gabriel Gambetta - Fast-Paced Multiplayer: Entity Interpolation](https://www.gabrielgambetta.com/entity-interpolation.html)
- [Valve Developer Community - Source Multiplayer Networking](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking)
- [Generalist Programmer - Game Networking Complete Multiplayer Guide 2025](https://generalistprogrammer.com/tutorials/game-networking-complete-multiplayer-guide-2025)
- [GameDev.net - Skeletal Animation Optimization Tips and Tricks](https://www.gamedev.net/articles/programming/graphics/skeletal-animation-optimization-tips-and-tricks-r3988/)
- [Wikipedia - Particle System](https://en.wikipedia.org/wiki/Particle_system)
- [Generalist Programmer - Game Particle Effects: Complete VFX Programming Guide 2025](https://generalistprogrammer.com/tutorials/game-particle-effects-complete-vfx-programming-guide-2025)
- [Pixune - Ultimate Guide to Game VFX & Particle Systems](https://pixune.com/blog/the-ultimate-guide-to-game-vfx/)
- [Unity Documentation - Visual Effect Graph](https://docs.unity3d.com/Manual/VFXGraph.html)
- [CodeAndWeb - Unity Sprite Atlas Tutorial](https://www.codeandweb.com/texturepacker/tutorials/using-spritesheets-with-unity)
- [libGDX - 2D Animation](https://libgdx.com/wiki/graphics/2d/2d-animation)
- [MDN - Animations and Tweens (Phaser)](https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_breakout_game_Phaser/Animations_and_tweens)
- [Kodeco - Tweening Animations in Unity with LeanTween](https://www.kodeco.com/27209746-tweening-animations-in-unity-with-leantween)
- [GameDev.net - Towards a Simpler, Stiffer, and more Stable Spring](https://www.gamedev.net/tutorials/programming/math-and-physics/towards-a-simpler-stiffer-and-more-stable-spring-r3227/)
