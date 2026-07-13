---
name: Character Modeling
description: Load when building or rigging a stylized character in a live Blender session — reference-block proportions, mirror + subsurf workflow, join-vs-collection decisions, armature creation, automatic-weight parenting, and face shape keys, with the scale=1 / apply-transforms discipline that keeps rigs from exploding.
---

# Character Modeling (procedural, live Blender)

**Reach for this when** the task is "model a character / creature / mascot", "rig this mesh", "add a face rig", or "set up blend shapes". Assumes the base **Blender MCP** skill is loaded: inspect first, mutate in small `execute_python` calls (assign to `result`), re-derive objects from `bpy.data` every call (Python locals do NOT persist between calls), verify after each write, end with a final `get_scene_info`.

There is no viewport screenshot tool. Verify with numbers: `get_object_info` (dimensions, vertex/poly counts, modifier stack via a query), bounding-box math, and symmetry checks. Optionally render a PNG to disk for the human, but you cannot see it — never claim a look you did not measure.

## The proportion-block pass (do this first)

Block the silhouette with primitives at REAL human dimensions before any detail. A stylized adult reads at ~1.7 m tall; heads are ~1/6 of height for realistic, ~1/4 for stylized. Build ONE half only — the mirror modifier makes the other.

```python
import bpy
# Torso block on the +X half, sitting on the ground plane (feet at z=0).
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 1.0))
torso = bpy.context.active_object          # capture immediately after _add
torso.name = "CH_Torso"
torso.scale = (0.28, 0.16, 0.42)           # ~0.56 wide, 0.84 tall
# Apply the block scale NOW so modifiers/rig see scale=1 (see pitfalls).
with bpy.context.temp_override(active_object=torso, selected_editable_objects=[torso]):
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
result = {"name": torso.name, "dims": [round(v,3) for v in torso.dimensions],
          "scale": [round(v,3) for v in torso.scale]}   # scale must be [1,1,1]
```

## Mirror + subsurf modeling workflow

Model the +X half; mirror across X with clipping so the seam welds. Subsurf smooths. Keep modifiers LIVE (unapplied) until the shape is final — you can still edit one half.

```python
import bpy
obj = bpy.data.objects["CH_Torso"]
mir = obj.modifiers.new("Mirror", 'MIRROR')
mir.use_axis[0] = True          # mirror across local X
mir.use_clip = True             # verts on the seam can't cross the centerline
mir.use_mirror_merge = True
mir.merge_threshold = 0.001
sub = obj.modifiers.new("Subsurf", 'SUBSURF')
sub.levels = 2                  # viewport
sub.render_levels = 3           # final
# Order matters: Mirror BEFORE Subsurf, or the seam creases wrong.
result = {"modifiers": [(m.name, m.type) for m in obj.modifiers]}
```

Modifier reads are your verification: `[(m.name, m.type) for m in obj.modifiers]` proves the stack, and `len(obj.data.vertices)` shows the base cage count (subsurf multiplies at render only).

## Join vs collections — pick deliberately

- **Join** (`bpy.ops.object.join`, needs a context override) when parts share one material logic and deform as one skin (a merged body). One object, one weight set.
- **Collections** when parts stay distinct (armor pieces, hair cards, props): `coll = bpy.data.collections.new("CH_Accessories"); bpy.context.scene.collection.children.link(coll)` then `coll.objects.link(obj)`. Easier to hide/swap; each keeps its own origin.

```python
import bpy
parts = [bpy.data.objects[n] for n in ("CH_Torso", "CH_Head")]
with bpy.context.temp_override(active_object=parts[0],
        selected_editable_objects=parts, selected_objects=parts):
    bpy.ops.object.join()       # everything folds into parts[0]
result = {"joined_into": parts[0].name, "verts": len(parts[0].data.vertices)}
```

## Armature + automatic-weight parenting

Build bones in EDIT mode via `edit_bones`, then parent the mesh with heat-map weights. Apply the mesh's scale FIRST (scale≠1 wrecks automatic weights and bone roll).

