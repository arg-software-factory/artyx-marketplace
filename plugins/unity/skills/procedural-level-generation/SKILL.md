---
name: Unity Procedural Level Generation
description: Load when generating a Unity level from code — grid/room/scatter algorithms that batch-instantiate prefabs under one teardown-safe root, with seeded determinism, correct Undo/prefab registration, and a NavMesh bake after. One editor script beats hundreds of tool calls; teardown deletes only the generated root (never Find-all-and-destroy).
---

# Procedural Level Generation

Reach for this when a level is built by an ALGORITHM, not by hand: dungeons, tilemaps, scattered
props, road/room grids. The unit of work is a single `execute_code` C# routine that instantiates
many prefabs under ONE parent — so it is fast, deterministic, and trivially undoable.

Builds on the base `unity-mcp` skill. The anti-scene-wipe rule is CENTRAL here: everything you
generate lives under one root, and teardown deletes ONLY that root.

## 0. Enable groups, verify APIs

```python
manage_tools(action="activate", group="scripting_ext")  # execute_code — the whole engine
manage_tools(action="activate", group="docs")            # unity_reflect before writing C#
```
Before the first bake/generation, `unity_reflect(action="get_type", class_name="UnityEngine.AI.NavMeshBuilder")`
(and `NavMeshSurface` if the AI Navigation package is installed) — the NavMesh API differs by
Unity version.

## 1. Why one script, not N tool calls

Instantiating 200 tiles as 200 `manage_gameobject(action="create")` calls = 200 network
round-trips + repeated hierarchy churn (seconds to minutes, and easy to interrupt mid-run).
The SAME work in one `execute_code` call is a single in-editor loop — sub-second, atomic, one
Undo entry. `batch_execute` caps at 25 commands and is not transactional, so for real generation
prefer `execute_code`. Rule: **loops of spawns → `execute_code`; a handful of distinct edits →
`batch_execute`.**

## 2. The generation contract (every generator follows this)

1. Delete the previous root by exact name (idempotent re-runs — never accumulate duplicates).
2. Create ONE empty root; register it for Undo.
3. Seed a `System.Random(seed)` — NEVER `UnityEngine.Random` (global, non-deterministic across runs).
4. `PrefabUtility.InstantiatePrefab` each piece as a CHILD of root (keeps the prefab link — plain
   `Instantiate` breaks it).
5. `Undo.RegisterCreatedObjectUndo` each spawn (or the root once, then children collapse with it).
6. Return counts for verification.

```python
execute_code(action="execute", code='''
int seed = 1337, cols = 8, rows = 8; float cell = 4f;
var prefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/FloorTile.prefab");
if (prefab == null) return "ERROR: prefab missing";

var old = GameObject.Find("GeneratedLevel");
if (old) Undo.DestroyObjectImmediate(old);              // teardown = ONLY this root

var root = new GameObject("GeneratedLevel");
Undo.RegisterCreatedObjectUndo(root, "Generate Level");
var rng = new System.Random(seed);                       // deterministic

int placed = 0;
for (int x = 0; x < cols; x++)
  for (int z = 0; z < rows; z++) {
    if (rng.NextDouble() < 0.15) continue;               // seeded gaps
    var tile = (GameObject)PrefabUtility.InstantiatePrefab(prefab, root.transform);
    tile.transform.localPosition = new Vector3(x*cell, 0, z*cell);
    tile.name = $"Tile_{x}_{z}";
    placed++;
  }
return $"placed {placed} tiles under GeneratedLevel";
''')
```

## 3. Algorithm patterns (swap the body of §2)

- **Grid / tilemap:** double loop as above; index prefab variants by `rng.Next(variants.Length)`.
- **Rooms + corridors (BSP/random-walk):** carve a `bool[,]` occupancy grid in C# first, THEN
  instantiate only occupied cells — separate the layout math from spawning so you can log the grid
  before touching the scene.
- **Poisson / scatter:** rejection-sample candidate points against a min-distance list; place trees
  under `GeneratedLevel/Foliage` sub-roots so categories teardown independently.
- **Parametrize, don't hardcode:** read `seed`, dimensions, and density from the prompt; echo them
  in the return string so a run is reproducible.

## 4. Bake NavMesh AFTER generation

No dedicated NavMesh tool exists — bake via `execute_code`. Generated geometry must be marked
Navigation-Static (or use `NavMeshSurface` from `com.unity.ai.navigation`).

```python
execute_code(action="execute", code='''
foreach (var t in GameObject.Find("GeneratedLevel").GetComponentsInChildren<Transform>())
    GameObjectUtility.SetStaticEditorFlags(t.gameObject,
        StaticEditorFlags.NavigationStatic | StaticEditorFlags.ContributeGI);
UnityEditor.AI.NavMeshBuilder.ClearAllNavMeshes();
UnityEditor.AI.NavMeshBuilder.BuildNavMesh();            // legacy scene-wide bake
return UnityEngine.AI.NavMesh.CalculateTriangulation().vertices.Length > 0
       ? "navmesh baked" : "NAVMESH EMPTY";
''')
```
If the project uses the AI Navigation package, add/build a `NavMeshSurface` component instead
(`unity_reflect` it first). Empty result = nothing was Navigation-Static or the agent radius is
larger than every walkable gap.

## 5. Teardown (respect the base skill's anti-wipe rule)

```python
execute_code(action="execute", code='''
var root = GameObject.Find("GeneratedLevel");
if (root) { Undo.DestroyObjectImmediate(root); return "cleared"; }
return "nothing to clear";
''')
```
**NEVER** iterate the whole scene deleting objects, and never `manage_scene(action="create")` to
"reset" — that wipes hand-authored lights/cameras and any unsaved work. The named root IS the
teardown boundary.

## Pitfalls

- `UnityEngine.Random` instead of `System.Random(seed)` → non-reproducible levels; QA can't repro.
- Plain `Object.Instantiate(prefab)` → breaks the prefab link; edits to the source prefab stop
  propagating. Always `PrefabUtility.InstantiatePrefab`.
- Forgetting `Undo.Register*` → Ctrl-Z can't remove the level; users are stuck with junk.
- Baking before geometry is Navigation-Static → empty NavMesh, agents fall through.
- Re-running without deleting the old root → 2×, 3× stacked duplicate geometry.

## Verification ritual

1. Count children: `execute_code` → `return GameObject.Find("GeneratedLevel").transform.childCount;`
   (matches expected placements for that seed).
2. `read_console(action="get", types=["error"])` — no null-refs from missing prefabs.
3. `manage_scene(action="screenshot", batch="surround", view_target="GeneratedLevel", max_resolution=256)`
   — eyeball the layout as a 6-angle contact sheet.
4. NavMesh non-empty (§4 return).
5. Re-run with the SAME seed → identical childCount (determinism check). Then `manage_scene(action="save")`.
