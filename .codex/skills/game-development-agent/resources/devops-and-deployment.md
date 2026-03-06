# Game DevOps & Deployment

Comprehensive reference for build pipelines, server infrastructure, matchmaking, persistence, LiveOps, monitoring, distribution, security, and cost management in multiplayer game development.

---

## Build Pipelines

### CI/CD for Game Projects

Game CI/CD differs from typical software pipelines due to large binary assets, platform-specific export requirements, and the need for headless rendering or GPU access during testing.

**GitHub Actions** is the most common choice for indie and mid-size studios. Key actions for Godot:

- **godot-ci** (`abarichello/godot-ci`) -- Docker image for headless Godot exports. Supports GitHub Actions and GitLab CI with deployment targets including GitHub Pages, GitLab Pages, and itch.io.
- **setup-godot** -- Installs Godot 4.x on macOS, Windows, or Linux runners with optional export template installation.
- **godot-export** -- Reads `export_presets.cfg` automatically and runs each defined export.

```yaml
# .github/workflows/build.yml -- Godot 4.x multi-platform export
name: Build & Export
on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  export:
    runs-on: ubuntu-latest
    container:
      image: barichello/godot-ci:4.5
    strategy:
      matrix:
        preset: [Windows, Linux, Web, Android]
    steps:
      - uses: actions/checkout@v4
      - name: Setup export templates
        run: |
          mkdir -p ~/.local/share/godot/export_templates/4.5.stable
          mv /root/.local/share/godot/export_templates/4.5.stable/* \
             ~/.local/share/godot/export_templates/4.5.stable/
      - name: Export ${{ matrix.preset }}
        run: godot --headless --export-release "${{ matrix.preset }}" build/${{ matrix.preset }}/game
      - uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.preset }}
          path: build/${{ matrix.preset }}/
```

**GitLab CI** provides built-in Docker registry and artifact management. Godot-ci Docker images work identically.

**Jenkins** remains common in large studios with on-premises build farms, particularly when GPU-accelerated build steps (shader compilation, lightmap baking) are required.

### Godot Export Workflows and Headless Builds

Godot's export system has three components:

1. **Export Presets** -- Project-specific configuration in `export_presets.cfg` defining platform settings, permissions, signing credentials, and build options.
2. **Export Templates** -- Pre-compiled Godot engine binaries for each target platform.
3. **Platform Export Classes** -- Engine classes that orchestrate packaging per platform.

Headless export command:
```bash
# Debug export
godot --headless --export-debug "Windows Desktop" build/windows/game.exe

# Release export
godot --headless --export-release "Linux" build/linux/game.x86_64

# Pack-only (no executable, just .pck)
godot --headless --export-pack "Web" build/web/game.pck
```

Environment variables override export preset settings in CI/CD, enabling secure credential management without secrets in project files:
```bash
export GODOT_ANDROID_KEYSTORE_RELEASE_PATH=/secrets/release.keystore
export GODOT_ANDROID_KEYSTORE_RELEASE_USER=mykey
export GODOT_ANDROID_KEYSTORE_RELEASE_PASSWORD=$ANDROID_KEYSTORE_PASS
```

### Automated Testing in Pipelines

Layer testing in CI/CD:

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit | GUT / GdUnit4 | Logic, math, state machines |
| Integration | GUT + scenes | System interaction, signals, RPCs |
| Visual Regression | screenshot comparison | UI layout, shader output |
| Smoke | headless scene launch | Startup crashes, resource loading |

```yaml
# Run GUT tests headlessly
- name: Run unit tests
  run: godot --headless -s addons/gut/gut_cmdln.gd -gdir=res://tests/ -gexit
```

### Asset Pipeline

Asset processing in CI/CD typically follows this flow:

```
Raw Assets (PSD, FBX, WAV)
  -> Import (Godot .import, format conversion)
    -> Process (texture compression, mesh LOD, audio encode)
      -> Compress (ASTC/ETC2 for mobile, BC for desktop)
        -> Package (.pck or per-platform archive)
```

For large projects, use Git LFS or a dedicated asset storage (S3, Perforce) to keep the repository manageable. The `.godot/imported/` directory is generated and should be in `.gitignore`.

### Multi-Platform Builds

Godot export targets and their outputs:

| Platform | Output | Notes |
|----------|--------|-------|
| Windows | `.exe` + `.pck` | Optional code signing with signtool |
| Linux | `.x86_64` + `.pck` | AppImage packaging optional |
| macOS | `.app` bundle | Notarization required for distribution |
| Android | `.apk` / `.aab` | Requires keystore, AAB for Play Store |
| iOS | Xcode project | Must build on macOS runner |
| Web | `.html` + `.wasm` + `.pck` | Requires HTTPS for SharedArrayBuffer |

Use a build matrix in CI to parallelize platform exports. iOS builds require a macOS runner with Xcode.

### Build Caching and Incremental Builds

Strategies to speed up CI:

- **Docker layer caching** -- Cache the Godot installation and export templates layer.
- **Actions cache** -- Cache `.godot/imported/` between runs for faster reimport.
- **Artifact reuse** -- Export `.pck` once, combine with per-platform template executables.

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.local/share/godot/export_templates
      .godot/imported
    key: godot-${{ hashFiles('project.godot') }}-${{ hashFiles('export_presets.cfg') }}
