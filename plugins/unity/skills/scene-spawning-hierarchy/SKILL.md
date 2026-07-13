---
name: Unity Scene Spawning & Hierarchy
description: Load when assembling a Unity scene by hand — spawning and parenting many objects, organizing the hierarchy under named roots, setting local vs world transforms, tags/layers, and static/lightmap flags. Batch one script over N tool calls (quantified), keep the hierarchy clean, and treat additive scene loads as the one careful exception to the base skill's open-once rule.
---

# Scene Spawning & Hierarchy

Reach for this when you're COMPOSING a scene — a room of props, a UI of buttons, a set of spawn
points — rather than running a generation algorithm (that's `procedural-level-generation`). The
goal is a scene a human could open and immediately navigate: grouped, named, correctly parented.

Builds on the base `unity-mcp` skill (inspect first, one concern per call, verify writes, open the
scene exactly ONCE). Read `mcpforunity://project/info` up front for `renderPipeline` (shader
choice) and `activeInputHandler`.

## 0. Groups

Almost everything here is `core` (already on): `manage_gameobject`, `manage_components`,
`manage_editor`, `manage_material`, `manage_scene`, `find_gameobjects`, `batch_execute`. For
batched spawn loops enable `scripting_ext` (`execute_code`).

## 1. One script beats N tool calls — quantified

Spawning 30 objects via 30 `manage_gameobject(action="create")` calls = 30 round-trips (each a
request → Unity main-thread dispatch → response). One `execute_code` loop does it in a single
in-editor pass — typically **10–30× less wall-clock** and one Undo entry instead of 30. Decision:

| Situation | Use |
|---|---|
| 1–5 distinct, hand-specified objects | `manage_gameobject` per object (clearest) |
| A handful of heterogeneous edits | `batch_execute(commands=[...], fail_fast=True)` (≤25, NOT transactional) |
| A loop / grid / ≥~8 similar spawns | `execute_code` C# loop |

```python
execute_code(action="execute", code='''
var root = new GameObject("Props");
Undo.RegisterCreatedObjectUndo(root, "Spawn Props");
var prefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Crate.prefab");
var spots = new Vector3[]{ new(0,0,0), new(2,0,0), new(0,0,2), new(2,0,2) };
foreach (var p in spots) {
  var o = (GameObject)PrefabUtility.InstantiatePrefab(prefab, root.transform);
  o.transform.localPosition = p;                    // LOCAL — relative to root
}
return root.transform.childCount;
''')
```

## 2. Hierarchy hygiene (non-negotiable)

- **Group under named empty roots**: `Environment`, `Lighting`, `Props`, `Enemies`, `UI`, `_Managers`.
  Never leave dozens of siblings at scene root.
- **Deterministic names**: `SpawnPoint_01`, not `GameObject (7)`. Read names back — Unity appends
  `(1)` on collisions (`find_gameobjects` to detect dupes).
- **One responsibility per root** so `procedural-level-generation`-style teardown stays trivial.
- Parent at creation when you can: `manage_gameobject(action="create", name="Torch", parent="Environment", ...)`.

## 3. Parenting & local-vs-world space (the #1 transform bug)

`manage_gameobject(action="modify", position=[...])` sets **world** position; reparenting then keeps
world position but recomputes local. If you set position BEFORE parenting under a moved/scaled root,
the child jumps. Rule: **parent first, then position in the parent's local frame** (via `execute_code`
using `localPosition`), or parent under a root that sits at the origin with scale 1.

```python
# Move relative to another object without hand-computing coordinates:
manage_gameobject(action="move_relative", target="Torch", reference_object="Wall",
  direction="up", distance=2.0, world_space=True)   # left|right|up|down|forward|back
# Aim an object at another:
manage_gameobject(action="look_at", target="Turret", look_at_target="Player")
```
Scaled parents distort children — keep organizational roots at scale `[1,1,1]`.

## 4. Tags, layers, static flags — create BEFORE assigning

Assigning a tag/layer that doesn't exist silently fails. Register first via `manage_editor`:

```python
manage_editor(action="add_tag", tag_name="Enemy")
manage_editor(action="add_layer", layer_name="Interactable")
manage_gameobject(action="modify", target="Goblin", layer="Interactable")   # then assign
```
Tag assignment goes through the component/property path; confirm by reading the object back.

Static + lightmap flags have no dedicated tool — set them with `execute_code` on non-moving geometry
(required before a lightmap/GI bake actually includes an object):

```python
execute_code(action="execute", code='''
int n=0;
foreach (var t in GameObject.Find("Environment").GetComponentsInChildren<Transform>()) {
  GameObjectUtility.SetStaticEditorFlags(t.gameObject,
      StaticEditorFlags.ContributeGI | StaticEditorFlags.BatchingStatic
    | StaticEditorFlags.OccluderStatic | StaticEditorFlags.NavigationStatic);
  n++;
}
return $"flagged {n} objects static";
''')
```
`BatchingStatic` enables static batching (fewer draw calls); `ContributeGI` is what lets
`manage_graphics(action="bake_start")` bake the object into lightmaps.

## 5. Additive scenes — the careful exception to "open once"

The base skill forbids re-`create`/`load` because both DISCARD the current scene. Loading a scene
ADDITIVELY does not — it layers on top. There is no additive flag on `manage_scene(action="load")`,
so use `execute_code`:

```python
execute_code(action="execute", code='''
var s = UnityEditor.SceneManagement.EditorSceneManager.OpenScene(
    "Assets/Scenes/Props.unity",
    UnityEditor.SceneManagement.OpenSceneMode.Additive);   // Additive — NOT Single
return s.isLoaded ? "additive loaded" : "failed";
''')
```
**Only `OpenSceneMode.Additive`** is safe. `OpenSceneMode.Single` (and `manage_scene(action="load")`)
wipe unsaved work exactly like the base-skill hazard. Save each scene explicitly; a multi-scene
setup saves per-scene.

## Pitfalls

- Setting world position then reparenting under a non-origin root → object visibly jumps.
- Assigning a tag/layer before creating it → silent no-op; the object keeps `Untagged`/`Default`.
- Flat hierarchy (everything at root) → unusable for humans and impossible to teardown cleanly.
- Expecting `manage_scene(action="load")` to be additive → it replaces and wipes. Use §5.
- `batch_execute` isn't transactional — a mid-batch failure leaves partial state; set `fail_fast=True`
  and re-read the hierarchy after.

## Verification ritual

1. `manage_scene(action="get_hierarchy", include_transform=True)` — every object under its intended
   root, expected transforms, no stray root-level siblings, no `(1)` duplicate names.
2. `find_gameobjects(search_term="Enemy", search_method="by_tag")` — tags/layers actually applied.
3. `read_console(action="get", types=["error"])` — clean.
4. `manage_scene(action="screenshot", include_image=True, max_resolution=512)` — composition reads right.
5. `manage_scene(action="save")` and report the read-back hierarchy, not the intended one.
