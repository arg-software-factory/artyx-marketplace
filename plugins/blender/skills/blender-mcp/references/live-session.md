# Live-session discipline

## Reliable mutation pattern

Use stable datablock names and make writes idempotent. Query first, create only if absent, and return proof:

```python
import bpy
name = "ARTYX_Key"
light = bpy.data.objects.get(name)
if light is None:
    data = bpy.data.lights.new(name, "AREA")
    light = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(light)
light.location = (4, -4, 5)
light.data.energy = 500
result = {"name": light.name, "type": light.data.type, "energy": light.data.energy}
```

Prefer `bpy.data.*.new`, `objects.new`, collection linking, modifiers, and node-tree APIs. Operators are context-dependent: before `bpy.ops`, explicitly set active/selected objects or use `context.temp_override`. Never rely on UI mode, area, or the previous call's Python locals.

## Transactions and recovery

Split a job into inspect → create → configure → verify. The bridge has a finite timeout; a long call can fail after partly mutating Blender. Name created resources predictably, re-inspect after an error, then continue from observed state rather than replaying blindly. For risky edits, duplicate the datablock or place generated objects in an `ARTYX_` collection first.

Use `import_model` for supported external files and confirm imported root names. For arbitrary import/export operators, validate path, extension, axis, units, and selected objects. Avoid shell access and untrusted Python payloads.

## Version-aware API

Read `bpy.app.version_string`; Blender 4.5 is the reference target. Do not hard-code renamed sockets or engines. For example, test node inputs by name before assigning them and enumerate available enum identifiers when compatibility matters. Blender 5 action layers differ from 4.x action F-curves; isolate version-specific code and verify the resulting keyframes.

## Verification payloads

Return names, object types, modifier/node counts, material slots, frame range, vertex/polygon counts, and file paths. For transforms, use rounded numeric values. For dependency-sensitive work, evaluate through `bpy.context.evaluated_depsgraph_get()` before measuring. Data verification proves state, not aesthetics: request or create a review render when lookdev matters.

## Official sources

- [Blender Python API: `bpy`](https://docs.blender.org/api/current/bpy.html)
- [Operators and context](https://docs.blender.org/api/current/bpy.ops.html)
- [Blender Manual: Python API](https://docs.blender.org/manual/en/4.5/advanced/scripting/index.html)
