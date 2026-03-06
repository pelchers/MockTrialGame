# Godot Editor Operations Reference

Complete reference for all editor operations that can be performed via CLI, GDScript, or MCP tools. This duplicates the knowledge provided by Godot MCP servers so the skill works standalone.

## CLI Operations

### Project Management

```bash
# Launch editor
godot --editor --path /absolute/path/to/project

# Run project (debug mode, captures output)
godot --path /path/to/project
godot --path /path/to/project --debug-collisions --debug-navigation

# Run specific scene
godot --path /path/to/project res://scenes/main_menu.tscn

# Headless mode (dedicated server, CI/CD, testing)
godot --headless --path /path/to/project

# Version info
godot --version          # e.g., "4.5.stable"
godot --version-full     # Full version with hash

# Export (headless)
godot --headless --path /path --export-release "preset_name" output_path
godot --headless --path /path --export-debug "preset_name" output_path

# Validate project
godot --headless --path /path --check-only

# Script mode (run a script then exit)
godot --headless -s res://scripts/build_tool.gd

# Verbose/quiet
godot --verbose    # Extra debug output
godot --quiet      # Suppress non-error output
```

### Import & Resource Commands

```bash
# Reimport all resources
godot --headless --path /path --reimport

# Convert project (upgrade)
godot --headless --path /path --convert-3to4

# Doctool (generate API docs)
godot --doctool /output/path
```

## Scene File Format (.tscn)

### Structure

```ini
[gd_scene load_steps=N format=3 uid="uid://..."]

# External resources (files on disk)
[ext_resource type="Script" path="res://src/player.gd" id="1_abc"]
[ext_resource type="PackedScene" path="res://scenes/weapon.tscn" id="2_def"]
[ext_resource type="Texture2D" path="res://assets/icon.png" id="3_ghi"]

# Sub-resources (inline data)
[sub_resource type="BoxShape3D" id="BoxShape3D_xyz"]
size = Vector3(1, 2, 1)

[sub_resource type="StandardMaterial3D" id="StandardMaterial3D_uvw"]
albedo_color = Color(0.8, 0.2, 0.2, 1)

# Node tree
[node name="Root" type="CharacterBody3D"]
script = ExtResource("1_abc")
speed = 5.0

[node name="MeshInstance" type="MeshInstance3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0)

[node name="CollisionShape" type="CollisionShape3D" parent="."]
shape = SubResource("BoxShape3D_xyz")

[node name="Weapon" parent="." instance=ExtResource("2_def")]

# Connections (signals)
[connection signal="body_entered" from="Area3D" to="." method="_on_body_entered"]
```

### Key Rules

- `parent="."` = child of root node
- `parent="ParentName"` = child of named node
- `parent="Path/To/Parent"` = nested path
- `instance=ExtResource(...)` = instanced scene
- `owner` is NOT in .tscn -- it's runtime-only
- IDs are arbitrary strings (format: `"type_shortid"`)
- `load_steps` = total ext_resource + sub_resource + 1

### Editing .tscn Files Directly

Safe operations without editor:
- Change property values on existing nodes
- Add/remove `[connection]` entries
- Modify `[sub_resource]` properties
- Change `ext_resource` paths (update references too)

Risky without editor:
- Adding new nodes (must update load_steps, generate IDs)
- Renaming nodes (must update all parent paths and connections)
- Removing nodes (must clean up all references)

## GDScript Scene Operations

### Creating Scenes

```gdscript
func create_scene(root_type: String, scene_path: String) -> void:
    var root: Node
    match root_type:
        "Node2D": root = Node2D.new()
        "Node3D": root = Node3D.new()
        "Control": root = Control.new()
        "CharacterBody3D": root = CharacterBody3D.new()
        _: root = Node.new()

    root.name = scene_path.get_file().get_basename().to_pascal_case()

    var scene := PackedScene.new()
    scene.pack(root)
    ResourceSaver.save(scene, scene_path)
    root.queue_free()
```

### Adding Nodes

```gdscript
func add_node_to_scene(scene_path: String, parent_path: String,
        node_type: String, node_name: String, properties: Dictionary) -> void:
    var packed := load(scene_path) as PackedScene
    var root := packed.instantiate()

    var parent := root.get_node(parent_path) if parent_path != "." else root
    var node: Node = ClassDB.instantiate(node_type)
    node.name = node_name

    for key in properties:
        node.set(key, properties[key])

    parent.add_child(node)
    node.owner = root  # CRITICAL: must set owner for PackedScene

    var new_packed := PackedScene.new()
    new_packed.pack(root)
    ResourceSaver.save(new_packed, scene_path)
    root.queue_free()
```

### Editing Node Properties

```gdscript
func edit_node(scene_path: String, node_path: String, properties: Dictionary) -> void:
    var packed := load(scene_path) as PackedScene
    var root := packed.instantiate()
    var node := root.get_node(node_path)

    for key in properties:
        node.set(key, properties[key])

    var new_packed := PackedScene.new()
    new_packed.pack(root)
    ResourceSaver.save(new_packed, scene_path)
    root.queue_free()
```

