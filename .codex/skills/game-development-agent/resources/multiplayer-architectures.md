# Multiplayer Game Architectures - Comprehensive Reference

> A deep-dive reference covering network models, synchronization strategies, latency
> compensation, transport protocols, serialization, authority models, matchmaking,
> anti-cheat, infrastructure, and real-world case studies. Written for the Chat Attack
> project (multiplayer voxel factions game, Godot 4.5, ENet).

---

## Table of Contents

1. [Network Architecture Models](#1-network-architecture-models)
2. [Synchronization Strategies](#2-synchronization-strategies)
3. [Latency Compensation](#3-latency-compensation)
4. [Transport Protocols](#4-transport-protocols)
5. [Serialization and Bandwidth](#5-serialization-and-bandwidth)
6. [Authority Models](#6-authority-models)
7. [Matchmaking and Lobbies](#7-matchmaking-and-lobbies)
8. [Anti-Cheat in Multiplayer](#8-anti-cheat-in-multiplayer)
9. [Infrastructure](#9-infrastructure)
10. [Real-World Case Studies](#10-real-world-case-studies)
11. [Citations](#citations)

---

## 1. Network Architecture Models

### 1.1 Peer-to-Peer (P2P) - Full Mesh

Every player connects directly to every other player. Each client sends its state or
inputs to all other clients.

```
    Player A ---- Player B
       \            /
        \          /
         Player C
```

**Characteristics:**
- No central server required - zero hosting cost
- Latency equals direct round-trip between peers
- Bandwidth scales as O(n^2) - each peer sends to every other peer
- No single point of failure (unless a peer holds critical state)
- Extremely difficult to prevent cheating since there is no neutral authority
- NAT traversal is a major headache; many consumer routers block direct P2P

**Best for:** Small player counts (2-8), fighting games, local network games.

### 1.2 Peer-to-Peer - Star Topology (Host-Based P2P)

One player acts as the "host" (listen server). All other players connect to the host
rather than to each other.

```
    Player B ---+
                |
    Player C ---Host (Player A)
                |
    Player D ---+
```

**Characteristics:**
- Simpler than full mesh; bandwidth scales as O(n) on the host
- The host has zero latency to itself, creating an inherent advantage
- If the host disconnects, the session ends unless host migration is implemented
- The host can easily cheat since it runs the authoritative simulation
- Lower infrastructure cost (no dedicated server)

**Best for:** Cooperative games, casual multiplayer, small lobbies.

### 1.3 Client-Server (Dedicated Server)

All clients connect to a central, authoritative dedicated server. The server runs the
full game simulation, receives client inputs, processes them, and broadcasts state.

```
    Client A ---+
                |
    Client B ---Server (dedicated machine)
                |
    Client C ---+
```

**Characteristics:**
- Server is the single source of truth - strongest cheat resistance
- Consistent experience for all players (no host advantage)
- Server cost scales with player count and simulation complexity
- If the server goes down, the entire session ends
- Latency is client-to-server round-trip (not client-to-client)
- Enables sophisticated lag compensation, interest management, and anti-cheat

**Best for:** Competitive games, MMOs, any game requiring fairness and security.
**Chat Attack uses this model with ENetMultiplayerPeer.**

### 1.4 Client-Server (Listen Server / Host Migration)

A player's machine acts as both client and server. Other clients connect to it. If the
host disconnects, a migration process transfers the server role to another player.

**Host Migration Steps:**
1. Detect host disconnection
2. Elect a new host (lowest latency, highest bandwidth, or deterministic selection)
3. Serialize and transfer full game state to the new host
4. All clients reconnect to the new host
5. Resume simulation from the transferred state

**Challenges:** Migration causes a noticeable pause (typically 3-10 seconds). State
serialization must be comprehensive and tested. Race conditions during migration can
corrupt game state.

### 1.5 Relay Server / Hybrid (P2P with Relay Fallback)

Players attempt direct P2P connections via NAT punch-through (STUN/ICE). When direct
connection fails (which happens frequently depending on NAT types), traffic routes
through a relay server.

```
    Player A --[NAT]-- Relay Server --[NAT]-- Player B
                           |
    Player C --[NAT]-------+
```

**NAT Traversal Success Rates by NAT Type:**
- Full Cone to Full Cone: ~95% success
- Restricted Cone to Restricted Cone: ~80% success
- Symmetric to Symmetric: ~10% success (relay required)

**Characteristics:**
- Combines low-latency direct connections with reliable relay fallback
- Relay adds latency but guarantees connectivity
- Lower server cost than full dedicated servers (relay only forwards packets)
- Still lacks a central authority for cheat prevention

### 1.6 Cloud-Based (Server Fleet, Elastic Scaling)

Dedicated game servers run on cloud infrastructure (AWS, GCP, Azure) with orchestration
layers that spin up and shut down server instances based on demand.

**Characteristics:**
- Auto-scaling matches supply to demand, optimizing cost
- Global deployment across regions reduces latency for players worldwide
- Orchestrators (Agones, GameLift) handle allocation, health checks, scaling
- Pay-per-use pricing model
- Requires containerization and stateless server design

### 1.7 Comparison Matrix

| Factor           | Full Mesh P2P | Host P2P  | Dedicated Server | Relay/Hybrid | Cloud Fleet   |
|------------------|:------------:|:---------:|:----------------:|:------------:|:-------------:|
| Latency          | Low (direct) | Mixed     | Medium           | Medium-High  | Medium        |
| Security         | Very Poor    | Poor      | Excellent        | Poor         | Excellent     |
| Hosting Cost     | Zero         | Zero      | High             | Low-Medium   | Variable      |
| Max Players      | 2-8          | 4-16      | Hundreds+        | 4-16         | Thousands+    |
| Cheat Resistance | Very Poor    | Poor      | Excellent        | Poor         | Excellent     |
| Scalability      | Very Poor    | Poor      | Good             | Fair         | Excellent     |
| Complexity       | Medium       | Low       | High             | Medium       | Very High     |
| Fault Tolerance  | Fair         | Poor      | Single point     | Fair         | Excellent     |

---

## 2. Synchronization Strategies

### 2.1 Deterministic Lockstep

All clients run the same deterministic simulation. Only player inputs are transmitted.
The simulation advances one "step" only when inputs from all players for that step have
been received.

```
Tick N: Wait for all player inputs -> Execute tick -> Advance to Tick N+1
```

**Requirements:**
- Fully deterministic simulation (identical results on all machines)
- Floating-point determinism (or fixed-point math)
- Deterministic iteration order for collections
- Same RNG seeds across clients

**Pseudocode:**
```
func process_tick(tick_number):
    # Block until all remote inputs arrive
    while not all_inputs_received(tick_number):
        wait()

    # Apply all inputs simultaneously
    for player in players:
        apply_input(player, inputs[player][tick_number])

    # Advance simulation one step
    simulate_step()
    tick_number += 1
```

**Tradeoffs:**
- Extremely bandwidth-efficient (only inputs transmitted)
- Simulation halts if any player lags (waits for the slowest)
- Desyncs are catastrophic and hard to debug
- Scales well with entity count (inputs stay small regardless of world size)

**Used in:** RTS games (StarCraft, Age of Empires), some fighting games.

### 2.2 State Synchronization (Snapshot Interpolation)

The server captures snapshots of the complete game state at regular intervals and sends
them to clients. Clients interpolate between received snapshots to render smooth
movement.

```
Server: [Snap t=0] -> [Snap t=50ms] -> [Snap t=100ms] -> ...
Client: Interpolate between Snap(t=0) and Snap(t=50ms) at render time
```

**Key Insight:** Clients never run the simulation. They display a visual approximation
by blending between two known-good server snapshots. This means the client view is
always slightly in the past (interpolation delay = time between snapshots).

**Interpolation Delay Formula:**
```
delay = (1 / snapshot_send_rate) * buffer_size
# At 20 snapshots/sec with 3-snapshot buffer: 150ms delay
# At 60 snapshots/sec with 2-snapshot buffer: ~33ms delay
```

**Tradeoffs:**
- Simple client logic (no simulation required on client)
- Server is fully authoritative
- High bandwidth cost (full state per snapshot, mitigated by delta compression)
- Inherent visual delay due to interpolation buffer
- Does not require determinism

### 2.3 Delta Compression and State Diffing

Rather than sending full snapshots, the server sends only what changed since the last
acknowledged snapshot. This dramatically reduces bandwidth.

**Delta Encoding Process:**
```
1. Server maintains per-client "last acknowledged snapshot" baseline
2. For each new snapshot, compute diff against baseline
3. Transmit only changed fields
4. Client acknowledges received snapshots
5. Server updates baseline on acknowledgment
```

**Pseudocode:**
```
func send_delta(client, current_snapshot):
    baseline = client.last_acked_snapshot
    delta = compute_diff(baseline, current_snapshot)

    # Only send fields that changed
    packet = PacketDelta.new()
    for entity in delta.changed_entities:
        for field in entity.changed_fields:
            packet.add(entity.id, field.name, field.new_value)

    send_unreliable(client, packet)
```

**Optimization Techniques:**
- XOR-based diffing for binary state
- Per-field dirty flags on entities
- Quantization of floats (e.g., position to 1mm precision = 3 bytes per axis)
- Variable-length encoding for small deltas

### 2.4 Rollback / GGPO-Style (Input Prediction + Rollback)

The simulation runs immediately using local player input. Remote player inputs are
predicted (typically: repeat last known input). When actual remote inputs arrive, if
they differ from predictions, the simulation rolls back to the divergence point and
re-simulates forward with correct inputs.

```
Frame 1: Predict remote input, simulate
Frame 2: Predict remote input, simulate
Frame 3: Actual remote input arrives for Frame 1 - mismatch!
         -> Rollback to Frame 0 state
         -> Re-simulate Frame 1 with correct input
         -> Re-simulate Frame 2 with correct input (still predicted)
         -> Continue from Frame 3
```

**Requirements:**
- Fast save/restore of game state (snapshot per frame)
- Deterministic simulation (re-simulation must match)
- Ability to re-simulate multiple frames within one real frame
- Visual correction smoothing to hide rollback artifacts

**Pseudocode:**
```
func process_frame():
    save_state(current_frame)
    predicted_input = predict_remote_input()
    apply_inputs(local_input, predicted_input)
    simulate()

    # When actual input arrives
    if actual_input != predicted_input_for(frame_n):
        restore_state(frame_n)
        for f in range(frame_n, current_frame):
            apply_inputs(get_input(f))
            simulate()
```

**Tradeoffs:**
- Zero perceived input latency for local player
- Remote players appear slightly incorrect during mispredictions
- CPU-intensive (must re-simulate multiple frames on misprediction)
- Excellent for low player counts with fast-paced gameplay

**Used in:** Fighting games (GGPO SDK), Rocket League (modified), action games.

### 2.5 Command/Input-Based Sync

Clients send commands (inputs, actions) to the server. The server validates and
executes them, then broadcasts the resulting state. A hybrid of lockstep thinking
(send inputs) with client-server authority (server validates).

**Message Flow:**
```
Client -> Server: [MoveForward, Tick=42, Duration=16ms]
Server: Validate movement, apply physics, update state
Server -> All Clients: [Player1 position = (x,y,z), Tick=42]
```

This is the model Overwatch uses: clients send controller inputs, the server has full
authority over what happens.

### 2.6 Interest Management (Area of Interest - AOI)

Determines which updates are relevant to which clients, sending only information the
player needs. This is critical for games with large worlds and many entities.

**Common Approaches:**

**Grid-Based AOI:**
```
# Divide world into cells
# Player receives updates from entities in nearby cells only
func get_relevant_entities(player):
    player_cell = world_to_cell(player.position)
    relevant = []
    for dx in range(-AOI_RADIUS, AOI_RADIUS + 1):
        for dz in range(-AOI_RADIUS, AOI_RADIUS + 1):
            cell = (player_cell.x + dx, player_cell.z + dz)
            relevant.append_array(entities_in_cell(cell))
    return relevant
```

**Distance-Based AOI:**
- Simple radius check from player position
- Can use spatial data structures (octree, k-d tree) for fast queries

**Hybrid AOI:**
- Combine grid-based with priority weighting
- Nearby entities: full update rate (e.g., 20 Hz)
- Medium distance: reduced rate (e.g., 5 Hz)
- Far away: minimal updates (e.g., 1 Hz) or only major events

**Chat Attack Relevance:** The game uses AOI chunk streaming and delta sync, making
grid-based AOI aligned with the 16x16 chunk claim system.

### 2.7 Priority-Based Replication

Not all entities are equally important. A priority system determines which entities
get bandwidth first.

**Priority Factors:**
- Distance from player (closer = higher priority)
- Visibility (in view frustum = higher priority)
- Velocity/acceleration (fast-moving entities need more updates)
- Gameplay importance (enemies > decorations)
- Time since last update (stale entities get priority boost)

```
func calculate_priority(entity, observer):
    priority = 0.0
    priority += 1.0 / max(distance(entity, observer), 1.0)  # Distance
    priority += 2.0 if is_in_frustum(entity, observer)       # Visibility
    priority += entity.velocity.length() * 0.1               # Movement
    priority += entity.gameplay_priority                      # Importance
    priority += (now - entity.last_sent_time) * 0.5           # Staleness
    return priority
```

---

## 3. Latency Compensation

### 3.1 Client-Side Prediction

The client immediately applies its own inputs locally without waiting for server
confirmation, giving the illusion of zero-latency response. Originating from
QuakeWorld (1996), this technique is now standard.

```
func _process_input(input):
    # Apply immediately on client
    apply_movement(input)

    # Also send to server
    send_to_server(input, current_tick)

    # Store in prediction history for reconciliation
    prediction_history.append({tick: current_tick, input: input, state: get_state()})
```

**What to Predict:**
- Player movement (position, velocity)
- Weapon firing effects (muzzle flash, tracers)
- Ability activations (visual feedback)

**What NOT to Predict:**
- Hit confirmation (server decides hits)
- Inventory changes (server authoritative)
- Score changes
- Other players' actions

### 3.2 Server Reconciliation

When the server's authoritative state arrives, the client compares it against its
prediction history. If there is a discrepancy, the client "rewinds" to the server
state and replays all unacknowledged inputs.

```
func on_server_state_received(server_state, server_tick):
    # Find the prediction we made for this tick
    prediction = find_prediction(server_tick)

    if prediction and state_differs(prediction.state, server_state):
        # Mismatch! Rewind to server state
        set_state(server_state)

        # Replay all inputs after server_tick
        for entry in prediction_history.after(server_tick):
            apply_movement(entry.input)

    # Remove old predictions
    prediction_history.remove_before(server_tick)
```

**Smoothing Corrections:** Rather than snapping to corrected position (jarring), blend
over several frames:
```
visual_position = lerp(visual_position, actual_position, correction_speed * delta)
```

### 3.3 Entity Interpolation

Other players' positions are displayed by interpolating between two known server
snapshots. This shows remote entities slightly in the past but with perfectly smooth
movement.

```
func interpolate_entity(entity, render_time):
    # render_time is typically: server_time - interpolation_delay
    snap_before = find_snapshot_before(render_time)
    snap_after = find_snapshot_after(render_time)

    if snap_before and snap_after:
        t = inverse_lerp(snap_before.time, snap_after.time, render_time)
        entity.visual_position = lerp(snap_before.position, snap_after.position, t)
        entity.visual_rotation = slerp(snap_before.rotation, snap_after.rotation, t)
```

**Interpolation Delay:** Typically 2-3 snapshot intervals. At 20 snapshots/sec, this
means 100-150ms of visual delay for remote entities.

### 3.4 Lag Compensation (Server-Side Rewinding)

When the server processes a player's shot, it rewinds other players' positions to
where they were at the time the shooting player saw them. This accounts for the
shooter's latency.

**Valve's Source Engine Implementation:**
```
func process_shot(shooter, shot_data):
    # Calculate when the shooter saw the world
    rewind_time = current_time - shooter.latency

    # Rewind all players to their positions at rewind_time
    saved_positions = {}
    for player in players:
        saved_positions[player] = player.position
        player.position = get_historical_position(player, rewind_time)

    # Perform hit detection against rewound positions
    hit_result = raycast(shot_data.origin, shot_data.direction)

    # Restore current positions
    for player in players:
        player.position = saved_positions[player]

    return hit_result
```

**Maximum Rewind Window:** Typically capped at 200-1000ms to prevent extreme exploitation
by high-latency players. Valve's Source engine keeps one second of position history.

**The Tradeoff:** Lag compensation favors the shooter (what you see is what you hit) but
can cause victims to feel hit "around corners" or after reaching cover, since the
server used their past position.

### 3.5 Input Buffering and Delay-Based Netcode

Rather than predicting, inputs are intentionally delayed by a fixed number of frames to
allow remote inputs to arrive before they are needed.

```
INPUT_DELAY = 3  # frames

func queue_input(input):
    # Input is scheduled for execution 3 frames in the future
    input_buffer[current_frame + INPUT_DELAY] = input
    send_to_remote(input, current_frame + INPUT_DELAY)

func process_frame():
    if input_buffer.has(current_frame):
        apply_input(input_buffer[current_frame])
    simulate()
```

**Tradeoffs:**
- Simpler than rollback (no re-simulation needed)
- Adds constant input latency (INPUT_DELAY * frame_time)
- If remote input arrives late, simulation must pause
- Traditional fighting game approach before GGPO adoption

### 3.6 Jitter Buffers

Network packets arrive with variable timing (jitter). A jitter buffer smooths this
by holding packets for a short duration before processing.

```
func receive_packet(packet):
    jitter_buffer.insert(packet, packet.timestamp)

func process_packets():
    # Only process packets that have been buffered long enough
    target_time = current_time - JITTER_BUFFER_DURATION
    while jitter_buffer.has_packet_before(target_time):
        packet = jitter_buffer.pop_oldest()
        process(packet)
```

**Adaptive Jitter Buffers:** Dynamically adjust buffer size based on observed jitter.
Low jitter = smaller buffer = lower latency. High jitter = larger buffer = smoother
playback.

---

## 4. Transport Protocols

### 4.1 TCP vs UDP Tradeoffs

| Aspect               | TCP                         | UDP                          |
|----------------------|:---------------------------:|:----------------------------:|
| Delivery guarantee   | Guaranteed, ordered         | None                         |
| Head-of-line blocking| Yes (major problem)         | No                           |
| Connection overhead  | 3-way handshake             | None (connectionless)        |
| Congestion control   | Built-in (can be aggressive)| None (application handles)   |
| Packet overhead      | 20+ bytes header            | 8 bytes header               |
| Use case             | Chat, login, downloads      | Game state, movement, voice  |

**Why TCP is bad for real-time games:** If packet N is lost, TCP blocks delivery of
packets N+1, N+2, etc. until packet N is retransmitted and received. For a game running
at 60 ticks/sec, a single lost packet stalls all subsequent updates, causing a visible
hitch. This is head-of-line blocking.

**Rule of thumb:** Use TCP (or reliable-ordered UDP) for infrequent, critical data
(login, chat, inventory transactions). Use unreliable UDP for frequent, time-sensitive
data (position updates, input commands).

### 4.2 Reliable UDP Libraries

**ENet (used by Godot via ENetMultiplayerPeer):**
- Provides reliable, unreliable, and sequenced packet delivery
- Multiple independent channels (avoids cross-channel head-of-line blocking)
- Automatic packet fragmentation and reassembly
- Built-in bandwidth throttling and flow control
- Mean latency ~26ms; performs well under normal conditions
- Lightweight C library, easy to integrate
- Used extensively in Godot's multiplayer system

**KCP (Fast and Reliable ARQ Protocol):**
- Reduces average latency by 30-40% vs TCP
- Reduces maximum latency by up to 3x
- Trades 10-20% more bandwidth for lower latency
- Excellent performance under high packet loss
- Configurable retransmission strategies

**Valve GameNetworkingSockets:**
- Open-source library from Valve (used in Steam networking)
- Reliable and unreliable messages over UDP
- Built-in encryption (uses libsodium)
- P2P networking with NAT traversal via Steam relay network
- Robust message fragmentation and reassembly

**LiteNetLib:**
- .NET reliable UDP library
- Supports reliable ordered, reliable unordered, sequenced, and unreliable channels
- Automatic MTU discovery
- Connection management with disconnect detection

### 4.3 WebRTC for Browser Games

WebRTC provides peer-to-peer UDP communication in browsers, including:
- Data channels (SCTP over DTLS) for game data
- Built-in NAT traversal via ICE, STUN, and TURN
- Encryption by default
- Supports both reliable and unreliable data channels

**Limitations:** Complex signaling setup, higher overhead than raw UDP, browser-only.

### 4.4 WebSocket for Web-Based Games

WebSocket provides full-duplex TCP communication over HTTP:
- Works through firewalls and proxies (upgrades from HTTP)
- Supported by all browsers
- Lower overhead than HTTP polling
- Still subject to TCP head-of-line blocking

**Best for:** Turn-based games, social/casual games, chat systems, lobby management.

### 4.5 QUIC for Modern Game Networking

QUIC is a UDP-based transport protocol (standardized as HTTP/3) with properties
interesting for games:
- Stream multiplexing without head-of-line blocking between streams
- Built-in encryption (TLS 1.3)
- 0-RTT connection establishment
- Unreliable datagram extension for game state
- Better congestion control than TCP

**Current Status:** Promising but not yet widely adopted for game networking. The
unreliable datagram extension addresses the key limitation. Several game studios are
experimenting with QUIC.

---

## 5. Serialization and Bandwidth

### 5.1 Serialization Format Comparison

| Format       | Encoding  | Zero-Copy | Schema | Size Overhead | Decode Speed |
|-------------|:---------:|:---------:|:------:|:-------------:|:------------:|
| JSON        | Text      | No        | No     | Very High     | Slow         |
| MessagePack | Binary    | No        | No     | Medium        | Fast         |
| Protobuf    | Binary    | No        | Yes    | Low           | Fast         |
| FlatBuffers | Binary    | Yes       | Yes    | Very Low      | Very Fast    |
| Cap'n Proto | Binary    | Yes       | Yes    | Very Low      | Very Fast    |
| Custom      | Binary    | Yes       | N/A    | Minimal       | Fastest      |

**For real-time games:** Custom binary serialization with no field markers yields the
smallest messages. A joystick input message might be 16 bytes custom vs 52+ bytes in
JSON.

**FlatBuffers advantage:** Zero-copy deserialization means you can access fields
directly from the network buffer without allocating memory. With 10,000 entities, you
can read entity X without touching the other 9,999.

### 5.2 Bit Packing and Quantization

**Bit Packing:** Write values using the minimum number of bits required.

```
# Instead of sending a full 32-bit float for health (0-100):
func write_health(buffer, health):
    buffer.write_bits(int(health), 7)  # 7 bits = 0-127, covers 0-100

# Instead of 32-bit float for angle (0-360):
func write_angle(buffer, angle):
    quantized = int(angle / 360.0 * 65535)
    buffer.write_bits(quantized, 16)  # 16 bits for 0.005 degree precision
```

**Position Quantization:**
```
# Full precision: 3 floats * 32 bits = 96 bits = 12 bytes
# Quantized to 1mm in a 4096m world:
#   4,096,000 values per axis = 22 bits per axis
#   3 axes * 22 bits = 66 bits = ~9 bytes (25% savings)

func quantize_position(pos, world_size, bits_per_axis):
    scale = (1 << bits_per_axis) / world_size
    return Vector3i(
        int(pos.x * scale),
        int(pos.y * scale),
        int(pos.z * scale)
    )
```

### 5.3 Bandwidth Budgets and Throttling

**Typical Bandwidth Budgets:**
- Per-client upstream: 8-32 Kbps (inputs + commands)
- Per-client downstream: 32-128 Kbps (state updates)
- Voice chat: 16-64 Kbps per speaker

**Throttling Strategies:**
- Token bucket: Smooth out burst traffic
- Leaky bucket: Enforce strict average rate
- Priority queue: High-priority data (hits, deaths) sent first
- Adaptive rate: Reduce send rate when bandwidth is congested

### 5.4 Variable-Rate Replication

Different entities replicate at different rates based on importance:

```
func get_replication_rate(entity, observer):
    dist = distance(entity.position, observer.position)
    if dist < 10.0:
        return 60  # 60 Hz for very close entities
    elif dist < 50.0:
        return 20  # 20 Hz for nearby entities
    elif dist < 200.0:
        return 5   # 5 Hz for distant entities
    else:
        return 1   # 1 Hz for very far entities (or skip entirely)
```

---

## 6. Authority Models

### 6.1 Server-Authoritative (Full)

The server runs the complete simulation. Clients are "dumb terminals" that send inputs
and receive state. No client-side simulation at all.

**Pros:** Maximum cheat resistance, simplest consistency model.
**Cons:** All actions feel laggy (full round-trip), high server CPU cost.
**Used when:** Security is paramount and latency tolerance is high (turn-based, MMO
crafting/inventory).

### 6.2 Server-Authoritative with Client Prediction

The server is authoritative, but clients predict their own movement locally. Server
reconciliation corrects mispredictions. This is the gold standard for most real-time
multiplayer games.

```
# Client side
func _physics_process(delta):
    var input = gather_input()
    apply_movement_locally(input)          # Prediction
    send_input_to_server(input, tick)      # Server will validate
    store_prediction(tick, get_state())    # For reconciliation

# Server side
func _process_client_input(peer_id, input, tick):
    if validate_input(input):              # Anti-cheat check
        apply_movement(peer_id, input)
    broadcast_state(tick)                  # Send authoritative state
```

**Chat Attack uses this model.** The server validates all game actions while clients
predict their own movement for responsiveness.

### 6.3 Client-Authoritative (with Validation)

Clients report their own state (e.g., position), and the server validates it against
plausibility checks rather than re-simulating.

```
# Server validation pseudocode
func validate_client_position(client, reported_pos):
    max_speed = 10.0  # units per second
    dt = time_since_last_update(client)
    max_distance = max_speed * dt * 1.1  # 10% tolerance

    if distance(client.last_pos, reported_pos) > max_distance:
        reject_and_correct(client)
        flag_for_review(client)
    else:
        accept_position(client, reported_pos)
```

**Pros:** Lower server CPU (no physics simulation), lower latency for clients.
**Cons:** Vulnerable to sophisticated cheats that stay within validation bounds.
**Used when:** Physics simulation is too expensive server-side (many objects, complex
physics).

### 6.4 Distributed Authority / Ownership Transfer

Authority over objects is distributed across clients. Each client owns certain entities
and is authoritative for them. Ownership can transfer dynamically.

**Ownership Transfer Triggers:**
- Player interacts with an object (picks up, drives vehicle)
- Player enters proximity of unowned objects
- Load balancing across clients
- Player disconnects (orphaned entities redistributed)

```
func on_player_interact(player, object):
    if object.owner != player:
        request_ownership_transfer(object, player)

func transfer_ownership(object, new_owner):
    old_owner = object.owner
    # Freeze object briefly during transfer
    object.freeze()
    # Transfer state snapshot to new owner
    send_state(object, new_owner)
    object.owner = new_owner
    object.unfreeze()
```

**Limitation:** Not suitable for competitive games requiring precise fairness since
the owning client has an inherent advantage.

### 6.5 Physics Authority

A specific pattern for physics-heavy games where simulating all physics on the server
is too expensive.

**Approaches:**
- **Server-authoritative physics:** Server runs full physics, clients interpolate.
  Accurate but CPU-intensive on server.
- **Owner-authoritative physics:** The client that "owns" an object simulates its
  physics and reports results. Other clients interpolate.
- **Hybrid:** Server simulates important objects (players, vehicles), clients simulate
  less important objects (debris, particles).

---

## 7. Matchmaking and Lobbies

### 7.1 Skill-Based Matchmaking (SBMM) Algorithms

**Elo Rating System:**
- Originally designed for chess (two-player, win/loss)
- Rating updated based on expected vs actual outcome
- Simple formula: `new_rating = old_rating + K * (actual - expected)`
- K-factor controls sensitivity (higher K = faster rating change)
- Does not handle teams or free-for-all directly

**Glicko / Glicko-2:**
- Extends Elo with a "rating deviation" (confidence interval)
- Inactive players' confidence decreases over time
- More accurate for players with few games
- Still limited to two-player scenarios

**TrueSkill (Microsoft):**
- Designed for Xbox Live matchmaking
- Models skill as a Gaussian distribution (mean + uncertainty)
- Supports teams, free-for-all, and multiplayer formats
- Converges faster than Elo (fewer games to determine skill)
- TrueSkill 2 (2018) incorporates play statistics and behavior data

**Matchmaking Quality Metrics:**
```
func evaluate_match_quality(teams):
    skill_spread = max_skill - min_skill
    predicted_draw_probability = calculate_draw_prob(teams)

    # Higher draw probability = more even match
    # Lower skill spread = tighter skill range
    return {
        fairness: predicted_draw_probability,
        tightness: 1.0 / (1.0 + skill_spread),
        queue_time: time_in_queue  # Balance fairness vs wait time
    }
```

### 7.2 Session-Based vs Persistent World

**Session-Based:**
- Discrete matches with defined start/end (Battle Royale, FPS rounds)
- Matchmaking finds or creates new sessions
- State is ephemeral within a session
- Easier to scale (stateless between sessions)

**Persistent World:**
- Continuous game world that exists regardless of player presence (MMOs)
- Players log in/out of an ongoing simulation
- State must be durable and consistent
- Harder to scale (world state must be maintained)

**Chat Attack is hybrid:** Persistent voxel world with session-like factions and raids.

### 7.3 Lobby Systems and Party Management

**Lobby Lifecycle:**
```
1. Player creates or joins a lobby
2. Lobby fills (matchmaking or invites)
3. Ready check (all players confirm)
4. Server allocation (request game server)
5. Connection handoff (lobby -> game server)
6. Game begins
```

**Party System Considerations:**
- Party members should always be on the same team
- Party skill = weighted average or highest member skill
- Cross-region parties require region negotiation
- Party chat persists across lobbies and game sessions

### 7.4 Region Selection and Ping-Based Routing

```
func select_region(player):
    ping_results = {}
    for region in available_regions:
        ping_results[region] = measure_ping(player, region)

    # Select region with lowest ping
    best_region = min(ping_results, key=ping_results.get)

    # Or let player override with preference
    if player.preferred_region:
        return player.preferred_region
    return best_region
```

**Multi-Region Matchmaking:** Search for matches in the best region first. If queue
time exceeds threshold, expand to nearby regions.

---

## 8. Anti-Cheat in Multiplayer

### 8.1 Server-Side Validation Patterns

The fundamental principle: never trust the client. The server must validate or
re-simulate every critical action.

**Validation Categories:**
```
# Movement validation
func validate_movement(player, claimed_position, dt):
    max_speed = get_max_speed(player)  # Account for buffs, terrain
    max_distance = max_speed * dt * TOLERANCE
    actual_distance = distance(player.last_valid_pos, claimed_position)

    if actual_distance > max_distance:
        return REJECT  # Speed hack detected
    if not is_valid_terrain(claimed_position):
        return REJECT  # Noclip detected
    if claimed_position.y > player.last_valid_pos.y + MAX_JUMP:
        return REJECT  # Fly hack detected
    return ACCEPT

# Action rate validation
func validate_action_rate(player, action_type):
    cooldown = get_cooldown(action_type)
    last_action = player.last_action_time[action_type]
    if now - last_action < cooldown * 0.95:  # 5% tolerance
        return REJECT  # Action speed hack
    return ACCEPT
```

### 8.2 Movement Validation and Speed Hack Detection

**Approach:** Maintain a server-side movement model. Compare client-reported positions
against what is physically possible.

**Checks:**
- Maximum distance per tick (speed cap)
- Gravity compliance (no flying without flight ability)
- Collision compliance (no walking through walls)
- Teleportation detection (sudden position changes)
- Acceleration limits (no instant direction changes)

### 8.3 Aimbot / Wallhack Mitigation

**Aimbot Detection:**
- Track angular velocity of aim (inhuman snap speeds)
- Statistical analysis of reaction times (too consistent = suspicious)
- Analyze aim trajectories (aimbots often lack natural curves)
- Machine learning on aim patterns (training on known cheaters)

**Wallhack Mitigation via Interest Management:**
- Do not send entity positions to clients unless the entity could be perceived
- Use server-side visibility checks (raycasts) before including entities in updates
- Only send audio cues for entities within audible range
- This is a server-side solution; the client never receives hidden data

```
func should_replicate(entity, observer):
    if not in_aoi(entity, observer):
        return false
    # Optional: PVS (Potentially Visible Set) check
    if not is_potentially_visible(entity, observer):
        return false
    return true
```

### 8.4 Economic Exploit Prevention

Critical for Chat Attack's economy system:

```
# Atomic transactions with invariant checks
func process_purchase(player, item, quantity):
    var total_cost = item.price * quantity

    # Pre-condition checks
    assert(player.balance >= total_cost, "Insufficient funds")
    assert(quantity > 0, "Invalid quantity")
    assert(item.is_available(), "Item unavailable")

    # Atomic transaction
    db.begin_transaction()
    try:
        db.debit(player.id, total_cost)
        db.add_item(player.id, item.id, quantity)
        db.append_ledger(player.id, "PURCHASE", item.id, quantity, total_cost)
        db.commit()
    except:
        db.rollback()
        return ERROR

    # Post-condition: verify currency conservation
    assert(get_total_currency_in_system() == EXPECTED_TOTAL)
```

**Key Patterns:**
- Idempotent transactions (retry-safe with transaction IDs)
- Append-only audit ledger for all economic actions
- Server-side price lookup (never trust client-reported prices)
- Rate limiting on transactions (prevent automated arbitrage)
- Double-spend prevention via sequential processing per player

### 8.5 Rate Limiting and Flood Protection

```
# Token bucket rate limiter
class RateLimiter:
    var tokens: float
    var max_tokens: float
    var refill_rate: float  # tokens per second
    var last_refill_time: float

    func try_consume(cost: float = 1.0) -> bool:
        refill()
        if tokens >= cost:
            tokens -= cost
            return true
        return false  # Rate limited

    func refill():
        var now = Time.get_unix_time_from_system()
        var elapsed = now - last_refill_time
        tokens = min(max_tokens, tokens + elapsed * refill_rate)
        last_refill_time = now
```

**Rate Limit Categories:**
- Movement commands: 60-128 per second (match tick rate)
- Chat messages: 1-3 per second
- Economy transactions: 1-5 per second
- Block edits (voxel): 10-30 per second (Chat Attack specific)
- Login attempts: 3-5 per minute

### 8.6 Replay / Audit Systems

Record all inputs and critical events for post-game review:

```
# Append-only event log
func log_event(event_type, player_id, data):
    var entry = {
        timestamp: Time.get_unix_time_from_system(),
        tick: current_tick,
        type: event_type,
        player: player_id,
        data: data,
        checksum: compute_checksum(data)
    }
    audit_log.append(entry)
```

**Uses:**
- Post-game cheat review (replay suspicious moments)
- Economic auditing (trace currency flow)
- Grief investigation (who placed/destroyed blocks, when)
- Bug reproduction
- Chat Attack's rollback system for voxel grief mitigation

---

## 9. Infrastructure

### 9.1 Dedicated Server Hosting Options

**Bare Metal:**
- Highest performance, lowest per-unit cost at scale
- No virtualization overhead
- Long provisioning times (hours to days)
- No elasticity
- Best for: Large studios with predictable, steady load

**Cloud VMs (EC2, Compute Engine, Azure VMs):**
- Quick provisioning (minutes)
- Pay-per-use pricing
- Variety of instance types optimized for compute/memory
- Spot/preemptible instances for 60-90% cost savings (with interruption risk)
- Best for: Variable load, global distribution

**Containers (Docker, Kubernetes):**
- Fast startup (seconds)
- High density (many game servers per host)
- Easy to version, deploy, and rollback
- Orchestration via Kubernetes + Agones
- Best for: Session-based games with many short-lived servers

### 9.2 Game Server Orchestration

**Agones (Google, open-source, Kubernetes-native):**
- Creates, manages, and scales dedicated game server processes on Kubernetes
- GameServer CRD (Custom Resource Definition) for server lifecycle
- Fleet management for groups of ready servers
- Autoscaling based on buffer size (maintain N ready servers)
- Works on any cloud or on-premises Kubernetes cluster
- Integrates with GameLift FleetIQ for Spot instance reliability

**AWS GameLift:**
- Fully managed game server hosting by AWS
- FleetIQ for intelligent Spot instance management
- Built-in matchmaking (FlexMatch)
- Global reach with multi-region deployment
- Vendor lock-in to AWS ecosystem

**Unity Multiplay:**
- Managed hosting for Unity-based games
- Integrated with Unity services (Relay, Lobby, Matchmaker)
- Auto-scaling and global deployment

### 9.3 Scaling Strategies

**Horizontal Scaling:**
```
# Each game server handles one match/session
# Scale by adding more server instances

[Load Balancer / Matchmaker]
    |
    +-- Game Server 1 (Match A, 64 players)
    +-- Game Server 2 (Match B, 64 players)
    +-- Game Server 3 (Match C, 64 players)
    +-- ... (spin up more as needed)
```

**Auto-Scaling Triggers:**
- Ready server buffer falls below threshold -> scale up
- Ready server buffer exceeds threshold -> scale down
- CPU utilization across fleet
- Player queue length / matchmaking wait time

**Session-Based Scaling:**
- Each match is independent; servers can be allocated and released freely
- Pre-warm pools of ready servers to minimize allocation latency
- Drain and terminate idle servers after a cooldown period

### 9.4 Database Patterns for Game State

**Choosing Consistency Level:**
- **Strong consistency** (critical data): Player inventory, currency, claims, faction
  membership. Use ACID transactions (PostgreSQL, MySQL, Spanner).
- **Eventual consistency** (non-critical): Leaderboards, statistics, social feeds.
  Use Redis, DynamoDB, or Cassandra for high throughput.

**Sharding Strategies:**
- **Player-based sharding:** Shard by player ID for player-specific data
- **Geographic sharding:** Shard by world region for spatial data (voxel chunks)
- **Functional sharding:** Separate databases for economy, claims, chat, analytics

**Hot Path Optimization:**
```
# In-memory cache for hot data, async flush to database
class GameStateCache:
    var cache: Dictionary = {}
    var dirty_keys: Array = []
    var flush_interval: float = 5.0  # seconds

    func get(key):
        return cache.get(key)

    func set(key, value):
        cache[key] = value
        dirty_keys.append(key)

    func flush():
        for key in dirty_keys:
            database.write_async(key, cache[key])
        dirty_keys.clear()
```

**Chat Attack Database Design:**
- Voxel data: Region files on disk (like Minecraft's Anvil format)
- Claims/factions: Relational database with strong consistency
- Economy ledger: Append-only table with ACID guarantees
- Player state: Cached in memory, flushed periodically to database

---

## 10. Real-World Case Studies

### 10.1 Overwatch (Blizzard, 2016)

**Architecture:** Client-server with dedicated servers, ECS-based simulation.

**Key Decisions:**
- Clients send only controller inputs; server has full authority
- Entity Component System (ECS) architecture for gameplay variety
- 63 tick/sec server simulation (later updated)
- Deterministic simulation enables speculative execution
- Favor-the-shooter lag compensation with server-side rewinding
- Netcode uses client-side prediction + server reconciliation

**GDC Insight:** Overwatch leverages determinism to achieve responsiveness by allowing
the client to predict ahead confidently, correcting only when predictions diverge.

### 10.2 Rocket League (Psyonix, 2015)

**Architecture:** Client-server with physics prediction and rollback.

**Key Decisions:**
- Full physics simulation on both client and server
- Client predicts not just local player but also other players and the ball
- When misprediction detected, rollback and re-simulate from corrected state
- Input decay: older inputs are weighted less in prediction
- Server runs at 120 ticks/sec for physics accuracy
- Uses UE4's built-in networking with custom extensions

**GDC Insight (Jared Cone, 2018):** The core challenge was synchronizing multiple
physics simulations across the internet. Rocket League solves this by treating physics
as a deterministic function of inputs and performing rollback correction.

### 10.3 Valorant (Riot Games, 2020)

**Architecture:** Client-server with 128-tick dedicated servers.

**Key Decisions:**
- 128 tick/sec server rate (double most competitors at the time)
- Proprietary anti-cheat (Vanguard) running at kernel level
- Server-side hit validation with lag compensation
- Minimal client authority (server authoritative for nearly everything)
- Global server infrastructure in 15+ data centers
- Peeker's advantage mitigated through netcode optimizations

**Design Philosophy:** Competitive integrity above all; the 128-tick rate and
aggressive server authority minimize the gap between what players see and what happens.

### 10.4 Minecraft (Mojang, 2011)

**Architecture:** Client-server with chunk-based world streaming.

**Key Decisions:**
- World divided into 16x16x(world height) chunks
- Server streams chunks to clients based on proximity
- Three chunk loading tiers: fully ticked, entity-ticking, lazy
- 20 tick/sec server simulation (50ms per tick)
- Each loaded chunk consumes 50-100KB RAM (more with entities)
- View distance controls chunk loading radius per player
- Client-side prediction for block placement (with server validation)

**Relevance to Chat Attack:** Minecraft's chunk loading architecture is directly
analogous to Chat Attack's 16x16 claim chunks and AOI chunk streaming. Key lessons:
prioritize chunk loading for the direction the player is moving, unload chunks
aggressively to manage memory, and use different update rates for different chunk tiers.

### 10.5 EVE Online (CCP Games, 2003)

**Architecture:** Single-shard with per-solar-system sharding and time dilation.

**Key Decisions:**
- Single universe for all players (no separate servers per region)
- World sharded by solar system; each runs on a server node
- Multiple solar systems per node, hot systems get dedicated nodes
- When a system is overloaded (large fleet battle), Time Dilation kicks in
- Time Dilation slows simulation to as low as 10% speed (1 real second = 0.1 game
  seconds), keeping all clients in sync rather than dropping players
- Central database nucleus with everything emanating from it
- Thousands of concurrent players in a single battle via TiDi

**Lessons:** When you cannot scale processing, slow down time. This preserves game
integrity and fairness at the cost of real-time responsiveness. Not suitable for
twitch gameplay but ingenious for strategic games.

### 10.6 Fortnite (Epic Games, 2017)

**Architecture:** Client-server with Unreal Engine replication, cloud-scaled.

**Key Decisions:**
- 100-player Battle Royale on dedicated servers
- Unreal Engine's built-in replication with relevancy system
- Server runs at 30 tick/sec (lower than competitive shooters)
- Priority-based replication: nearby players > distant players
- Interest management: players outside rendering range receive minimal updates
- AWS-based infrastructure with global deployment
- Building/destruction system requires efficient state sync

---

## Citations

### Architecture and Models
- [Peer-to-Peer vs Client-Server Architecture - Hathora](https://blog.hathora.dev/peer-to-peer-vs-client-server-architecture/)
- [Mastering Multiplayer Game Architecture - Getgud.io](https://www.getgud.io/blog/mastering-multiplayer-game-architecture-choosing-the-right-approach/)
- [Unity Realtime Multiplayer: Game Network Topologies - MY.GAMES](https://medium.com/my-games-company/unity-realtime-multiplayer-part-6-game-network-topologies-f99c412f8497)
- [Choosing the Right Network Model - mas-bandwidth](https://mas-bandwidth.com/choosing-the-right-network-model-for-your-multiplayer-game/)
- [Multiplayer Networking Resources - GitHub](https://github.com/0xFA11/MultiplayerNetworkingResources)
- [Game Networking Demystified - Ruoyu Sun](https://ruoyusun.com/2019/03/28/game-networking-1.html)
- [Relay Servers for Multiplayer Games - Edgegap](https://edgegap.com/blog/what-are-relays-servers-for-multiplayer-games-a-peer-to-peer-networking-guide)
- [Host Migration Analysis - Edgegap](https://edgegap.com/blog/host-migration-in-peer-to-peer-or-relay-based-multiplayer-games)
- [Networking Models - Fish-Net Documentation](https://fish-networking.gitbook.io/docs/guides/high-level-overview/networking-models)

### Synchronization and Rollback
- [GGPO - Rollback Networking SDK](https://www.ggpo.net/)
- [Determinism, Prediction and Rollback - coherence Docs](https://docs.coherence.io/manual/advanced-topics/competitive-games/determinism-prediction-rollback)
- [Netcode Architectures Part 2: Rollback - SnapNet](https://www.snapnet.dev/blog/netcode-architectures-part-2-rollback/)
- [Online Multiplayer the Hard Way - Game Developer](https://www.gamedeveloper.com/blogs/online-multiplayer-the-hard-way)
- [Distributed Authority Topologies - Unity](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.5/manual/terms-concepts/distributed-authority.html)
- [Physics Authority Transfer - coherence Docs](https://docs.coherence.io/0.10/learning-coherence/first-steps-tutorial/2-physics-authority-transfer)

### Latency Compensation
- [Client-Side Prediction and Server Reconciliation - Gabriel Gambetta](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html)
- [Entity Interpolation - Gabriel Gambetta](https://www.gabrielgambetta.com/entity-interpolation.html)
- [Lag Compensation - Gabriel Gambetta](https://www.gabrielgambetta.com/lag-compensation.html)
- [Latency Compensating Methods - Valve Developer Community](https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization)
- [Source Multiplayer Networking - Valve Developer Community](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking)
- [Dealing with Latency - Unity Netcode for GameObjects](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.7/manual/learn/dealing-with-latency.html)
- [Client-Side Prediction - Wikipedia](https://en.wikipedia.org/wiki/Client-side_prediction)

### State Synchronization
- [Snapshot Interpolation - Gaffer On Games](https://gafferongames.com/post/snapshot_interpolation/)
- [State Synchronization - Gaffer On Games](https://gafferongames.com/post/state_synchronization/)
- [Snapshot Compression - Gaffer On Games](https://gafferongames.com/post/snapshot_compression/)
- [Networked Physics - Gaffer On Games](https://gafferongames.com/categories/networked-physics/)
- [Reading and Writing Packets - Gaffer On Games](https://gafferongames.com/post/reading_and_writing_packets/)

### Transport Protocols
- [QUIC as Game Networking Protocol - Daposto](https://daposto.medium.com/quic-for-gamenetworking-46cf23936228)
- [Reliable UDP Protocol - MY.GAMES](https://medium.com/my-games-company/unity-realtime-multiplayer-part-3-reliable-udp-protocol-94fbffe8c72c)
- [ENet Features and Architecture](http://enet.bespin.org/Features.html)
- [GameNetworkingSockets - Valve (GitHub)](https://github.com/ValveSoftware/GameNetworkingSockets)
- [TCP vs UDP - HAProxy](https://www.haproxy.com/blog/choosing-the-right-transport-protocol-tcp-vs-udp-vs-quic)
- [Multiplayer in Godot 4.0: Channels - Godot Engine](https://godotengine.org/article/multiplayer-changes-godot-4-0-report-2/)

### Serialization
- [Benchmarking JSON vs Protobuf vs FlatBuffers](https://medium.com/@harshiljani2002/benchmarking-data-serialization-json-vs-protobuf-vs-flatbuffers-3218eecdba77)
- [FlatBuffers in .NET - GameDev.net](https://www.gamedev.net/blogs/entry/2259791-flatbuffers-in-net/)
- [Reading and Writing Packets - Gaffer On Games](https://gafferongames.com/post/reading_and_writing_packets/)

### Interest Management
- [Interest Management for MOGs - Dynetis](https://www.dynetisgames.com/2017/04/05/interest-management-mog/)
- [Interest Management - Mirror Networking](https://mirror-networking.gitbook.io/docs/manual/interest-management)
- [Area of Interest in MMOGs - SpringerLink](https://link.springer.com/10.1007/978-3-319-08234-9_239-1)

### Matchmaking
- [TrueSkill Ranking System - Microsoft Research](https://www.microsoft.com/en-us/research/project/trueskill-ranking-system/)
- [TrueSkill - Wikipedia](https://en.wikipedia.org/wiki/TrueSkill)
- [Skill-Based Matchmaking for Competitive Games - Yuksel](http://www.cemyuksel.com/research/matchmaking/i3d2024-matchmaking.pdf)

### Anti-Cheat
- [How Game Developers Detect and Stop Cheating - Amol Bhalerao](https://medium.com/@amol346bhalerao/how-game-developers-detect-and-stop-cheating-in-real-time-0aa4f1f52e0c)
- [Cheating in Online Games - Wikipedia](https://en.wikipedia.org/wiki/Cheating_in_online_games)
- [Advanced Aimbot Detection System - Maddy Miller](https://madelinemiller.dev/blog/the-4-year-late-postmortem-of-an-advanced-aimbot-detection-system/)

### Infrastructure
- [Agones - Dedicated Game Server Hosting on Kubernetes](https://agones.dev/site/)
- [Agones Overview Documentation](https://agones.dev/site/docs/overview/)
- [Agones on GitHub - Google](https://github.com/googleforgames/agones)
- [Dedicated Game Server Hosting - Andres Romero](https://www.andresromero.dev/blog/dedicated-game-server-hosting)
- [GameLift FleetIQ Adapter for Agones - AWS](https://aws.amazon.com/blogs/gametech/introducing-the-gamelift-fleetiq-adapter-for-agones/)

### Database and Persistence
- [Spanner Gaming Database Best Practices - Google Cloud](https://docs.google.com/spanner/docs/best-practices-gaming-database)
- [Redis Game State Management](https://oneuptime.com/blog/post/2026-01-21-redis-game-state-management/view)
- [Eventual Consistency in MMO Databases - GameDev.net](https://www.gamedev.net/forums/topic/690749-eventual-consistency-in-an-mmoish-game-database-structure/)

### Case Studies and GDC Talks
- [Overwatch Gameplay Architecture and Netcode - GDC Vault](https://www.gdcvault.com/play/1024001/-Overwatch-Gameplay-Architecture-and)
- [It IS Rocket Science! The Physics of Rocket League - GDC 2018 (PDF)](https://media.gdcvault.com/gdc2018/presentations/Cone_Jared_It_Is_Rocket.pdf)
- [Valorant 128-Tick Servers Discussion - Gaming Bolt](https://gamingbolt.com/valorant-developer-discusses-128-tick-servers-netcode-in-new-video)
- [EVE Online Single-Shard Architecture - Engadget](https://www.engadget.com/2010-08-10-a-look-into-the-nuts-and-bolts-of-eve-onlines-single-shard-arch.html)
- [Introducing Time Dilation - EVE Online](https://www.eveonline.com/news/view/introducing-time-dilation-tidi)
- [7 Ways EVE Online Scales - High Scalability](https://highscalability.com/7-sensible-and-1-really-surprising-way-eve-online-scales-to/)
- [Awesome Game Networking - GitHub](https://github.com/rumaniel/Awesome-Game-Networking)
