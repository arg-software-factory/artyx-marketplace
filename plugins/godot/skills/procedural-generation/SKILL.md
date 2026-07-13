---
name: Godot Procedural Generation
description: Load for data-driven / procedural content in Godot through godot-mcp — seeded RandomNumberGenerator for reproducibility, TileMapLayer generation from script, MultiMeshInstance for mass spawning, chunking for large worlds, the export_mesh_library workflow for GridMap pipelines, and verifying generated output via run_project + get_debug_output assertions.
---

# Procedural generation in Godot

Generation logic lives in GDScript (see the `gdscript-gameplay` boundary — you design it,
the human attaches/autoloads it, you verify by running). The one MCP tool that directly
does a generation step is `export_mesh_library`; everything else is scripted patterns you
author and prove with the run/debug loop.

## 1. Seed everything — reproducibility is non-negotiable

Never use the global `randi()` for world gen; a bug you can't reproduce is a bug you
can't fix. Own an explicit, `@export`-ed seed:

```gdscript
@export var world_seed: int = 1337
var _rng := RandomNumberGenerator.new()

func _ready() -> void:
    _rng.seed = world_seed                       # same seed -> identical world
    print("[Gen] seed=", world_seed)             # sentinel for get_debug_output
    # For coherent terrain use FastNoiseLite, seeded the same way:
    var noise := FastNoiseLite.new()
    noise.seed = world_seed
    var elevation := noise.get_noise_2d(x, y)    # -1..1, smooth
```

Log the seed on every run so any generated result is reproducible on demand.

## 2. TileMapLayer generation (Godot 4.3+; TileMap is legacy)

Populate a `TileMapLayer` node from script with `set_cell`:
`set_cell(coords: Vector2i, source_id: int, atlas_coords: Vector2i, alternative := 0)`.

```gdscript
extends TileMapLayer

@export var width: int = 64
@export var height: int = 64
@export var source_id: int = 0                 # id of the tile source in the TileSet
const GRASS := Vector2i(0, 0)
const WALL  := Vector2i(1, 0)

func _ready() -> void:
    var rng := RandomNumberGenerator.new(); rng.seed = 42
    var placed := 0
    for x in width:
        for y in height:
            var atlas := WALL if rng.randf() < 0.30 else GRASS
            set_cell(Vector2i(x, y), source_id, atlas)
            placed += 1
    print("[TileGen] placed=", placed)         # assert count in debug output
```

The `TileSet` (with its atlas source) must already exist on the node — that resource
is authored in the editor or via `add_node`+properties; the script only fills cells.

## 3. Mass spawning with MultiMeshInstance (thousands of instances, one draw call)

For grass, rocks, crowds — never `instantiate()` thousands of nodes (each costs a node +
script + physics). Use `MultiMeshInstance3D` (or `2D`): one node, N GPU-instanced transforms.

```gdscript
extends MultiMeshInstance3D

@export var count: int = 2000
@export var area: float = 50.0

func _ready() -> void:
    var rng := RandomNumberGenerator.new(); rng.seed = 7
    var mm := MultiMesh.new()
    mm.transform_format = MultiMesh.TRANSFORM_3D
    mm.mesh = multimesh.mesh if multimesh else BoxMesh.new()
    mm.instance_count = count
    for i in count:
        var p := Vector3(rng.randf_range(-area, area), 0.0, rng.randf_range(-area, area))
        var b := Basis().rotated(Vector3.UP, rng.randf() * TAU)
        mm.set_instance_transform(i, Transform3D(b, p))
    multimesh = mm
    print("[MMI] instances=", count)
```

Set `instance_count` BEFORE `set_instance_transform`. All instances share one mesh +
material — vary them via per-instance transform (and `set_instance_color` if the material
enables instance color).

## 4. Chunking for large / streaming worlds

Generate on a grid of chunks keyed by `Vector2i`; build/free chunks around the player
so you never hold the whole world in memory.

```gdscript
@export var chunk_size: int = 16
var _loaded: Dictionary = {}                   # Vector2i -> Node

func update_chunks(center: Vector2i, radius: int) -> void:
    var wanted := {}
    for dx in range(-radius, radius + 1):
        for dy in range(-radius, radius + 1):
            var c := center + Vector2i(dx, dy)
            wanted[c] = true
            if not _loaded.has(c):
                _loaded[c] = _build_chunk(c)   # deterministic from (world_seed, c)
    for c in _loaded.keys():                    # free what left the radius
        if not wanted.has(c):
            _loaded[c].queue_free(); _loaded.erase(c)
```
`center` = the player's chunk (`Vector2i(floori(pos.x/chunk_size), floori(pos.y/chunk_size))`).

Each chunk must be **deterministic from `(world_seed, chunk_coord)`** — derive a
per-chunk seed (`rng.seed = hash(c) ^ world_seed`) so re-entering a chunk regenerates
it identically. Never store generated chunk contents; store only the seed.

## 5. export_mesh_library — the GridMap pipeline (a real MCP tool)

`GridMap` places 3D tiles from a `MeshLibrary`. Build that library with the MCP tool
`export_mesh_library { projectPath, scenePath, outputPath, meshItemNames? }` — it turns a
scene of `MeshInstance3D` children into a `.meshlib`/`.tres` for GridMap.

Pipeline:
1. `create_scene { rootNodeType: "Node3D", scenePath: "res://gen/kit.tscn" }`.
2. `add_node` a `MeshInstance3D` per tile (wall, floor, corner…) — each `nodeName`
   becomes the library item name. Then `save_scene`.
3. `export_mesh_library { projectPath, scenePath: "res://gen/kit.tscn",
   outputPath: "res://gen/kit.meshlib", meshItemNames: ["wall","floor","corner"] }`
   (omit `meshItemNames` to export all).
4. Assign the `.meshlib` to a `GridMap` node's `mesh_library`; place cells from script
   with `GridMap.set_cell_item(Vector3i, item_id)`.

## 6. Verify generation with assertions, not vibes

Generated output is only "correct" if you asserted it. Print the facts you care about
(cell/instance/chunk counts, min/max elevation), then `run_project` → `get_debug_output`
→ check the numbers → `stop_project`. Acceptance example: output shows
`[TileGen] placed=4096` and `[MMI] instances=2000` with no `ERROR`/`SCRIPT ERROR` line.
A wrong count = a loop bound or rng range bug — fix the script text and re-run. Report
the captured numbers, never "it generated fine."
