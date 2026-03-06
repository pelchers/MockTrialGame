# Game Development System

System documentation for the comprehensive game development agent and skill.

## Purpose

Provides engine-agnostic game development expertise across 12 domains: ECS, graphics (2D/2.5D/3D), animation, multiplayer architectures, design patterns, physics, audio, AI/pathfinding, UI/UX, performance optimization, procedural generation, and DevOps/deployment. Used when building any game system, making architecture decisions, debugging performance, or selecting technologies. Includes ~11,000 lines of deep-dive resource files with 500+ citations.

## When to Use

- Designing game system architecture (ECS vs OOP, sync strategy, authority model)
- Implementing cross-cutting game features (combat, movement, terrain, networking)
- Making technology decisions (rendering pipeline, physics engine, transport protocol)
- Debugging performance bottlenecks (CPU/GPU/memory/network profiling)
- Planning server infrastructure (hosting, matchmaking, scaling, cost modeling)
- Any game development task that spans multiple domains

## Architecture

```
┌─────────────────────────────────────────────────┐
│          Game Development Agent                  │
│   (Domain Router / Architecture Advisor)         │
├─────────────────────────────────────────────────┤
│  Reads task → Routes to domain resource(s)       │
│  Cross-references multiple domains when needed   │
│  Provides Godot-specific guidance via companion  │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ SKILL.md │  │ 12 Domain│  │ Master   │
  │ (summary)│  │ Resources│  │ Citations│
  └──────────┘  └──────────┘  └──────────┘
                     │
    ┌────┬────┬────┬─┴──┬────┬────┬────┬────┬────┬────┬────┐
    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼
   ECS  GFX  Anim  MP  Pat  Phys Aud  AI   UI  Perf PGen DevOps
```

## Key Concepts

### Progressive Disclosure via Resource Files

The SKILL.md provides summary-level guidance (~250 lines) across all 12 domains. Each domain has a dedicated deep-dive resource file (300-1,600 lines) loaded only when implementation details are needed.

### Domain Routing Table

The agent uses a routing table to determine which resource file(s) to read based on the task at hand. Most tasks touch 1-2 primary resources plus 1-2 secondary resources.

### Cross-Domain Awareness

Game development tasks frequently cross domain boundaries (e.g., "add a faction flag that animates on claimed territory" touches ECS, Graphics, Animation, and Multiplayer). The skill explicitly maps these cross-cutting patterns.

## Resource Files (12 Domains)

| Domain | File | Lines | Key Topics |
|--------|------|-------|------------|
| Entity Component Systems | `entity-component-systems.md` | 683 | Archetype/sparse-set ECS, DOD, cache optimization |
| Graphics & Rendering | `graphics-and-rendering.md` | 708 | 2D/2.5D/3D pipelines, shaders, PBR, voxel meshing |
| Animation Systems | `animation-systems.md` | 785 | Skeletal, procedural, blend trees, IK, network sync |
| Multiplayer Architectures | `multiplayer-architectures.md` | 1,386 | P2P/dedicated/hybrid, rollback, netcode, anti-cheat |
| Game Design Patterns | `game-design-patterns.md` | 1,588 | 37 patterns with pseudocode, GoF + game-specific |
| Physics & Collision | `physics-and-collision.md` | 762 | Rigid body, collision pipeline, character controllers |
| Audio Systems | `audio-systems.md` | 553 | Spatial audio, adaptive music, middleware |
| AI & Pathfinding | `ai-and-pathfinding.md` | 1,037 | FSM, behavior trees, GOAP, A*, NavMesh |
| UI/UX for Games | `ui-ux-for-games.md` | 796 | HUD, inventory, chat, input, accessibility |
| Performance Optimization | `performance-optimization.md` | 740 | CPU/GPU profiling, voxel optimization, GDScript perf |
| Procedural Generation | `procedural-generation.md` | 822 | Noise, terrain gen, WFC, L-systems, loot tables |
| DevOps & Deployment | `devops-and-deployment.md` | 1,078 | CI/CD, Docker, orchestration, matchmaking, cost |

## Agent & Skill Locations

| Component | Claude Path | Codex Path |
|-----------|-------------|------------|
| Agent | `.claude/agents/game-development-agent/AGENT.md` | `.codex/agents/game-development-agent.md` |
| Skill | `.claude/skills/game-development-agent/SKILL.md` | `.codex/skills/game-development-agent/SKILL.md` |
| Resources (12 files) | `.claude/skills/game-development-agent/resources/` | `.codex/skills/game-development-agent/resources/` |
| Master Citations | `.claude/skills/game-development-agent/resources/citations.md` | `.codex/skills/game-development-agent/resources/citations.md` |

## Integration with Other Systems

- **godot_development**: Companion system for Godot-specific implementation. The game-dev agent references the Godot skill for engine-specific details.
- **extensibility**: The game-dev agent and skill were created following the agent-creation and skill-creation guides in the extensibility system.
- **system_docs_management**: This system's documentation was created by the system-docs-agent.
