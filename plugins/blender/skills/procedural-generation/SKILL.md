---
name: Procedural Generation
description: Load when generating geometry procedurally in a live Blender session — building Geometry Nodes trees from bpy, scattering/instancing with the collection-instance vs geometry-node instance tradeoff, array/curve structures, seeded reproducible randomness, and knowing exactly when to realize instances vs keep them light.
---

# Procedural Generation (Geometry Nodes + instancing via bpy)

**Reach for this when** the task is "scatter N of these", "generate a forest / city / greeble", "build a fence/rail/pipe along this curve", or "make a parametric structure". Assumes the base **Blender MCP** skill: inspect, mutate in small `execute_python` calls (assign `result`), re-derive objects from `bpy.data` each call, verify, end with `get_scene_info`. No screenshot tool — verify with instance counts, realized vertex totals, and bounding boxes.

Core budget instinct: **instances are cheap, real geometry is not.** 10,000 instanced trees cost almost nothing until you realize them into 10,000 × N verts. Keep things instanced as long as possible; realize only when you must export, boolean, or per-instance edit.

## Build a Geometry Nodes tree programmatically

A geo-nodes modifier wraps a `GeometryNodeTree` node group. You must create the group, declare its Input/Output geometry sockets on `ng.interface`, wire Group Input → ops → Group Output, then attach it as a `'NODES'` modifier. This scatters icospheres on an object's faces:

```python
import bpy
obj = bpy.data.objects["Ground"]              # the surface to scatter on
ng = bpy.data.node_groups.new("Scatter", 'GeometryNodeTree')
ng.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
ng.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
n, l = ng.nodes, ng.links
gin  = n.new("NodeGroupInput");  gin.location  = (-600, 0)
gout = n.new("NodeGroupOutput"); gout.location = (600, 0)
dist = n.new("GeometryNodeDistributePointsOnFaces"); dist.location = (-300, 0)
dist.inputs["Density"].default_value = 8.0
ico  = n.new("GeometryNodeMeshIcoSphere"); ico.location = (-300, -240)
ico.inputs["Radius"].default_value = 0.15
inst = n.new("GeometryNodeInstanceOnPoints"); inst.location = (150, 0)
l.new(gin.outputs["Geometry"],  dist.inputs["Mesh"])
l.new(dist.outputs["Points"],   inst.inputs["Points"])
l.new(ico.outputs["Mesh"],      inst.inputs["Instance"])
l.new(inst.outputs["Instances"], gout.inputs["Geometry"])
mod = obj.modifiers.new("Scatter", 'NODES'); mod.node_group = ng
result = {"node_group": ng.name, "nodes": [x.bl_idname for x in ng.nodes]}
```

Node identifiers are stable strings (`GeometryNodeDistributePointsOnFaces`, `GeometryNodeInstanceOnPoints`, `GeometryNodeMeshIcoSphere`). Verify the wiring by reading `[x.bl_idname for x in ng.nodes]` and `len(ng.links)` back in `result`.

## Randomize rotation/scale per instance (seeded)

Feed a Random Value node into Instance-on-Points' Rotation/Scale sockets, and set the node's `seed` so the result is **reproducible** — same seed, same layout every run.

```python
import bpy
ng = bpy.data.node_groups["Scatter"]
n, l = ng.nodes, ng.links
inst = next(x for x in n if x.bl_idname == "GeometryNodeInstanceOnPoints")
rot = n.new("FunctionNodeRandomValue"); rot.location = (-100, -420)
rot.data_type = 'FLOAT_VECTOR'
rot.inputs["Min"].default_value = (0, 0, 0)
rot.inputs["Max"].default_value = (0, 0, 6.283)   # full yaw spin, radians
rot.inputs["Seed"].default_value = 42             # deterministic
l.new(rot.outputs["Value"], inst.inputs["Rotation"])
result = {"seed": rot.inputs["Seed"].default_value}
```

Also seed the Distribute node (`dist.inputs["Seed"]`) so the point set itself is stable. Reproducibility is a deliverable: state the seed you used in your report.

## Collection instances vs geometry-node instances

Two ways to place many copies — pick by the tradeoff:

