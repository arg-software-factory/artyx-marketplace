---
name: blender-procedural-geometry
description: Create deterministic Blender 4.5 procedural assets and worlds. Use for Geometry Nodes, fields, instancing, scattering, curve-based construction, reusable node groups, procedural variation, bpy graph creation, and scalable scene generation.
---

# Procedural geometry

Treat a node graph as a parameterized asset with stable inputs, explicit units, deterministic seeds, and a measurable geometry budget.

1. Define exposed inputs, coordinate space, seed, source collection, and output ownership.
2. Build the smallest graph that proves the form; name node groups and frames by role.
3. Use fields to vary geometry and instances; keep repeated geometry instanced until a downstream operation requires realization.
4. Separate generation from shading, simulation, and export conversion.
5. Measure evaluated instance count, vertex count, memory impact, and target-engine compatibility.

Load [geometry-nodes.md](references/geometry-nodes.md) for graph/field patterns. Load [scripting-instancing.md](references/scripting-instancing.md) for `bpy`, data-block reuse, determinism, and performance.