```python
import bpy
arm_data = bpy.data.armatures.new("CH_Rig")
arm = bpy.data.objects.new("CH_Rig", arm_data)
bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
spine = arm_data.edit_bones.new("spine");  spine.head = (0,0,0.9); spine.tail = (0,0,1.4)
neck  = arm_data.edit_bones.new("neck");   neck.head = spine.tail;  neck.tail = (0,0,1.6); neck.parent = spine
bpy.ops.object.mode_set(mode='OBJECT')

mesh = bpy.data.objects["CH_Torso"]
with bpy.context.temp_override(active_object=arm,
        selected_editable_objects=[mesh, arm], selected_objects=[mesh, arm]):
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')   # heat-map weights
result = {"bones": [b.name for b in arm_data.bones],
          "mesh_parent": mesh.parent.name if mesh.parent else None,
          "vgroups": [g.name for g in mesh.vertex_groups]}
```

If `ARMATURE_AUTO` fails in the headless socket (heat weighting occasionally needs a fuller context), fall back to an explicit modifier + empty groups: `m = mesh.modifiers.new("Armature",'ARMATURE'); m.object = arm`, add a `mesh.vertex_groups.new(name=b.name)` per bone, and weight-paint later. Report which path you took.

## Face shape keys (blend shapes)

Basis first, then one key per expression. Sculpt by offsetting `key.data[i].co`; drive with `key.value` (0–1). Keys store absolute vertex positions relative to Basis.

```python
import bpy
head = bpy.data.objects["CH_Head"]
if not head.data.shape_keys:
    head.shape_key_add(name="Basis")
smile = head.shape_key_add(name="Smile")
# Example: pull a mouth-corner vertex band up+out. Real work targets a vgroup.
for i, v in enumerate(head.data.vertices):
    if v.co.z < 0.05 and abs(v.co.x) > 0.03:      # crude mouth-corner selector
        smile.data[i].co = v.co + Vector((0.0, 0.0, 0.01))
smile.value = 1.0
result = {"shape_keys": [k.name for k in head.data.shape_keys.key_blocks],
          "smile_value": head.data.shape_keys.key_blocks["Smile"].value}
```
`Vector` needs `from mathutils import Vector` (or `import mathutils; mathutils.Vector`). Verify by reading back `key_blocks` names and values — never assume a key applied.

## Pitfalls

- **Apply transforms before rigging.** Non-1 scale ruins automatic weights, bone roll, and modifier results. Run `transform_apply(scale=True)` the moment a block is sized. Verify `obj.scale == [1,1,1]`.
- **Scale=1 discipline throughout.** Never rig, add cloth, or bake with a scaled object. Rotation too — apply it before parenting.
- **N-gons and inverted normals.** Subsurf and shading hate n-gons; keep quads/tris. Recalc normals with `bpy.ops.mesh.normals_make_consistent(inside=False)` inside an EDIT-mode + `temp_override`, or check `mesh.polygons` loop counts (`len(p.vertices) > 4` = n-gon) as a data-only audit.
- **Modifier order.** Mirror before Subsurf before Armature. Wrong order = split seam or double-smoothing.
- **`active_object` is stale after mode switches / joins.** Re-fetch by name each call; locals never survive between `execute_python` calls.
- **Do not apply modifiers early.** Applying Mirror/Subsurf freezes topology and kills the half-editing workflow. Apply only at the very end, if at all.

## Verification ritual

1. `get_object_info` on each character part → confirm `dimensions` are human-plausible and `scale` is `[1,1,1]`.
2. Query the modifier stack + shape-key list + vertex-group names in one `execute_python` (`result` dict) — proves rig plumbing exists.
3. Symmetry sanity: read min/max X of the mesh; a mirrored body should be near-symmetric about x=0.
4. Final `get_scene_info` → report actual object names, counts, and the rig/shape-key state you read back, not what you intended.