### Removing Nodes

```gdscript
func remove_node(scene_path: String, node_path: String) -> void:
    var packed := load(scene_path) as PackedScene
    var root := packed.instantiate()
    var node := root.get_node(node_path)
    node.get_parent().remove_child(node)
    node.queue_free()

    var new_packed := PackedScene.new()
    new_packed.pack(root)
    ResourceSaver.save(new_packed, scene_path)
    root.queue_free()
```

## Project Info Retrieval

### Reading project.godot

```gdscript
var config := ConfigFile.new()
config.load("res://project.godot")

var project_name: String = config.get_value("application", "config/name", "")
var features: PackedStringArray = config.get_value("application", "config/features", [])
var icon: String = config.get_value("application", "config/icon", "")
var main_scene: String = config.get_value("application", "run/main_scene", "")
```

### Listing Project Files

```gdscript
func list_files(path: String, extension: String = "") -> Array[String]:
    var files: Array[String] = []
    var dir := DirAccess.open(path)
    if dir:
        dir.list_dir_begin()
        var file_name := dir.get_next()
        while file_name != "":
            if dir.current_is_dir():
                files.append_array(list_files(path + "/" + file_name, extension))
            elif extension == "" or file_name.ends_with(extension):
                files.append(path + "/" + file_name)
            file_name = dir.get_next()
    return files

# Usage
var scripts := list_files("res://src", ".gd")
var scenes := list_files("res://", ".tscn")
```

### Finding Godot Projects

```gdscript
func find_projects(search_path: String, recursive: bool = true) -> Array[String]:
    var projects: Array[String] = []
    var dir := DirAccess.open(search_path)
    if dir:
        dir.list_dir_begin()
        var entry := dir.get_next()
        while entry != "":
            var full_path := search_path + "/" + entry
            if dir.current_is_dir() and entry != "." and entry != "..":
                if FileAccess.file_exists(full_path + "/project.godot"):
                    projects.append(full_path)
                elif recursive:
                    projects.append_array(find_projects(full_path, true))
            entry = dir.get_next()
    return projects
```

## UID System (Godot 4.4+)

```gdscript
# Get UID for a resource
var uid_int: int = ResourceLoader.get_resource_uid("res://scenes/player.tscn")
var uid_text: String = ResourceUID.id_to_text(uid_int)  # "uid://abc123def"

# Resolve UID back to path
var path: String = ResourceUID.get_id_path(uid_int)

# UIDs survive file renames - reference resources by UID for stability
# In .tscn: [ext_resource type="Script" uid="uid://abc" path="res://src/player.gd" id="1"]
```

## MeshLibrary Export

```gdscript
# Convert scene with named MeshInstance3D children into MeshLibrary
func export_mesh_library(scene_path: String, output_path: String) -> void:
    var scene := load(scene_path) as PackedScene
    var root := scene.instantiate()
    var lib := MeshLibrary.new()
    var idx := 0

    for child in root.get_children():
        if child is MeshInstance3D:
            lib.create_item(idx)
            lib.set_item_name(idx, child.name)
            lib.set_item_mesh(idx, child.mesh)
            if child.get_child_count() > 0:
                var shapes: Array = []
                for shape_child in child.get_children():
                    if shape_child is CollisionShape3D:
                        shapes.append(shape_child.shape)
                lib.set_item_shapes(idx, shapes)
            idx += 1

    ResourceSaver.save(lib, output_path)
    root.queue_free()
```

## MCP Server Integration (Optional Enhancement)

If you have a Godot MCP server running, these tools become available to AI assistants:

### Coding-Solo/godot-mcp (2,000 stars - Recommended)

| Tool | Purpose |
|------|---------|
| `get_godot_version` | Version + platform info |
| `launch_editor` | Open editor for project |
| `run_project` | Execute in debug mode |
| `stop_project` | Stop running project |
| `list_projects` | Find projects recursively |
| `get_project_info` | Project metadata |
| `create_scene` | New scene with root type |
| `add_node` | Insert node with properties |
| `edit_node` | Modify node properties |
| `remove_node` | Delete node |
| `load_sprite` | Assign texture to Sprite2D |
| `save_scene` | Save/create variants |
| `get_uid` | Resource UID (4.4+) |
| `update_project_uids` | Bulk UID update |
| `export_mesh_library` | Scene to MeshLibrary |

### ee0pdt/Godot-MCP (477 stars - Bidirectional)

Adds real-time editor plugin communication:
- Live scene tree inspection
- Script read/write while editor runs
- Resource endpoints: `godot://script/current`, `godot://scene/current`, `godot://project/info`

### Setup (Claude Code)

```json
{
  "mcpServers": {
    "godot": {
      "command": "node",
      "args": ["/path/to/godot-mcp/build/index.js"],
      "env": { "GODOT_PATH": "/path/to/godot" }
    }
  }
}
```
