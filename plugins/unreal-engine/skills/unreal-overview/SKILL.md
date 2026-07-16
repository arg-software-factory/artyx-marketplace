---
name: unreal-overview
description: Route Unreal Engine 5.6+ work to the right Artyx skill. Use for choosing a production workflow across C++, Blueprints, rendering, animation, worlds, cinematics, performance, packaging, or the experimental UE 5.8 native MCP server.
---

# Unreal Engine production map

Target UE 5.6+ for production guidance. Treat UE 5.8-only native MCP behavior as experimental;
do not assume it is present in 5.6 or 5.7 projects.

| Need | Load |
| --- | --- |
| Connect an agent to a live UE 5.8 editor | `../unreal-engine-mcp/SKILL.md` |
| Choose C++/Blueprint boundaries, modules, assets | `../unreal-project-architecture/SKILL.md` |
| Build gameplay, input, components, replication | `../unreal-blueprints-cpp/SKILL.md` |
| Import assets or author materials | `../unreal-assets-materials/SKILL.md` |
| Light, profile, or debug the frame | `../unreal-lighting-rendering/SKILL.md` |
| Rig, retarget, or animate characters | `../unreal-animation-rigging/SKILL.md` |
| Build streaming/open worlds, PCG, or levels | `../unreal-world-building/SKILL.md` |
| Make a Sequence or render a shot | `../unreal-cinematics/SKILL.md` |
| Optimize, test, cook, package, or ship | `../unreal-performance-packaging/SKILL.md` |

Start from the narrowest matching skill, then read only its linked reference. Keep source assets,
engine plugins, target platforms, and project constraints explicit before changing a project.

## Non-negotiable production loop

1. Inspect the project settings, map, target platform, and existing assets before creating work.
2. Make one coherent change; compile/cook the smallest affected surface.
3. Validate in the real runtime or editor subsystem that owns the behavior.
4. Profile before optimizing and preserve a reproducible baseline.

Official index: <https://dev.epicgames.com/documentation/en-us/unreal-engine>.
