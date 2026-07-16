---
name: godot-overview
description: Route Godot 4.6+ work to the correct expert skill. Use first for ambiguous Godot requests, project planning, or when choosing between 2D, 3D, rendering, gameplay, animation, navigation, procedural generation, performance, export, and the bundled MCP bridge.
---

# Godot production map

Target Godot **4.6+**. Verify release notes before applying a 4.7+ feature. Start with
the domain skill; load `godot-mcp` only when operating this plugin's disk-based MCP bridge.

| Task | Load |
| --- | --- |
| Nodes, scenes, resources, project layout | `godot-scene-architecture` |
| GDScript, input, signals, gameplay state | `godot-gdscript-gameplay` |
| Canvas, TileMapLayer, Control UI | `godot-2d-ui` |
| Cameras, glTF, 3D worlds, instancing | `godot-3d-worlds` |
| Materials, textures, renderers, shaders | `godot-rendering-materials-shaders` |
| AnimationTree, skeletons, audio buses | `godot-animation-audio` |
| Bodies, collision, navigation | `godot-physics-navigation` |
| Seeded worlds, grids, chunks | `godot-procedural-generation` |
| Profiling, QA, headless runs, export | `godot-performance-qa-export` |
| Bundled bridge, scene mutation, debug capture | `godot-mcp` |

## Operating rule

Establish the target platform and renderer before selecting rendering or performance advice.
Keep gameplay code independent from editor automation. Measure before optimizing, keep generated
content under an owned root, and validate an exported or headless build in addition to editor play.

## Version policy

References pin Godot 4.6 documentation and list official sources. Treat `stable` links as discovery
links, not proof that a newer API is compatible.