```

### Version Numbering and Release Management

Common schemes for games:

- **SemVer** (`MAJOR.MINOR.PATCH`) -- Best for libraries and APIs. Used for engine plugins and mods.
- **CalVer** (`YYYY.MM.PATCH`) -- Good for live-service games with regular update cadence.
- **Marketing Version + Build Number** -- e.g., `1.2.0+437` where `1.2.0` is player-facing and `437` is the internal build counter.

Pre-release identifiers: `-alpha`, `-beta`, `-rc.1`. Build metadata after `+` (e.g., `+build.437`).

Automate version bumping with commit conventions:
```bash
# In CI, extract version from git tag
VERSION=$(git describe --tags --abbrev=0)
# Inject into Godot project
sed -i "s/config\/version=.*/config\/version=\"$VERSION\"/" project.godot
```

---

## Dedicated Server Infrastructure

### Server Architecture Patterns

**Single Persistent World Server**
One authoritative server process manages the entire game world. All players connect to the same instance. Suitable for small-to-medium player counts (under 200 CCU). Simple to reason about but limited in scalability.

```
[Players] ---> [Single Game Server] ---> [Database]
```

**Instanced World Servers (Shards)**
The world is divided into independent instances. Each shard runs a separate server process handling a subset of the world or a separate match. Typical for MMOs (zone-based) and session-based games (lobby -> match).

```
[Players] ---> [Gateway/Router]
                  |--- [Shard A: Zone 1]
                  |--- [Shard B: Zone 2]
                  |--- [Shard C: Match 47]
                  └--- [Shard D: Match 48]
               All shards ---> [Shared Database Cluster]
```

**Microservice Architecture**
Game functionality is decomposed into independent services that communicate via message queues or gRPC:

```
[API Gateway]
   |--- [Auth Service]         (JWT issuance, platform login)
   |--- [Matchmaking Service]  (queue management, skill matching)
   |--- [Chat Service]         (rooms, DMs, moderation)
   |--- [Economy Service]      (transactions, inventory)
   |--- [Game Session Service] (server allocation, lifecycle)
   |--- [Analytics Service]    (event ingestion, processing)
   └--- [Dedicated Game Servers] (actual gameplay simulation)
