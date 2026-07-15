---
name: Scene Assembly & Performance
description: Load when assembling or optimizing a large Blender scene — collection hierarchy hygiene and naming conventions, batch-spawning many objects in one execute call (quantified vs N calls), linked-duplicate vs full-copy and mesh data-block reuse for memory, decimation/LOD passes, and a data-driven verification loop (per-collection counts, bounding-box sanity) for scenes too big to eyeball.
---

# Scene Assembly & Performance (live Blender)

**Reach for this when** the task is "build/lay out a big scene", "spawn 200 of these", "it's getting slow/heavy", or "organize this mess". Assumes the base **Blender MCP** skill: inspect, mutate in small `execute_python` calls (assign `result`), re-derive objects from `bpy.data` each call, verify counts after every write, end with a final `get_scene_info`. No screenshot tool — at scale you MUST verify with numbers: per-collection object counts, shared-datablock users, and bounding-box sampling. You cannot eyeball 500 objects; you audit them.

## Batch spawn in ONE call — quantify the win

Each `execute_python` is a socket round-trip with a ~60s budget. Spawning N objects in N tool calls pays N round-trips and risks N timeouts; one loop in one call pays one. **100 objects = 1 call, not 100.** Build the loop, keep it under ~60s of work, and return only counts.

```python
import bpy, random
rng = random.Random(1234)                         # seeded -> reproducible layout
coll = bpy.data.collections.get("Props") or bpy.data.collections.new("Props")
if coll.name not in bpy.context.scene.collection.children:
    bpy.context.scene.collection.children.link(coll)
# Reuse ONE mesh datablock across all spawns (see memory section).
base = bpy.data.meshes.get("crate_mesh")
if base is None:
    bpy.ops.mesh.primitive_cube_add(size=1); tmp = bpy.context.active_object
    base = tmp.data; base.name = "crate_mesh"
    bpy.data.objects.remove(tmp, do_unlink=True)
for i in range(100):
    o = bpy.data.objects.new(f"Prop_{i:03d}", base)     # shares base mesh
    o.location = (rng.uniform(-10,10), rng.uniform(-10,10), 0)
    o.rotation_euler = (0, 0, rng.uniform(0, 6.283))
    coll.objects.link(o)
result = {"spawned": 100, "collection": coll.name, "mesh_users": base.users}
```

`base.users == 100` proves every prop shares one datablock — that's the memory win, verified.

## Collection hierarchy hygiene + naming

A big scene is navigable only if it's organized. Nest collections by role; name with a stable prefix scheme so batch queries and greps work.

```python
import bpy
scene = bpy.context.scene
def ensure_coll(name, parent=None):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    target = parent or scene.collection
    if c.name not in target.children: target.children.link(c)
    return c
env  = ensure_coll("ENV")                    # ENV / CHAR / PROP / LGT / CAM
props = ensure_coll("ENV_Props", env)
lights = ensure_coll("LGT")
result = {"tree": {c.name: [ch.name for ch in c.children] for c in scene.collection.children}}
```

Conventions that pay off: role prefixes (`ENV_`, `CHAR_`, `PROP_`, `LGT_`, `CAM_`), zero-padded indices (`Prop_007` sorts correctly), and one object linked to exactly one collection (avoid accidental multi-links — they double-count and double-render).

## Linked duplicates vs full copies

- **Linked duplicate** (`o.copy()` keeping `o.data`) — shares the mesh; edits to one propagate to all. Near-zero extra memory. Use for repeated identical assets (crates, bricks, foliage).
- **Full copy** (`o.copy()` then `o.data = o.data.copy()`) — independent mesh; edit freely. Use only when each instance must differ topologically.

```python
import bpy
src = bpy.data.objects["Prop_000"]
linked = src.copy(); linked.location.x += 2                 # shares src.data
bpy.context.scene.collection.objects.link(linked)
full = src.copy(); full.data = src.data.copy(); full.location.x += 4  # own mesh
bpy.context.scene.collection.objects.link(full)
result = {"src_mesh_users": src.data.users, "full_mesh_users": full.data.users}  # src>1, full==1
```

Prefer linked/instances at scale; a scene of full copies multiplies memory by the copy count.

## Decimation / LOD passes

Cut polygon budget on background/hero-distant assets with a Decimate modifier. Build LODs by copying, decimating at ratios (1.0 / 0.5 / 0.15), and swapping by distance/collection visibility.

```python
import bpy
def make_lod(obj, ratio, suffix):
    lod = obj.copy(); lod.data = obj.data.copy(); lod.name = f"{obj.name}_{suffix}"
    d = lod.modifiers.new("Decimate", 'DECIMATE'); d.decimate_type = 'COLLAPSE'; d.ratio = ratio
    bpy.context.scene.collection.objects.link(lod); return lod
hero = bpy.data.objects["Hero"]
lod1 = make_lod(hero, 0.5,  "LOD1")
lod2 = make_lod(hero, 0.15, "LOD2")
# Estimated final tris after apply = base_polys * ratio (COLLAPSE).
result = {"base_polys": len(hero.data.polygons),
          "lod1_ratio": 0.5, "lod2_ratio": 0.15}
```

Verify the reduction by applying on a probe copy and reading `len(data.polygons)`, or trust the COLLAPSE ratio (final ≈ base × ratio). Report the poly budget you hit.

## Memory discipline

- **Share datablocks** — one mesh, many objects (`base.users` high). Same for materials (`obj.data.materials.append(shared_mat)`) and node groups.
- **Purge orphans** after heavy churn: `bpy.data.orphans_purge(do_recursive=True)` frees unused meshes/images/materials left by deletions.
- **Delete with unlink**: `bpy.data.objects.remove(obj, do_unlink=True)` — leftover fake-user datablocks silently bloat the file.
- **Don't realize instances** unless forced (see the procedural-generation skill); realized geometry is where memory explodes.

## Pitfalls

- **N calls instead of one loop** — the single biggest avoidable cost. Batch spawns/edits into one `execute_python`; keep each call under the ~60s budget (split into a few hundred-object chunks if huge).
- **Full copies where linked would do** — multiplies memory by N. Default to linked/shared unless per-instance topology differs.
- **Multi-collection links** double-count objects and double-render them. One object, one home collection.
- **Seeded layout, or it's not reproducible.** Use `random.Random(seed)`; report the seed.
- **Forgetting `do_unlink=True`** on delete leaves orphan datablocks; run `orphans_purge` after big deletes.
- **Trusting `get_scene_info`'s cached snapshot** at scale — for authoritative live counts, query `bpy.data`/`scene.objects` via `execute_python`.

## Verification ritual (data-driven — mandatory at scale)

1. **Per-collection census** in one call:
   `result = {c.name: len(c.all_objects) for c in bpy.data.collections}` — every object accounted for, no surprise multi-links.
2. **Shared-datablock audit**: `{m.name: m.users for m in bpy.data.meshes if m.users > 1}` — confirms reuse, catches accidental full copies.
3. **Bounding-box sanity by sampling**: `get_object_info` on a handful of objects across collections → confirm dimensions/positions are plausible (nothing at the origin by accident, nothing 1000× too big).
4. **Poly budget**: total scene tris ≈ sum of `len(o.data.polygons)` for MESH objects; compare against your target.
5. Final `get_scene_info` → report object_count, the collection tree, and the mesh_users/poly numbers you read back. State the seed. If anything is off, re-inspect before "done".
