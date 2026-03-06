# Godot Development Agent Skill - Citations

Research sources used to build this skill. Last updated: 2026-03-02.

## Official Documentation
- [Godot Engine Documentation (Stable)](https://docs.godotengine.org/en/stable/) - GDScript reference, multiplayer API, scene system, export pipeline, performance optimization
- [GDScript Style Guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html) - Naming conventions, member ordering
- [Static Typing in GDScript](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/static_typing.html) - Type annotation patterns
- [High-level Multiplayer](https://docs.godotengine.org/en/stable/tutorials/networking/high_level_multiplayer.html) - MultiplayerAPI, RPCs, authority system
- [MultiplayerSynchronizer](https://docs.godotengine.org/en/stable/classes/class_multiplayersynchronizer.html) - Property replication
- [Exporting for Dedicated Servers](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_dedicated_servers.html) - Headless builds, feature tags
- [Scene Organization Best Practices](https://docs.godotengine.org/en/stable/tutorials/best_practices/scene_organization.html) - Scene architecture
- [Project Organization](https://docs.godotengine.org/en/stable/tutorials/best_practices/project_organization.html) - Directory structure
- [Autoloads vs Internal Nodes](https://docs.godotengine.org/en/4.5/tutorials/best_practices/autoloads_versus_internal_nodes.html) - Singleton alternatives
- [TSCN File Format](https://docs.godotengine.org/en/4.4/contributing/development/file_formats/tscn.html) - Scene file structure
- [Optimization Using Servers](https://docs.godotengine.org/en/stable/tutorials/performance/using_servers.html) - RenderingServer, PhysicsServer direct APIs
- [Using Multiple Threads](https://docs.godotengine.org/en/stable/tutorials/performance/using_multiple_threads.html) - WorkerThreadPool, thread safety
- [Thread-Safe APIs](https://docs.godotengine.org/en/stable/tutorials/performance/thread_safe_apis.html) - What is safe to call from threads

## Multiplayer and Networking
- [Godot 4 Multiplayer Overview (Gist)](https://gist.github.com/Meshiest/1274c6e2e68960a409698cf75326d4f6) - Authority, RPCs, synchronizer, spawner, visibility
- [Multiplayer in Godot 4.0: Scene Replication (Godot Blog)](https://godotengine.org/article/multiplayer-in-godot-4-0-scene-replication/) - Official replication system
- [Building Multiplayer Games in Godot 4 (GodotAwesome)](https://godotawesome.com/godot-4-multiplayer-networking-guide-2025/) - 2025 networking guide
- [Godot Server-Client Multiplayer Demo (GitHub)](https://github.com/grazianobolla/godot-server-multiplayer) - Authoritative server pattern
- [godot-monke-net (GitHub)](https://github.com/grazianobolla/godot-monke-net) - Client/server authoritative addon

## Voxel Systems
- [Zylann/godot_voxel (GitHub)](https://github.com/Zylann/godot_voxel) - 3.5k stars, C++ voxel module: VoxelTerrain, VoxelLodTerrain, VoxelMesherBlocky, VoxelMesherTransvoxel, VoxelStreamRegionFiles, VoxelTool API
- [godot_voxel Documentation (ReadTheDocs)](https://voxel-tools.readthedocs.io/) - Installation, quick start, API reference

## Testing
- [GUT - Godot Unit Testing (GitHub)](https://github.com/bitwes/Gut) - 2.4k stars, GUT 9.x for Godot 4.x: assertions, mocking, doubles, CLI runner, JUnit XML
- [GdUnit4 (GitHub)](https://github.com/MikeSchulze/gdUnit4) - Scene runner, mocking, CI/CD, GDScript + C# support

## GDScript vs C#
- [GDScript vs C# (Chickensoft)](https://chickensoft.games/blog/gdscript-vs-csharp) - Performance comparison, platform support, ecosystem
- [C# Integration Guide (GodotAwesome)](https://godotawesome.com/godot-4-csharp-integration-complete-guide-2025/) - Interop patterns, limitations
- [Cross-Language Scripting (Godot Docs)](https://docs.godotengine.org/en/stable/tutorials/scripting/cross_language_scripting.html) - GDScript ↔ C# calling

## Architecture and Design Patterns
- [Design Patterns in Godot (GDQuest)](https://www.gdquest.com/tutorial/godot/design-patterns/intro-to-design-patterns/) - State machines, observer, composition, ECS, singleton, command
- [Entity-Component Pattern (GDQuest)](https://www.gdquest.com/tutorial/godot/design-patterns/entity-component-pattern/) - Component composition in Godot
- [Godot Architecture Organization Advice (GitHub)](https://github.com/abmarnie/godot-architecture-organization-advice) - Scene-colocated vs type-separated organization

## MCP Servers
- [Coding-Solo/godot-mcp (GitHub)](https://github.com/Coding-Solo/godot-mcp) - 2,000 stars, 14 tools, primary MCP recommendation
- [ee0pdt/Godot-MCP (GitHub)](https://github.com/ee0pdt/Godot-MCP) - 477 stars, bidirectional editor plugin, WebSocket communication
- [bradypp/godot-mcp (GitHub)](https://github.com/bradypp/godot-mcp) - 54 stars, read-only mode, UID management
- [HaD0Yun/godot-mcp GoPeak (GitHub)](https://github.com/HaD0Yun/godot-mcp) - 28 stars, 95+ tools, LSP/DAP integration
- [3ddelano/gdai-mcp-plugin-godot (GitHub)](https://github.com/3ddelano/gdai-mcp-plugin-godot) - 72 stars, screenshot capture, script debugging
- [PulseMCP Godot Ranking](https://www.pulsemcp.com/servers/coding-solo-godot) - 354K visitors, #84 global MCP rank

## Claude Code Skills for Godot
- [Randroids-Dojo/Godot-Claude-Skills (GitHub)](https://github.com/Randroids-Dojo/Godot-Claude-Skills) - 10 stars, GdUnit4 testing, export, CI/CD
- [alexmeckes/godot-claude-skills (GitHub)](https://github.com/alexmeckes/godot-claude-skills) - 4 skills: code-gen, live-edit, scene-design, shader
- [Kothulhu94/Claude-GDSkill (GitHub)](https://github.com/Kothulhu94/Claude-GDSkill) - 1050+ class docs for Godot 4.5
- [skills.sh godot-debugging (zate/cc-godot)](https://skills.sh/zate/cc-godot/godot-debugging) - Debugging expertise skill
- [skills.sh godot-llm-integration](https://skills.sh/omer-metin/skills-for-antigravity/godot-llm-integration) - LLM-in-game patterns
- [FastMCP Godot Skill](https://fastmcp.me/Skills/Details/235/godot) - File formats, architecture patterns

## Networking Addons
- [netfox (GitHub)](https://github.com/foxssake/netfox) - Rollback networking, prediction, reconciliation for Godot
- [Steam Multiplayer Peer (GitHub)](https://github.com/expressobits/steam-multiplayer-peer) - Steam Sockets GDExtension

## Performance
- [Performance Tips (Toxigon)](https://toxigon.com/godot-performance-optimization-tips) - Optimization patterns
- [GodotServer-Docker (GitHub)](https://github.com/briancain/GodotServer-Docker) - Containerized Godot server deployment
- [CloudRift Tutorial](https://docs.cloudrift.ai/tutorials/dedicated-game-server) - Cloud dedicated server setup