```

Key patterns: API Gateway for unified entry point, Event-Driven communication via message brokers (NATS, RabbitMQ, Kafka), Circuit Breaker for resilience, Service Mesh (Istio/Linkerd) for observability and traffic management.

### Containerization with Docker

Docker is the standard for packaging game servers. A typical Dockerfile for a Godot dedicated server:

```dockerfile
FROM ubuntu:24.04 AS runtime
RUN apt-get update && apt-get install -y libx11-6 libgl1 && rm -rf /var/lib/apt/lists/*

COPY build/linux-server/game.x86_64 /app/game
COPY build/linux-server/game.pck /app/game.pck

EXPOSE 7777/udp
EXPOSE 7778/tcp

WORKDIR /app
ENTRYPOINT ["./game", "--headless", "--server"]
```

```bash
docker build -t game-server:v1.2.0 .
docker run -d -p 7777:7777/udp -p 7778:7778/tcp game-server:v1.2.0
```

### Orchestration

**Kubernetes + Agones (Open Source)**

Agones is an open-source platform built on Kubernetes specifically for hosting, scaling, and orchestrating dedicated game servers. It extends Kubernetes with custom resource definitions (CRDs) for game server lifecycle management.

Key Agones concepts:
- **GameServer** -- A single game server pod with SDK integration for health checks and state reporting.
- **Fleet** -- A set of warm GameServers ready to be allocated.
- **FleetAutoscaler** -- Automatically adjusts Fleet size based on demand.
- **Allocation** -- Reserves a GameServer from the Fleet for a match.

```yaml
# agones-fleet.yaml
apiVersion: agones.dev/v1
kind: Fleet
metadata:
  name: game-server-fleet
spec:
  replicas: 5
  scheduling: Packed  # or Distributed
  template:
    spec:
      ports:
        - name: default
          containerPort: 7777
          protocol: UDP
      template:
        spec:
          containers:
            - name: game-server
              image: gcr.io/my-project/game-server:v1.2.0
              resources:
                requests:
                  memory: "512Mi"
                  cpu: "500m"
                limits:
                  memory: "1Gi"
                  cpu: "1000m"
---
apiVersion: autoscaling.agones.dev/v1
kind: FleetAutoscaler
metadata:
  name: game-server-autoscaler
spec:
  fleetName: game-server-fleet
  policy:
    type: Buffer
    buffer:
      bufferSize: 3
      minReplicas: 2
      maxReplicas: 50
```

The Agones SDK is integrated into the game server code to report readiness, health, and shutdown:
```gdscript
# Pseudo-code for Agones SDK integration via HTTP
func _ready():
    # Tell Agones this server is ready for players
    var http = HTTPRequest.new()
    add_child(http)
    http.request("http://localhost:9358/ready", [], HTTPClient.METHOD_POST)

func _on_health_timer_timeout():
    http.request("http://localhost:9358/health", [], HTTPClient.METHOD_POST)

func _on_match_complete():
    http.request("http://localhost:9358/shutdown", [], HTTPClient.METHOD_POST)
```

**AWS GameLift**

Managed service for deploying, operating, and scaling dedicated game servers. Key features:
- FleetIQ for intelligent Spot Instance placement (up to 70% cost savings).
- FlexMatch for built-in matchmaking.
- Auto-scaling to/from zero instances (added January 2026).
- Multi-region fleet management with game session queues.
- Target-based auto-scaling on `PercentAvailableGameSessions`.

**Azure PlayFab Multiplayer Servers**

Dynamic game server hosting on Azure infrastructure:
- Container-based deployment with Windows and Linux support.
- Scale from 100 to 10,000,000+ players, pay-per-use.
- Free tier: 750 compute hours for evaluation.
- Standard plan: $99/month + consumption.
- New AMD Dasv4 VMs offer 5-40% better price-performance.

**Google Cloud Game Servers (Agones-managed)**

Google's managed Agones service on GKE. Provides multi-cluster fleet management across regions with a unified API.

**Multiplay (Unity)**

Unity's game server hosting, integrated with the Unity ecosystem. Supports container-based game servers with global deployment.

### Auto-Scaling Strategies

**Player Count-Based Scaling**
Scale server fleet based on connected players or active game sessions. Agones Buffer policy keeps N spare servers warm.

**Queue-Based Scaling**
Monitor matchmaking queue depth. When queue wait times exceed thresholds, spin up additional servers. Works well with Kubernetes HPA and custom metrics.

**Predictive Scaling**
Use historical data to anticipate demand:
- Time-of-day patterns (peak hours in each timezone).
- Day-of-week patterns (weekends higher).
- Event-driven spikes (patch day, tournaments, holidays).

AWS GameLift target-based scaling example:
```
Target: PercentAvailableGameSessions = 25%
(Keep 25% of game session slots available as buffer)
```

### Server Fleet Management

**Health Checking and Restart Policies**
- Liveness probes detect frozen/crashed servers.
- Readiness probes indicate when a server is accepting players.
- Agones SDK health pings confirm the game loop is running.
- Kubernetes restart policies: `Always`, `OnFailure`, `Never`.

**Rolling Updates and Zero-Downtime Deploys**
Use Kubernetes rolling update strategy to replace servers gradually:
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
```
For game servers, drain active sessions before terminating old pods. Never kill a server mid-match.

**A/B Testing and Canary Deployments**
Run two Fleet versions simultaneously. Route a percentage of new allocations to the canary Fleet. Monitor error rates and player feedback before promoting.

---

## Matchmaking

### Matchmaking Algorithms

**Elo Rating**
Originally designed for chess. Models win probability from rating difference. Updates after each game: winner gains points, loser loses points proportional to the upset factor. Simple but limited to 1v1.

**Glicko-2**
Improves on Elo with two additional parameters:
- **Ratings Deviation (RD)** -- Confidence in the rating (decreases with more games).
- **Volatility (sigma)** -- How much the player's true skill fluctuates.

Ideal for games where players have variable activity levels. Used by Lichess, Team Fortress 2, Splatoon.

**TrueSkill / TrueSkill 2**
Microsoft's Bayesian ranking system designed for Xbox Live:
- Supports any number of teams and players per team.
- Models skill as a Gaussian distribution (mu, sigma).
- Handles free-for-all, team, and asymmetric game modes.
- TrueSkill 2 adds per-match performance tracking and handles unbalanced teams better.

**OpenSkill (Weng-Lin)**
Open-source alternative to TrueSkill that avoids patent restrictions. Similar Bayesian approach with team support. Libraries available in Rust, Python, JavaScript, and Elixir.

### Queue-Based Matchmaking

Standard flow:
```
Player joins queue -> Ticket created with skill, latency, preferences
  -> Matchmaker pools tickets
    -> Match function evaluates pools against rules
      -> Match found -> Allocate server -> Connect players
      -> No match -> Widen criteria over time (relaxation)
```

Ticket relaxation: gradually loosen skill range, latency requirements, and party size constraints as wait time increases.

### Skill Brackets and Divisions

Visible rank tiers (Bronze, Silver, Gold, etc.) mapped to hidden MMR ranges. Promotion/demotion matches at tier boundaries. Placement matches (typically 5-10) for new accounts to seed initial MMR.

### Party/Group Matchmaking

- Use the highest-skilled member's MMR or a weighted average for matching.
- Enforce maximum party skill spread to prevent boosting.
- Prioritize matching parties against similar-sized parties.
- Solo queue option for players who want to avoid premade groups.

### Backfill Systems

When a player disconnects mid-match:
1. Hold the slot briefly for reconnection.
2. If timeout expires, create a backfill ticket.
3. Matchmaker finds a replacement with similar skill.
4. New player joins the in-progress match.

### Custom Matchmaking

Private lobbies with join codes, tournament brackets with seeded matchups, custom game modes with modified rulesets. These bypass the standard queue and directly allocate servers.

### Matchmaking Services

**AWS GameLift FlexMatch**
Rule-based matchmaking with JSON rule sets. Supports skill-based matching, latency-based matching, team composition rules, and backfill. Algorithm: pools tickets, batches them, sorts by age, builds matches from oldest ticket. Customizable via rule set definitions:
```json
{
  "name": "skill-based-2v2",
  "ruleLanguageVersion": "1.0",
  "teams": [{
    "name": "team",
    "maxPlayers": 2,
    "minPlayers": 2
  }],
  "rules": [{
    "name": "SkillRange",
    "type": "distance",
    "measurements": ["teams[*].players.attributes[skill]"],
    "referenceValue": 100,
    "maxDistance": 200
  }],
  "expansions": [{
    "target": "rules[SkillRange].maxDistance",
    "steps": [
      {"waitTimeSeconds": 10, "value": 300},
      {"waitTimeSeconds": 20, "value": 500}
    ]
  }]
}
```

**Google Open Match**
Open-source matchmaking framework with three components:
- **Frontend API** -- Game clients submit and query tickets.
- **Backend API** -- Game servers request matches and receive assignments.
- **Match Function** -- Custom logic (deployed as a service) evaluates tickets against profiles and returns matches.

Can run on any Kubernetes cluster including alongside Agones.

---

## Database and Persistence

### Polyglot Persistence Pattern

Modern games use multiple database technologies optimized for specific workloads:

```
[PostgreSQL]  -- Player accounts, economy, transactions (ACID)
[MongoDB]     -- Player progression, achievements, flexible schemas
[Redis]       -- Sessions, leaderboards, caching, matchmaking pools
[InfluxDB]    -- Metrics, analytics, time-series telemetry
[S3/MinIO]    -- Player-generated content, world backups, replays
```

### Player Data Storage Patterns

- **Account data** (auth, profile, settings) -- Relational DB, strong consistency.
- **Inventory/economy** -- Relational DB with transactions, append-only ledger for auditing.
- **Game progress** (levels, quests, achievements) -- Document DB for flexible schema evolution.
- **Session state** (active server, party, status) -- Redis with TTL expiration.
- **Social graph** (friends, faction membership) -- Relational or graph DB.

### Game State Persistence

**Save/Load Pattern**
Serialize world state to a structured format (JSON, MessagePack, Protobuf). Store in object storage (S3) with metadata in the database. Version the save format to support migrations.

**Checkpointing**
Periodically snapshot world state (every 1-5 minutes). On crash recovery, reload the last checkpoint and replay the event log from that point. Balance checkpoint frequency vs. I/O cost.

**Event Sourcing**
Store all state changes as an append-only event log. Reconstruct state by replaying events. Enables time-travel debugging, rollback, and audit trails. Pairs well with voxel edit logging.

### Database Choices

**PostgreSQL (Relational)**
Best for: player accounts, economy, transactions, faction metadata.
- ACID transactions for financial operations.
- JSON/JSONB columns for semi-structured data.
- Row-level security for multi-tenant isolation.
- pg_cron for scheduled jobs (daily rewards, decay).

**MongoDB (Document)**
Best for: player progression, achievements, game configuration.
- Flexible schemas adapt to feature changes without migrations.
- Horizontal scaling via built-in sharding.
- Change streams for reactive updates.

**Redis (Key-Value / In-Memory)**
Best for: sessions, leaderboards, caching, rate limiting, pub/sub.
- Sorted sets for leaderboards with O(log N) rank lookups.
- Pub/Sub or Streams for real-time messaging between services.
- TTL-based expiration for session tokens.
- Lua scripting for atomic multi-step operations.

```bash
# Redis leaderboard example
ZADD leaderboard 1500 "player:42"
ZREVRANK leaderboard "player:42"    # Get rank (0-indexed)
ZREVRANGE leaderboard 0 9 WITHSCORES  # Top 10
```

**InfluxDB / TimescaleDB (Time-Series)**
Best for: server metrics, player analytics, event telemetry.
- Efficient storage and querying of timestamped data.
- Retention policies auto-delete old data.
- Continuous queries for real-time aggregation.

### Sharding Strategies

- **Player ID hash sharding** -- Distribute players evenly across database shards by hashing their ID. Simple and uniform but cross-shard queries are expensive.
- **Region/zone sharding** -- One shard per game world region. Good locality but uneven load.
- **Faction-based sharding** -- Co-locate faction members on the same shard for efficient queries. Rebalance when factions grow/shrink.

### Backup and Disaster Recovery

- **Streaming replication** -- PostgreSQL primary -> standby replicas with async or sync replication.
- **Point-in-time recovery (PITR)** -- WAL archiving enables restore to any second.
- **Cross-region replicas** -- DR copies in a different cloud region.
- **Regular backup testing** -- Automated restore drills (weekly) to verify backup integrity.
- **RTO/RPO targets** -- For multiplayer games: RPO < 1 minute, RTO < 5 minutes for critical services.

Failover types:
- **Hot standby** -- Replica is live and in sync, near-instant failover.
- **Warm standby** -- Replica is running but slightly behind, seconds to failover.
- **Cold standby** -- Backup must be restored, minutes to hours of downtime.

### Data Migration Strategies

- Use versioned migration scripts (Flyway, Alembic, golang-migrate).
- Always support forward and backward compatibility for at least one version.
- Run migrations during maintenance windows for schema-breaking changes.
- Use feature flags to toggle between old and new data paths during migration.

---

## Authentication and Accounts

### Auth Providers

| Platform | Auth Method | Token Type |
|----------|-------------|------------|
| Steam | Steamworks API / Auth Tickets | Encrypted App Ticket |
| Epic | Epic Online Services (EOS) | OAuth 2.0 / JWT |
| PlayStation | PSN Auth | Platform token |
| Xbox | Xbox Live / PlayFab | XSTS token |
| Google Play | Play Games Services | OAuth 2.0 |
| Apple | Sign in with Apple | JWT |
| Custom | Email/password, username | JWT / session |

### JWT and Session Management

Standard flow for game authentication:
```
Client -> Platform Auth (Steam, Epic, etc.)
  -> Receives platform token
    -> Sends token to game backend
      -> Backend validates with platform API
        -> Issues game-specific JWT
          -> Client uses JWT for all game API calls
```

JWT best practices:
- Short-lived access tokens (15-60 minutes).
- Refresh tokens for session continuity (7-30 days).
- Include player ID, faction, roles in claims.
- Validate signature server-side on every request.
- Rotate signing keys periodically.

### Cross-Platform Identity Linking

Allow players to link multiple platform accounts to a single game identity:
```
Game Account (UUID: abc-123)
  ├── Steam ID: 76561198xxxxx
  ├── Epic Account ID: xyz-456
  └── PlayStation Network ID: player_name
```

Handle conflicts when two already-existing game accounts try to link to the same platform. Offer merge UI or require the player to choose which progression to keep.

### Guest Accounts and Upgrade Paths

1. Generate a temporary guest account on first launch (device-bound UUID).
2. Store progression locally and server-side.
3. Prompt to link a platform account before allowing multiplayer.
4. On linking, merge guest data into the permanent account.
5. Delete the guest account entry.

### Ban Systems

**Ban Types:**
- **Temporary ban** -- Time-limited (hours, days, weeks). Auto-expires.
- **Permanent ban** -- Account-level, requires manual review.
- **Shadow ban** -- Player can still play but is matched only with other flagged players.
- **Hardware ban** -- Tied to device fingerprint (HWID). Harder to evade.
- **IP ban** -- Blocks an IP range. High collateral damage, use sparingly.

**Ban Wave Strategy:**
Delay enforcement and ban in batches to obscure detection methods. Collect evidence silently, then issue bans simultaneously. This makes it harder for cheat developers to identify which detection triggered the ban.

**Implementation:**
```
ban_records table:
  player_id, ban_type, reason, evidence_hash,
  issued_at, expires_at, issued_by, appeal_status
```

Integrate with platform systems (Steam Game Bans, Xbox enforcement) for platform-level consequences.

---

## Live Operations (LiveOps)

### Feature Flags and Remote Config

Feature flags enable controlled rollout without client updates:

```json
{
  "double_xp_weekend": {
    "enabled": true,
    "start": "2026-03-07T00:00:00Z",
    "end": "2026-03-09T23:59:59Z",
    "rollout_percent": 100
  },
  "new_biome_desert": {
    "enabled": true,
    "rollout_percent": 10,
    "target_groups": ["beta_testers"]
  },
  "shop_prices": {
    "stone_pickaxe": 50,
    "iron_sword": 200
  }
}
```

Remote config fetched on client startup and periodically refreshed. Server-side evaluation ensures consistency. Tools: LaunchDarkly, Firebase Remote Config, Heroic Labs Satori, or custom implementation backed by Redis.

### Live Events and Seasonal Content

Structure events with a calendar system:
- **Recurring events** -- Weekly raids, daily challenges.
- **Seasonal events** -- Multi-week events with progression tracks, exclusive rewards.
- **Flash events** -- Short-duration (hours) high-reward activities.

Event data stored server-side and referenced by the client. Client downloads only the assets needed for active events.

### Hotfixes vs. Full Patches

| Type | Scope | Requires Client Update | Downtime |
|------|-------|----------------------|----------|
| Server hotfix | Balance, economy, bug | No | Minimal/None |
| Config change | Feature flags, prices | No | None |
| Client hotfix | Critical crash fix | Yes | None (background) |
| Full patch | New content, features | Yes | Maintenance window |

### Announcement and MOTD Systems

Message-of-the-day served via API or remote config. Support rich text, images, and deep links. Priority levels (info, warning, critical) for display urgency. Schedule messages in advance with start/end times.

### Maintenance Windows

- Announce 24-48 hours in advance via in-game banner and social media.
- Prevent new connections 15 minutes before maintenance.
- Gracefully shut down active matches (save state, notify players).
- Typical duration: 30 minutes to 2 hours.
- Use blue-green deployment to minimize or eliminate maintenance windows for server-side changes.

---

## Analytics and Monitoring

### Server Monitoring

Critical metrics for game servers:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Server tick rate | 20-60 Hz | Below target - 20% |
| CPU usage | < 70% | > 85% sustained |
| Memory usage | < 80% | > 90% |
| Network bandwidth | Varies | > 80% capacity |
| Player latency (RTT) | < 100ms | > 200ms average |
| Packet loss | < 1% | > 3% |
| Active connections | Varies | Approaching max |

### Prometheus + Grafana Stack

Standard open-source observability stack:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'game-servers'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: game-server
        action: keep
    scrape_interval: 15s

  - job_name: 'matchmaking'
    static_configs:
      - targets: ['matchmaker:9090']
```

Key Grafana dashboards for games:
- **Fleet overview** -- Active servers, player count, allocation rate.
- **Server health** -- Per-instance CPU, memory, tick rate, error rate.
- **Matchmaking** -- Queue depth, wait times, match quality score.
- **Economy** -- Transaction volume, currency in/out, inflation rate.
- **Player funnel** -- Login -> matchmake -> play -> complete cycle.

### Player Analytics

Core metrics:
- **DAU/MAU** -- Daily/Monthly Active Users and their ratio (stickiness).
- **Retention** -- D1, D7, D30 retention curves.
- **Session length** -- Average and distribution.
- **Churn prediction** -- Declining session frequency, reduced spending.
- **Cohort analysis** -- Compare behavior of players who joined in different periods.

### Game Telemetry

Event-based logging for gameplay analysis:
```json
{
  "event": "player_death",
  "timestamp": "2026-03-02T14:23:45Z",
  "player_id": "abc-123",
  "position": {"x": 142, "y": 64, "z": -89},
  "cause": "pvp",
  "killer_id": "def-456",
  "weapon": "iron_sword",
  "session_id": "sess-789"
}
```

Use for heatmaps (death locations, resource gathering spots), balance tuning, and exploit detection.

### Crash Reporting

Integrate crash reporting to capture stack traces, device info, and reproduction context:
- **Sentry** -- Open-source, supports GDScript via custom integration.
- **Backtrace** -- Game-focused crash reporting with minidump support.
- **BugSplat** -- Supports native crashes on Windows/Linux.

### Alerting and On-Call

Set up PagerDuty, Opsgenie, or Grafana Alerting for:
- Server crash rate exceeding threshold.
- Matchmaking queue times spiking.
- Economy anomaly (sudden currency inflation).
- Authentication service errors.
- Database replication lag exceeding RPO.

---

## Distribution and Updates

### Platform Distribution

| Platform | Store | Revenue Split | Notes |
|----------|-------|---------------|-------|
| Steam | Steamworks | 70/30 (adjustable at volume) | Largest PC marketplace |
| Epic Games Store | Epic Dev Portal | 88/12 | Lower cut, smaller audience |
| itch.io | itch.io dashboard | Developer chooses (0-100%) | Indie-friendly, open |
| Google Play | Play Console | 85/15 (first $1M) then 70/30 | AAB format required |
| Apple App Store | App Store Connect | 85/15 (first $1M) then 70/30 | Requires macOS for builds |
| GOG | GOG Partner Portal | Negotiated | DRM-free focus |

### Patch Management and Delta Updates

**Steam SteamPipe** uses binary delta patching. Only modified file chunks are transmitted. Upload builds via `steamcmd`:

```bash
# Steam depot build script (app_build.vdf)
"AppBuild"
{
  "AppID" "123456"
  "Desc" "v1.2.0 patch"
  "BuildOutput" "./output/"
  "ContentRoot" "./build/"
  "Depots"
  {
    "123457"
    {
      "FileMapping"
      {
        "LocalPath" "*"
        "DepotPath" "."
        "recursive" "1"
      }
    }
  }
}
```

```bash
steamcmd +login myuser +run_app_build app_build.vdf +quit
```

**itch.io** uses the butler CLI for efficient delta uploads:
```bash
butler push build/windows my-studio/game:windows --userversion 1.2.0
butler push build/linux my-studio/game:linux --userversion 1.2.0
```

### CDN for Asset Delivery

For large asset downloads outside the main game package (DLC, live event assets, mods):
- **CloudFront** (AWS), **Cloud CDN** (GCP), **Azure CDN**, or **Cloudflare**.
- Use content-addressable storage (hash-based filenames) for cache busting.
- Pre-warm CDN edges before major patch releases.
- Compress assets with Brotli or Zstd for faster transfers.

### Mod Support and Workshop Integration

Steam Workshop integration allows community content:
- Upload/download via Steamworks API.
- Subscription-based automatic updates.
- Curated vs. open submission models.

For custom mod systems, use a mod registry with versioning:
```
/mods/
  /mod-name/
    mod.json       (metadata, dependencies, version)
    /assets/       (textures, models, sounds)
    /scripts/      (GDScript or resource overrides)
```

---

## Security

### Server Hardening

- Run game servers as non-root user in containers.
- Use read-only filesystem where possible.
- Minimal base image (distroless or Alpine).
- Drop all Linux capabilities except required ones.
- Enable seccomp and AppArmor profiles.

```dockerfile
FROM gcr.io/distroless/cc-debian12
COPY --chown=nonroot:nonroot game /app/game
USER nonroot
ENTRYPOINT ["/app/game", "--headless", "--server"]
```

### DDoS Protection

Gaming was the most targeted sector for HTTP DDoS attacks in 2025 with a 94% year-over-year surge.

Layered defense:
1. **Edge scrubbing** -- Anycast-based filtering at network edge (Cloudflare Spectrum, AWS Shield, OVHcloud Game DDoS Protection).
2. **Protocol filtering** -- Drop malformed packets, enforce valid game protocol.
3. **Rate limiting** -- Per-IP connection limits and packet rate caps.
4. **SYN cookies** -- Kernel-level SYN flood protection.

```bash
# Linux kernel hardening for game servers
sysctl -w net.ipv4.tcp_syncookies=1
sysctl -w net.ipv4.tcp_max_syn_backlog=4096
sysctl -w net.core.somaxconn=4096
sysctl -w net.ipv4.conf.all.rp_filter=1
```

### Rate Limiting at Infrastructure Level

Apply at multiple layers:
- **Network** -- iptables/nftables per-IP packet rate limits.
- **Application** -- Token bucket or leaky bucket per player.
- **API Gateway** -- Request rate limits on REST/gRPC endpoints.
- **Game protocol** -- Command rate validation (max actions per tick).

### Secrets Management

- Use HashiCorp Vault, AWS Secrets Manager, or Azure Key Vault.
- Never store secrets in source code, Docker images, or environment variables in plain text.
- Short-lived certificates and tokens (mTLS, JWT).
- Rotate secrets automatically on a schedule.
- Audit access to all secrets.

```yaml
# Kubernetes secret example (use external-secrets-operator in production)
apiVersion: v1
kind: Secret
metadata:
  name: game-db-credentials
type: Opaque
stringData:
  DB_HOST: "postgres.internal"
  DB_USER: "game_server"
  DB_PASS: "vault:secret/data/game/db#password"  # resolved by vault agent
```

### Network Segmentation

Isolate game infrastructure into security zones:
```
[Public Zone]          -- Load balancers, DDoS protection
[DMZ]                  -- Game servers (player-facing UDP/TCP)
[Internal Zone]        -- Backend services (matchmaking, economy, chat)
[Data Zone]            -- Databases, caches (no direct external access)
[Management Zone]      -- CI/CD, monitoring, admin tools (VPN only)
```

Use Kubernetes NetworkPolicies or cloud VPC security groups to enforce boundaries.

---

## Cost Management

### Server Cost Estimation Models

Rule-of-thumb for multiplayer games on major cloud providers:

| CCU | Estimated Monthly Cost | Notes |
|-----|----------------------|-------|
| 100 | $100-200 | Single c5.large or equivalent |
| 1,000 | $500-1,500 | Small fleet with auto-scaling |
| 10,000 | $3,000-10,000 | Multi-region fleet |
| 100,000 | $20,000-80,000 | Significant infrastructure |

Baseline cost per player-hour: $0.05-$0.10 (varies with server density and game complexity).

### Spot/Preemptible Instances

- **AWS Spot Instances** -- Up to 90% off on-demand pricing. Use for non-session-critical workloads (analytics, batch processing, build servers). GameLift FleetIQ intelligently places game servers on Spot with automatic fallback.
- **GCP Preemptible VMs** -- Up to 80% cheaper. 24-hour maximum runtime, suitable for short-lived game sessions.
- **Azure Spot VMs** -- Similar savings. Good for development/testing fleets.

Strategy: Run warm standby and overflow capacity on Spot. Keep minimum fleet on on-demand for reliability.

### CCU Budgeting

Calculate cost per CCU:
```
Monthly Cost = (Server Cost + Bandwidth + Database + CDN + Services)
Cost per CCU = Monthly Cost / Peak CCU

Example:
  Server fleet:    $3,000
  Database:        $800
  Bandwidth:       $500
  CDN:             $200
  Monitoring:      $100
  Matchmaking:     $200
  Total:           $4,800 / 5,000 CCU = $0.96 per CCU per month
```

### Cloud Provider Comparison

| Factor | AWS | Azure | GCP |
|--------|-----|-------|-----|
| Game-specific service | GameLift | PlayFab MPS | Game Servers (Agones) |
| Bandwidth (NA) | ~$0.09/GB | ~$0.05/GB | ~$0.08-0.12/GB |
| Spot savings | Up to 90% | Up to 90% | Up to 80% |
| Free tier | GameLift free tier | PlayFab 750 hours | GKE free control plane |
| Arm instances | Graviton (good value) | Ampere | Tau T2A |
| Global regions | 30+ | 60+ | 35+ |
| Matchmaking | FlexMatch (built-in) | PlayFab Matchmaking | Open Match (self-hosted) |

**Arm-based instances** (AWS Graviton, GCP Tau T2A) consistently offer 20-40% better price-performance than x86 equivalents for game server workloads.

### Cost Optimization Checklist

- [ ] Right-size instances based on actual CPU/memory usage (not peak estimates).
- [ ] Use auto-scaling to scale down during off-peak hours.
- [ ] Spot/preemptible for non-critical and overflow capacity.
- [ ] Reserved instances or savings plans for baseline capacity (1-3 year commit for 30-60% savings).
- [ ] Compress network traffic (protocol buffers, delta compression).
- [ ] CDN for static assets instead of serving from game servers.
- [ ] Database read replicas to offload query traffic.
- [ ] Archive old telemetry data to cold storage (S3 Glacier, Archive).
- [ ] Scale to zero when no players are connected (GameLift supports this).
- [ ] Monitor and alert on cost anomalies with AWS Cost Explorer or equivalent.

---

## Citations

- [godot-ci - GitHub Actions Marketplace](https://github.com/marketplace/actions/godot-ci)
- [abarichello/godot-ci - Docker image for Godot exports](https://github.com/abarichello/godot-ci)
- [Setup Godot Action - GitHub Marketplace](https://github.com/marketplace/actions/setup-godot-action)
- [Godot Export Action - GitHub Marketplace](https://github.com/marketplace/actions/godot-export)
- [Codemagic - Setting up CI/CD for a Godot game](https://blog.codemagic.io/godot-games-cicd/)
- [Godot Docs - Exporting Projects](https://docs.godotengine.org/en/latest/tutorials/export/exporting_projects.html)
- [Godot Docs - Export Architecture (DeepWiki)](https://deepwiki.com/godotengine/godot-docs/8.1-export-architecture)
- [godot-exporter - Multi-platform CI/CD pipeline](https://github.com/vini-guerrero/godot-exporter)
- [Agones - Official Documentation](https://agones.dev/site/docs/overview/)
- [Agones - GitHub Repository](https://github.com/googleforgames/agones)
- [Google Cloud Blog - Introducing Agones](https://cloud.google.com/blog/products/containers-kubernetes/introducing-agones-open-source-multiplayer-dedicated-game-server-hosting-built-on-kubernetes)
- [Edgegap - Scalable Game Servers Using Docker or Kubernetes](https://edgegap.com/blog/how-can-i-host-scalable-game-servers-using-docker-or-kubernetes)
- [AWS - Game Server Hosting Using Agones and Open Match on EKS](https://aws.amazon.com/solutions/guidance/game-server-hosting-using-agones-and-open-match-on-amazon-eks/)
- [AWS - Developers Guide to Game Servers on Kubernetes](https://aws.amazon.com/blogs/gametech/developers-guide-to-operate-game-servers-on-kubernetes-part-2/)
- [AWS GameLift Servers - Pricing](https://aws.amazon.com/gamelift/servers/pricing/)
- [AWS GameLift - Auto-scale Fleet Capacity](https://docs.aws.amazon.com/gameliftservers/latest/developerguide/fleets-autoscaling.html)
- [AWS GameLift - Scaling to/from Zero](https://docs.aws.amazon.com/gameliftservers/latest/developerguide/fleets_scale-to-from-zero.html)
- [AWS GameLift - Target-based Auto Scaling](https://docs.aws.amazon.com/gameliftservers/latest/developerguide/fleets-autoscaling-target.html)
- [Azure PlayFab - Multiplayer Servers](https://azure.microsoft.com/en-us/products/playfab/multiplayer-services/)
- [PlayFab - Pricing](https://playfab.com/pricing/)
- [PlayFab - MPS Billing](https://learn.microsoft.com/en-us/gaming/playfab/multiplayer/servers/billing-for-thunderhead)
- [PlayFab - AMD VM Price-Performance Improvement](https://api-stage.playfab.com/blog/azure-playfab-multiplayer-servers-improves-price-performance-ratio-for-game-server-hosting-with-new-amd-virtual-machines)
- [Open Match - GitHub Repository](https://github.com/googleforgames/open-match)
- [Open Match - Matchmaking Guide](https://open-match.dev/site/docs/guides/matchmaker/)
- [Google Cloud Blog - Open Match](https://cloud.google.com/blog/products/open-source/open-match-flexible-and-extensible-matchmaking-for-games)
- [AWS - FlexMatch Rule Set Design](https://docs.aws.amazon.com/gameliftservers/latest/flexmatchguide/match-design-ruleset.html)
- [AWS - FlexMatch Algorithm Customization](https://docs.aws.amazon.com/gamelift/latest/flexmatchguide/match-rulesets-components-algorithm.html)
- [AWS Blog - AI-Powered Matchmaking with FlexMatch](https://aws.amazon.com/blogs/gametech/implementing-ai-powered-matchmaking-with-amazon-gamelift-flexmatch/)
- [Glicko Rating System - Wikipedia](https://en.wikipedia.org/wiki/Glicko_rating_system)
- [TrueSkill - Microsoft Research](https://www.microsoft.com/en-us/research/project/trueskill-ranking-system/)
- [TrueSkill - Wikipedia](https://en.wikipedia.org/wiki/TrueSkill)
- [skillratings - Rust Library for Rating Algorithms](https://github.com/atomflunder/skillratings)
- [Game Database Architecture Guide 2025](https://generalistprogrammer.com/tutorials/game-database-architecture-complete-backend-guide-2025)
- [Hathora - Persistence for Ephemeral Game Servers](https://blog.hathora.dev/persistence-for-ephemeral-game-servers/)
- [Redis - Gaming Industry Solutions](https://redis.io/industries/gaming/)
- [DragonflyDB - Redis for Game Servers](https://www.dragonflydb.io/faq/using-redis-for-game-server)
- [SpacetimeDB](https://spacetimedb.com/)
- [AccelByte - Cross-Platform Authentication](https://accelbyte.io/blog/cross-platform-authentication-for-games-should-you-build-it-or-plug-it-in)
- [FusionAuth - Cross-Platform Game Accounts](https://fusionauth.io/articles/gaming-entertainment/cross-platform-game-accounts)
- [Heroic Labs - Satori LiveOps](https://heroiclabs.com/satori/)
- [iXie - LiveOps Testing](https://www.ixiegaming.com/blog/liveops-testing-without-drama-engineering-stability-for-weekly-game-drops/)
- [Metaplay - Implementing LiveOps Events](https://docs.metaplay.io/feature-cookbooks/in-game-events/implementing-liveops-events.html)
- [Grafana Labs - EA Monitors 200+ Metrics](https://grafana.com/blog/2025/07/07/from-chaos-to-clarity-with-grafana-dashboards-how-video-game-company-ea-monitors-200-metrics/)
- [Prometheus - Official Site](https://prometheus.io/)
- [Grafana - Official Site](https://grafana.com/)
- [AWS GameLift - Server Telemetry Metrics](https://docs.aws.amazon.com/gameliftservers/latest/developerguide/monitoring-gamelift-servers-metrics.html)
- [Steamworks - Uploading to Steam](https://partner.steamgames.com/doc/sdk/uploading)
- [Steamworks - Builds Documentation](https://partner.steamgames.com/doc/store/application/builds)
- [Steamworks - Updating Your Game Best Practices](https://partner.steamgames.com/doc/store/updates)
- [Steamworks - Anti-cheat and Game Bans](https://partner.steamgames.com/doc/features/anticheat)
- [itch.io - How Updates Work](https://itch.io/docs/itch/integrating/updates.html)
- [OVHcloud - Game DDoS Protection](https://www.ovhcloud.com/en/security/game-ddos-protection/)
- [Soraxus - DDoS Protection for Game Servers](https://soraxus.com/blog/informational/ddos-protection-for-game-servers)
- [Hetzner - Game Server DDoS Protection Tutorial](https://community.hetzner.com/tutorials/game-server-ddos-protection/)
- [HelpNetSecurity - Gaming Industry Cyber Threats 2025](https://www.helpnetsecurity.com/2025/10/27/gaming-industry-cyber-threats-risks/)
- [MOSS - Server Security Hardening Guide 2025](https://moss.sh/reviews/server-security-hardening-guide-2025/)
- [Semantic Versioning 2.0.0](https://semver.org/)
- [LaunchDarkly - Software Release Versioning](https://launchdarkly.com/blog/software-release-versioning/)
- [Cloud Hosting for Multiplayer Games - AWS vs Azure vs GCP](https://gamengen.cloud/ultimate-guide-cloud-hosting-multiplayer-games/)
- [Revolgy - Cloud Provider Comparison for Gaming](https://www.revolgy.com/insights/blog/aws-azure-or-gcp-huge-comparison-of-cloud-providers-for-the-gaming-industry)
- [Metaplay - Mobile Game Server Costs Guide](https://www.metaplay.io/blog/mobile-game-server-costs)
- [AccelByte - Pricing Calculator](https://accelbyte.io/pricing-calculator)
- [Galaxy4Games - Scalable Multiplayer Backend Architecture](https://galaxy4games.com/en/knowledgebase/blog/what-backend-architecture-supports-scalable-multiplayer-games)
- [Genieee - Building a Scalable Game Server Backend](https://genieee.com/building-a-scalable-game-server-backend-a-complete-guide/)
- [Microservices.io - API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
