---
name: blender-overview
description: Route Blender 4.5 LTS work to the right expert workflow. Use first for multi-domain Blender tasks, production planning, or when selecting modeling, materials, Geometry Nodes, animation, rendering, simulation, pipeline, or live official MCP control guidance.
---

# Blender production map

Start by identifying the deliverable, the Blender version, render engine, target platform, and whether a live session may be changed. Use one focused skill; load only its named reference files.

| Need | Load |
|---|---|
| Inspect or edit a connected `.blend` | `blender-mcp` |
| Meshes, UVs, retopo, sculpt | `blender-modeling` |
| PBR materials, images, baking | `blender-materials-texturing` |
| Parametric assets, scattering, Geometry Nodes | `blender-procedural-geometry` |
| Rigs, actions, NLA, cameras | `blender-animation-rigging` |
| Lookdev, lights, Cycles/Eevee, output | `blender-rendering-lighting` |
| Physics, fluids, cloth, hair, caches | `blender-simulation-vfx` |
| Assets, interchange, `bpy`, budgets | `blender-pipeline-automation` |

## Production order

1. Establish units, scale, naming, frame range, color management, target engine, and budget.
2. Keep source assets non-destructive: modifiers, node groups, actions, and simulation caches stay editable until approval.
3. Validate the artifact in the consumer path: reopen/import, render a representative frame, and profile the target engine.
4. Record Blender version, render engine, external dependencies, output path, and unresolved assumptions.

## Source baseline

This bundle targets Blender 4.5 LTS. Check the installed version before using version-sensitive nodes or `bpy` properties. Canonical documentation: [Manual 4.5](https://docs.blender.org/manual/en/4.5/) and [current Python API](https://docs.blender.org/api/current/).
