---
name: godot-scene-architecture
description: Design or restructure Godot 4.6+ scenes, nodes, resources, signals, Autoloads, imports, UIDs, and project layout. Use when defining scene boundaries, composing reusable gameplay objects, or repairing fragile node dependencies.
---

# Scene architecture

Choose a scene boundary before adding nodes. Prefer composition and explicit dependencies over a
deep tree or global lookups. Read one reference per decision rather than loading the whole set.

| Need | Read |
| --- | --- |
| Scene ownership, instancing, node tree shape | [nodes and instances](references/nodes-scenes-instancing.md) |
| Signals, groups, node paths, Autoloads | [dependency boundaries](references/dependency-boundaries.md) |
| `res://` layout, Resources, imports, UIDs, VCS | [project assets](references/project-assets-layout.md) |

Create a self-contained scene with a stable root, expose configuration through typed exported
properties or Resources, and communicate upward with signals. Keep sibling coupling at the
composition root. Validate by instancing the scene twice: instances must not share mutable state.
