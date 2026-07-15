# Bundled tool contract

## Capability boundary

The bundled `Coding-Solo/godot-mcp` server performs project discovery, CLI/editor launch, scene
file operations, sprite assignment, debug capture, UID maintenance, and mesh-library export. It is
not a general editor RPC endpoint: it has no tool to write GDScript, attach scripts, inspect every
Inspector property, or render pixels from the user's already-open editor.

## Tool inventory

Use the MCP schema supplied at runtime as authoritative. The bundled server currently exposes:

- Discovery: `get_godot_version`, `list_projects`, `get_project_info`, `launch_editor`.
- Run control: `run_project`, `get_debug_output`, `stop_project`.
- Scene edits: `create_scene`, `add_node`, `load_sprite`, `save_scene`.
- Project maintenance: `export_mesh_library`, `get_uid`, `update_project_uids`.

`projectPath` is an absolute directory containing `project.godot`. Scene, texture, and output paths
are normally `res://` paths. Confirm the live input schema before calling a tool because server
releases can alter optional fields.

## Safe use

Prefer `create_scene` followed by a small `add_node` mutation. Give generated nodes stable names;
set properties only from documented Godot property names. Run after a mutation and retain the exact
debug output as evidence. Do not claim a visual result from a successful write alone.

## Official sources

- Bundled server repository: https://github.com/Coding-Solo/godot-mcp
- Godot command-line reference, 4.6: https://docs.godotengine.org/en/4.6/tutorials/editor/command_line_tutorial.html
