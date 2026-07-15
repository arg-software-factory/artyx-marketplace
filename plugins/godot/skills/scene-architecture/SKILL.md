---
name: Godot Scene Architecture
description: Load when building or restructuring Godot scenes through godot-mcp — create_scene/add_node/save_scene recipes, node-type selection tables (Node2D vs Control vs Node3D), root & ownership discipline, res:// path hygiene, load_sprite texture setup, the sub-scene instancing boundary, and structure verification.
---

# Building Godot scenes over MCP

You are writing `.tscn` files on disk. Build incrementally, save, then re-read
structure with `get_project_info`. Read the `godot-mcp` base skill first for the
operating model. Every op takes an explicit `projectPath` + `scenePath`.

## 1. Choose the root by scene purpose

The root node type is a commitment — pick it from what the scene IS, then pass it as
`create_scene`'s `rootNodeType`.

| Scene purpose | Root | Typical children |
|---------------|------|------------------|
| 2D gameplay entity/level | `Node2D` | `Sprite2D`, `AnimatedSprite2D`, `CollisionShape2D`, `Camera2D`, `TileMapLayer`, `Marker2D` |
| Physics actor (2D) | `CharacterBody2D` / `RigidBody2D` / `StaticBody2D` / `Area2D` | `Sprite2D` + `CollisionShape2D` |
| Pure UI / HUD / menu | `Control` (or `CanvasLayer` for overlays) | `Button`, `Label`, `Panel`, `VBoxContainer`/`HBoxContainer`/`GridContainer`, `MarginContainer`, `TextureRect`, `LineEdit`, `ProgressBar`, `RichTextLabel` |
| 3D scene/level | `Node3D` | `MeshInstance3D`, `Camera3D`, `DirectionalLight3D`/`OmniLight3D`/`SpotLight3D`, `GridMap`, `WorldEnvironment` |
| Physics actor (3D) | `CharacterBody3D` / `RigidBody3D` / `StaticBody3D` / `Area3D` | `MeshInstance3D` + `CollisionShape3D` |
| Logic-only (manager, autoload, state) | `Node` | none — behavior lives in a script |

Rule of thumb: **UI never lives under a `Node2D`** (it won't lay out); gameplay never
lives under a `Control`. Mixing them is the #1 structural smell.

## 2. Build recipe (create → populate → save → verify)

```
create_scene { projectPath, scenePath: "res://scenes/player.tscn", rootNodeType: "CharacterBody2D" }
add_node     { projectPath, scenePath, nodeType: "Sprite2D",         nodeName: "Sprite" }
add_node     { projectPath, scenePath, nodeType: "CollisionShape2D", nodeName: "Hitbox" }
add_node     { projectPath, scenePath, nodeType: "Camera2D",         nodeName: "Cam", parentNodePath: "." }
save_scene   { projectPath, scenePath }
get_project_info { projectPath }     # confirm the file exists + tree is what you expect
```

- `parentNodePath` is a scene-relative node path; `"."` or omitted = the root. To nest,
  pass the parent's path, e.g. `parentNodePath: "UI/HBox"` after creating those.
- `properties` on `add_node` sets initial node properties (passed through to Godot),
  e.g. `properties: { "position": [100, 40] }` or `{ "text": "Start" }` on a Button.
  Property names/formats are Godot's — verify empirically with a run if unsure.
- **Order matters**: create a container/parent node before adding children that name it
  as `parentNodePath`.

## 3. Ownership & root discipline (the silent data-loss trap)

In Godot, only nodes **owned by the scene root** get written into the `.tscn`. The
server's `add_node`+`save_scene` handles owner assignment, but if a node "disappears"
after save, wrong/missing ownership is the cause. Defenses: add nodes with an explicit
`parentNodePath` under the root; `save_scene` after each logical group; then
`get_project_info` to confirm the node persisted. One scene = one root = one clear tree.

## 4. Textures via load_sprite

`load_sprite` assigns a texture to an existing `Sprite2D` / `Sprite3D` / `TextureRect`
node — create the node first, then point at it by `nodePath`:

```
add_node    { projectPath, scenePath, nodeType: "Sprite2D", nodeName: "Hero" }
load_sprite { projectPath, scenePath, nodePath: "Hero", texturePath: "res://assets/hero.png" }
save_scene  { projectPath, scenePath }
```

If `load_sprite` errors, the node type is wrong (not a sprite/texture node) or the
`texturePath` doesn't resolve — the texture file must already exist in the project.

## 5. res:// path hygiene

- Everything the tools reference (`scenePath`, `texturePath`, `outputPath`) is
  `res://`-relative to the project root (the folder with `project.godot`).
- Keep a stable layout: `res://scenes/`, `res://assets/` (or `sprites/`, `textures/`),
  `res://scripts/`. Consistent folders keep UIDs and preloads stable.
- Never hand-build `../` chains — always full `res://` paths from the project root.

## 6. Composition over inheritance — and the sub-scene instancing boundary

Godot's idiom is **composition**: build small, self-contained, single-responsibility
scenes (a `Player`, a `Coin`, a `HealthBar`) and instance them inside bigger scenes.
Build each unit as its own `.tscn` with `create_scene`.

**Honest boundary:** the MCP server can build a node tree by TYPE, but it has **no tool
to instance one saved scene as a child of another** (no PackedScene-instance op). So:

- Build and independently verify each sub-scene (`run_project { scene: "res://.../coin.tscn" }`).
- The final assembly that *instances* sub-scenes is a human editor step (drag the
  `.tscn` into the parent) — OR done from GDScript at runtime
  (`preload("res://coin.tscn").instantiate()`, see `gdscript-gameplay`).
- Do NOT fake instancing by re-adding a sub-scene's nodes by type into the parent —
  that forks the design and defeats reuse. Keep units as scenes; hand off the wiring.

## 7. Verify structure, not intent

After building, prove it: `get_project_info` for the tree/counts, then
`run_project` + `get_debug_output` + `stop_project` to confirm it loads without
`ERROR: Cannot load` / missing-resource lines. Report the tree you read back and the
clean run — never "I added the nodes." Remind the user to reload their editor.
