---
name: Blender MCP
description: Load this before driving a connected Blender session — scene building, materials, keyframe animation, cameras, lighting via bpy, with the inspect→mutate-small→verify discipline and the bpy recipes (incl. the Blender 5.x layered-action fcurve API) that keep a build correct.
---

# Driving Blender through MCP

You are operating a LIVE Blender session. Every mutation is immediately visible to the user. Work like a technical artist: inspect first, change in small steps, verify after every write. **Always end the task with a final `get_scene_info` read and report the actual objects/animation you read back — not what you intended to create.**

## 1. Know your tool surface

Your available Blender tools are in your tool list with an `mcp_` prefix. Artyx's bundled server exposes:

- `get_scene_info` (read-only) — scene name, object count, objects (name/type/location, first 200).
- `get_object_info` (read-only) — one object's transform, dimensions, vertex/polygon counts, materials.
- `import_model` (write) — import .obj/.fbx/.glb/.gltf/.stl/.ply by absolute path.
- `execute_python` (read/write) — run arbitrary `bpy` code; assign the value to return to a variable named `result` (must be JSON-serializable). ~60s budget per call.

Community servers (e.g. ahujasid/blender-mcp) name the code tool `execute_blender_code` and add asset tools (PolyHaven, Hyper3D). Same discipline applies. If tool names differ from the above, TRUST THE TOOL LIST, not this document.

## 2. The non-negotiable loop

1. **Inspect** — `get_scene_info` before your first mutation. Never assume an empty scene.
2. **Plan silently** — decompose into steps of one `execute_python` call each; each call ≤ ~60 lines of Python.
3. **Mutate small** — one logical change per call (create objects; then materials; then keyframes). Long monolithic scripts hit the timeout and fail atomically — you lose everything in that call.
4. **Verify** — after each write, return proof in `result` (created names, keyframe counts, material assignments). If a later step depends on names, re-derive them from `bpy.data`, never from memory.
5. **Report** — summarize what exists now (objects, animation range, materials), not what you intended.

## 3. bpy that works over MCP (headless socket context)

There is no active viewport/UI context. Prefer the **data API** over `bpy.ops` whenever possible; many operators need a UI context and fail with `context is incorrect` errors.

```python
# CREATE via data API (reliable) — mesh primitives via ops are OK too:
import bpy
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(0, 0, 3))
ball = bpy.context.active_object
ball.name = "BouncingBall"

# MATERIALS — always use nodes:
mat = bpy.data.materials.new("BallRed"); mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.9, 0.1, 0.1, 1.0)
bsdf.inputs["Roughness"].default_value = 0.35
ball.data.materials.append(mat)

# KEYFRAMES — set value, then keyframe_insert with frame=:
scene = bpy.context.scene; scene.frame_start, scene.frame_end = 1, 72
for f, z in [(1, 6), (18, 1), (24, 0.7), (30, 1), (48, 3.2), (72, 1)]:
    ball.location.z = z
    ball.keyframe_insert(data_path="location", index=2, frame=f)
# Squash & stretch: key scale the same way at contact frames.

# INTERPOLATION / easing — Blender 5.x moved Action.fcurves into layered
# actions (channelbags); this helper works on both 4.x and 5.x:
def action_fcurves(action):
    fcs = getattr(action, "fcurves", None)
    if fcs is not None:
        return list(fcs)
    return [fc for layer in action.layers for strip in layer.strips
            for bag in strip.channelbags for fc in bag.fcurves]
for fc in action_fcurves(ball.animation_data.action):
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'

result = {"objects": [o.name for o in bpy.context.scene.objects],
          "frames": [scene.frame_start, scene.frame_end]}
```

Gotchas:

- `bpy.context.active_object` is only valid right after an `_add` operator — capture the reference immediately.
- Deleting: `bpy.data.objects.remove(obj, do_unlink=True)` (not ops).
- Parenting without ops: `child.parent = parent_obj`.
- Collections: `bpy.context.scene.collection.objects.link(obj)` after `bpy.data.objects.new(...)`.
- Lights: `bpy.data.lights.new(name, type='AREA')` → wrap in object → link. Cameras likewise; set `bpy.context.scene.camera = cam_obj`.
- Modifiers: `obj.modifiers.new(name, 'SUBSURF')` then set props; apply only when necessary (`bpy.ops.object.modifier_apply` needs an override: use `with bpy.context.temp_override(object=obj, active_object=obj, selected_objects=[obj]):`).
- Units are meters; +Z is up; rotations are radians (`math.radians(...)`).

## 4. Complex scene recipe

For "build me a scene" requests: (a) ground plane + world lighting first, (b) hero objects with real dimensions and slight rotation variance (nothing axis-perfect — it reads as fake), (c) materials with roughness variation, (d) 3-point lighting (key AREA ~1000W, fill ~300W, rim SUN or SPOT), (e) camera at human-ish height, slight downward tilt, focal 35–50mm, (f) verify with a final `get_scene_info` + per-hero `get_object_info`.

## 5. Animation recipe

Set `frame_start/end` FIRST. Block major poses as keyframes, then adjust interpolation. For cyclic motion add an F-modifier: `fc.modifiers.new('CYCLES')`. For physics (rigid body), prefer keyframed fakes for short clips — simulations need baking and viewport playback the user must trigger.

## 6. When something fails

- Read the Python traceback in the tool result — it names the exact line.
- `context is incorrect` → switch to the data API or `temp_override`.
- Unknown attribute → the user may run a different Blender version; query `bpy.app.version_string` and adapt (e.g. 4.x renamed importers to `bpy.ops.wm.obj_import`).
- Two consecutive failures of the same approach → STOP, re-inspect the scene, and use `web_search` for the exact error message before trying again.
- NEVER re-run a mutation blindly after a timeout — first verify with `get_scene_info` whether it already applied.