- **Collection instance (empty)** — one empty whose `instance_collection` points at a collection. Great for a handful of authored set-pieces you want to move/duplicate as a unit; each is a real object in the outliner.
- **Geometry-node instances** — thousands of points, near-zero object overhead, fully parametric (density/rotation/scale by field). The right tool for scatter at scale.

```python
import bpy
# Collection instance: reuse an authored group without copying its meshes.
src = bpy.data.collections.new("Rock_Kit"); bpy.context.scene.collection.children.link(src)
for name in ("Rock_A", "Rock_B"):
    if name in bpy.data.objects: src.objects.link(bpy.data.objects[name])
empty = bpy.data.objects.new("Rock_Cluster", None)
empty.instance_type = 'COLLECTION'; empty.instance_collection = src
empty.location = (4, 0, 0)
bpy.context.scene.collection.objects.link(empty)
result = {"instance_empty": empty.name, "members": [o.name for o in src.objects]}
```

Rule of thumb: **< ~50 authored placements → collection instances; hundreds-plus of parametric copies → geometry nodes.**

## Array + curve structures (rails, fences, pipes)

For linear/curved repetition without geo-nodes, stack an Array then a Curve modifier. Array duplicates along a relative offset; Curve bends the whole run to follow a path (order matters — Array THEN Curve).

```python
import bpy, math
# A curve path the structure follows.
cu = bpy.data.curves.new("Path", 'CURVE'); cu.dimensions = '3D'
sp = cu.splines.new('BEZIER'); sp.bezier_points.add(2)
for bp, co in zip(sp.bezier_points, [(-3,0,0),(0,2,0),(3,0,0)]):
    bp.co = co; bp.handle_left_type = bp.handle_right_type = 'AUTO'
path = bpy.data.objects.new("Path", cu); bpy.context.scene.collection.objects.link(path)

post = bpy.data.objects["FencePost"]         # a single unit mesh
arr = post.modifiers.new("Array", 'ARRAY')
arr.count = 20; arr.use_relative_offset = True
arr.relative_offset_displace = (1.0, 0, 0)   # step along local X
crv = post.modifiers.new("Curve", 'CURVE'); crv.object = path; crv.deform_axis = 'POS_X'
result = {"count": arr.count, "modifiers": [(m.name, m.type) for m in post.modifiers]}
```

## When (and how) to realize instances

Realize converts instances into editable mesh — needed before **export, boolean, per-instance sculpt, or physics**. It multiplies vertex count, so do it late and measure the cost first.

- In a geo-nodes tree: add `GeometryNodeRealizeInstances` right before Group Output.
- To bake the whole modifier to real mesh: `bpy.ops.object.convert(target='MESH')` under a `temp_override(active_object=obj, selected_editable_objects=[obj])`. Irreversible — the tree is gone after.

Always predict the blowup: `points × verts_per_instance`. Read `len(obj.data.vertices)` before and after; if it jumped from thousands to millions, you realized too eagerly.

## Pitfalls

- **`result` must be a dict.** Every `execute_python` returns a JSON dict — return counts and names, not the geometry.
- **Socket/field type mismatch.** Random Value must match the target socket (`FLOAT_VECTOR` for Rotation/Scale). A wrong `data_type` silently no-ops or errors — verify by reading the value back.
- **Unseeded randomness is a bug here.** Any scatter you can't reproduce is not deliverable. Seed both Distribute and every Random Value node; report the seed.
- **Realizing instances too early** tanks performance and memory (see the base skill's timeout risk). Keep instanced; realize only for the reason that forced it.
- **Node group left unattached.** Creating `ng` does nothing until `obj.modifiers.new(..., 'NODES').node_group = ng`. Verify the modifier exists on the object, not just that the group exists.
- **`.new("BEZIER")` splines start with one point** — `add(n)` to reach n+1. Off-by-one here silently drops your last control point.

## Verification ritual

1. After building a tree: `result` reports node bl_idnames + link count → the graph is wired.
2. After scatter: query realized/evaluated point count. Use the evaluated dependency graph to count instances:
   `deg = bpy.context.evaluated_depsgraph_get(); ev = obj.evaluated_get(deg); result = {"instances": len(ev.instance_ids) if hasattr(ev,'instance_ids') else None}` — or realize into a temp and read verts.
3. `get_object_info` on the base object → confirm dimensions/bounding box match the intended footprint.
4. State the **seed** and instance count in your report; final `get_scene_info` for the object roster.
