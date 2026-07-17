# Automation and scalable generation

## `bpy` graph creation

Create node groups through `bpy.data.node_groups`, declare interface sockets, create nodes/links, then attach the group to a Geometry Nodes modifier. Use stable names and look up nodes by name or type before modifying; node socket labels can change, so inspect available sockets for version-sensitive automation — use `get_python_api_docs` when unsure. Keep generated content in a named collection and return graph/node/link counts through `execute_blender_code`.

## Reuse data

Use linked objects, collection instances, and shared mesh/material/node-group datablocks for repeated content. `object.copy()` can share `data`; copying mesh data creates independent geometry and must be intentional. A large outliner object count can become a bottleneck even when meshes are shared; Geometry Nodes instances avoid that overhead for large scatters.

## Determinism and cleanup

Seed Python `random` generators and Geometry Nodes random inputs. Record seed and parameter values in the asset or handoff notes. Make scripts idempotent: replace/update a known graph rather than creating duplicate graphs per run. Remove unused temporary data deliberately and use `orphans_purge` only after confirming no user-owned data will be affected.

## Official sources

- [Geometry Nodes modifier API](https://docs.blender.org/api/current/bpy.types.NodesModifier.html)
- [Node tree API](https://docs.blender.org/api/current/bpy.types.NodeTree.html)
- [Object instancing](https://docs.blender.org/manual/en/4.5/scene_layout/object/properties/instancing/index.html)
