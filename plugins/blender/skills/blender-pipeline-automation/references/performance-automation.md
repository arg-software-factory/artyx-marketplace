# Automation and performance audit

## Safe `bpy` automation

Make scripts deterministic, scoped, and idempotent. Read inputs from known collections/properties; create/update named outputs; return structured audit data. Prefer data-block APIs over UI operators. Use `bpy.context.evaluated_depsgraph_get()` when measuring final modifier/node output. Batch operations by collection/data type rather than issuing thousands of tiny mutations.

## Budget levers

The expensive dimensions are evaluated triangles, unique mesh/material/image data, shader complexity, texture resolution/bit depth, instance/object count, simulation domains, light sampling, and render samples. Reuse mesh/material/node-group data, instance repeated assets, keep high-density detail near the camera, and use proxy/LOD representations for viewport work. Purge orphan data only after confirming ownership.

## Final audit

Report Blender version, scene frame range, engine, output path, external files, asset counts, evaluated triangle counts, material slots, image resolutions, cache state, and export/reopen result. A clean save is not a validated delivery: inspect warnings, missing data, and a representative final output.

## Official sources

- [Python API overview](https://docs.blender.org/api/current/info_quickstart.html)
- [Dependency graph API](https://docs.blender.org/api/current/bpy.types.Depsgraph.html)
- [Scene statistics](https://docs.blender.org/manual/en/4.5/scene_layout/scene/properties.html)
