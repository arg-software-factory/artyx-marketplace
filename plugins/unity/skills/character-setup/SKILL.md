---
name: Unity Character Setup
description: Load when assembling a playable/animated character in Unity — importing a rigged model as Humanoid, building an Animator Controller (states/transitions/parameters/layers/masks), attaching gameplay components, and shipping it as a prefab (+ skin variants). Prefab-first, avoids instance-vs-asset and missing-script traps.
---

# Character Setup (prefab-first)

Reach for this the moment a character must MOVE or be REUSED: a rigged FBX/GLB needing a Humanoid
avatar, an Animator Controller, gameplay scripts, and a prefab you can drop many times. Build ONCE,
verify each write, finish as a prefab asset — never leave a hero as a loose scene GameObject.

Builds on the base `unity-mcp` skill (inspect first, small mutations, `read_console` after writes,
never re-`create`/`load` a scene). Verify C# APIs with `unity_reflect` before any `execute_code`.

## 0. Enable the tool groups you need (only `core` is on by default)

Non-core tools are INVISIBLE until their group is activated. If a call returns "unknown tool", its
group is off — activate then retry (`manage_tools(action="list_groups")` shows what's live).

```python
manage_tools(action="activate", group="animation")      # manage_animation
manage_tools(action="activate", group="scripting_ext")   # execute_code (rig import, masks, variants)
manage_tools(action="activate", group="docs")            # unity_reflect / unity_docs
# core (already on): manage_gameobject, manage_components, manage_prefabs, manage_material, manage_editor
```

## 1. Import the model as Humanoid

There is NO dedicated rig/avatar tool. Set the import type on the `ModelImporter` via `execute_code`
(no domain reload risk — compiled in-memory), then verify the avatar was created.

```python
execute_code(action="execute", code='''
var path = "Assets/Characters/Hero.fbx";
var imp = (ModelImporter)AssetImporter.GetAtPath(path);
imp.animationType = ModelImporterAnimationType.Human;   // Human | Generic | Legacy
imp.avatarSetup   = ModelImporterAvatarSetup.CreateFromThisModel;
imp.SaveAndReimport();
return AssetDatabase.LoadAllAssetsAtPath(path).OfType<Avatar>().Any(a => a.isHuman && a.isValid);
''')
```
`return true` = a valid Humanoid avatar exists. If false, the rig has no mappable bones — fall back
to `Generic`. Then place an instance: `manage_gameobject(action="create", name="Hero",
prefab_path="Assets/Characters/Hero.fbx")` (the imported model root works as a prefab source).

## 2. Build the Animator Controller (manage_animation)

Action-specific keys go in `properties` (verbatim from `ManageAnimation.cs`). Order: create →
parameters → states → transitions. `CTRL = "Assets/Characters/Hero.controller"` below.

```python
manage_animation(action="controller_create", controller_path=CTRL)
manage_animation(action="controller_add_parameter", controller_path=CTRL,
  properties={"parameterName": "Speed", "parameterType": "float", "defaultValue": 0})
# parameterType: float | int | bool | trigger (repeat per parameter, e.g. "Jump"/trigger)
manage_animation(action="controller_add_state", controller_path=CTRL,
  properties={"stateName": "Idle", "clipPath": "Assets/Anim/Idle.anim", "isDefault": True})
manage_animation(action="controller_add_state", controller_path=CTRL,
  properties={"stateName": "Run", "clipPath": "Assets/Anim/Run.anim", "speed": 1.0})
manage_animation(action="controller_add_transition", controller_path=CTRL,
  properties={"fromState": "Idle", "toState": "Run", "hasExitTime": False, "duration": 0.15,
              "conditions": [{"parameter": "Speed", "mode": "greater", "threshold": 0.1}]})
```
Verify with `controller_get_info` — read the state and parameter list back; a silently-dropped
state means a bad `clipPath`.

## 3. Locomotion via blend tree (cleaner than many states) + layers

```python
manage_animation(action="controller_create_blend_tree_1d", controller_path=CTRL,
  properties={"stateName": "Locomotion", "blendParameter": "Speed"})
for clip, thr in [("Idle",0),("Walk",2),("Run",6)]:
    manage_animation(action="controller_add_blend_tree_child", controller_path=CTRL,
      properties={"stateName": "Locomotion", "clipPath": f"Assets/Anim/{clip}.anim", "threshold": thr})
```
2D grids: `controller_create_blend_tree_2d` with `blendParameterX/Y` + child `position:[x,y]`.
Upper-body/additive layers: `controller_add_layer` (`layerName`, `weight`, `blendingMode`). Avatar
masks have no tool — author with `execute_code` (`new AvatarMask()` →
`SetHumanoidBodyPartActive(part, active)` → `AssetDatabase.CreateAsset(mask, path)`), then reference
the `.mask` from the layer.

## 4. Attach gameplay components + assign the controller

```python
manage_components(action="add", target="Hero", component_type="CharacterController")
create_script(path="Assets/Scripts/HeroLocomotion.cs", contents="...MonoBehaviour...")
# read_console after the script write — a compile error freezes the whole tool surface
read_console(action="get", types=["error"])
manage_components(action="add", target="Hero", component_type="HeroLocomotion")
# Wire the controller onto the Animator (component the model root already has):
manage_animation(action="controller_assign", target="Hero",
  controller_path="Assets/Characters/Hero.controller")
```

## 5. Ship as a prefab (+ skin variants)

```python
manage_prefabs(action="create_from_gameobject", target="Hero",
  prefab_path="Assets/Characters/Hero.prefab", allow_overwrite=False)
```
Variants have no tool — instantiate the base, restyle, `SaveAsPrefabAsset` (Unity detects the
instance and writes a true variant):

```python
execute_code(action="execute", code='''
var basep = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Characters/Hero.prefab");
var inst  = (GameObject)PrefabUtility.InstantiatePrefab(basep);       // connected instance
var r = inst.GetComponentInChildren<Renderer>();
if (r) r.sharedMaterial = AssetDatabase.LoadAssetAtPath<Material>("Assets/Characters/Red.mat");
PrefabUtility.SaveAsPrefabAsset(inst, "Assets/Characters/Hero_Red.prefab");   // → variant
Object.DestroyImmediate(inst); return "variant saved";
''')
```

## Pitfalls

- **Instance vs asset.** Editing a scene instance does NOT change the prefab. To edit the ASSET,
  use `manage_prefabs(action="modify_contents", prefab_path=...)` or the stage
  (`manage_editor` `open_prefab_stage` → edits → `save_prefab_stage` → `close_prefab_stage`).
- **Missing-script ghosts.** A renamed/failed MonoBehaviour leaves a "Missing (Mono Script)" slot
  that breaks the prefab. After every `create_script`, `read_console(types=["error"])`; add the
  component only once it compiles clean.
- **Wrong avatar type.** Humanoid clips on a Generic avatar (or reverse) silently no-op the motion —
  confirm §1 returned a valid human avatar first.
- **AnyState loops.** An `"AnyState"` transition with `hasExitTime:false` and no condition fires every
  frame — always give AnyState transitions a trigger/bool condition.

## Verification ritual

1. `controller_get_info` — states, parameters, layers match intent.
2. `manage_prefabs(action="get_hierarchy", prefab_path=...)` — components present, no "Missing".
3. Missing-ref scan on the instance: `execute_code` →
   `return GameObject.Find("Hero").GetComponentsInChildren<Component>(true).Count(c => c == null);` → `0`.
4. `manage_editor` play → `read_console(types=["error"])` → stop (once). Then `manage_scene(action="save")`
   and report the read-back hierarchy.
