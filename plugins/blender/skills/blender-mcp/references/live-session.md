# Live-session discipline

## Reliable mutation pattern

Use stable datablock names and make writes idempotent. Query first with
`get_objects_summary` or `get_object_detail_summary`, create only if absent, and
return proof through `execute_blender_code`:

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

Prefer `bpy.data.*.new`, `objects.new`, collection linking, modifiers, and
node-tree APIs. Operators are context-dependent: before `bpy.ops`, explicitly
set active/selected objects or use `context.temp_override`. Never rely on UI
mode, area, or the previous call's Python locals.

Use `get_python_api_docs` when a socket name, property, or enum identifier may
have changed between Blender versions.

## Transactions and recovery

Split a job into inspect → create → configure → verify. The HTTP bridge has a
finite timeout; a long `execute_blender_code` call can fail after partly
mutating Blender. Name created resources predictably, re-inspect with
`get_objects_summary` after an error, then continue from observed state rather
than replaying blindly. For risky edits, duplicate the datablock or place
generated objects in an `ARTYX_` collection first.

For imports and exports, use `execute_blender_code` with explicit
`bpy.ops.wm`/`import_*` operators: validate path, extension, axis, units, and
selected objects. Avoid shell access and untrusted Python payloads.

For offline blend files, prefer `*_for_cli` summary tools or
`execute_blender_code_for_cli` instead of requiring a live UI session.

## Version-aware API

Read `bpy.app.version_string` via `execute_blender_code` or blend-file
summaries; Blender 4.5 is the reference target. Do not hard-code renamed
sockets or engines. For example, test node inputs by name before assigning them
and enumerate available enum identifiers when compatibility matters. Blender 5
action layers differ from 4.x action F-curves; isolate version-specific code
and verify the resulting keyframes.

## Verification payloads

Return names, object types, modifier/node counts, material slots, frame range,
vertex/polygon counts, and file paths. For transforms, use rounded numeric
values. For dependency-sensitive work, evaluate through
`bpy.context.evaluated_depsgraph_get()` before measuring. Data verification
proves state, not aesthetics: use `get_screenshot_of_area_as_image`,
`render_viewport_to_path`, or `render_thumbnail_to_path` when lookdev matters.

## Official sources

- [Blender Lab MCP server](https://www.blender.org/lab/mcp-server/)
- [Blender Python API](https://docs.blender.org/api/current/index.html)
- [Operators and context](https://docs.blender.org/api/current/bpy.ops.html)
- [Blender Manual: Python API](https://docs.blender.org/manual/en/4.5/advanced/scripting/index.html)
