---
name: unity-procedural-navigation
description: Build deterministic Unity 6.0 LTS procedural content, spawning systems, pooling, and AI navigation with bounded ownership, reproducible seeds, NavMesh validation, and performance-aware queries.
---

# Unity procedural generation and navigation

Procedural work is a data-to-content pipeline, not a loop that creates objects. Define seed,
parameters, coordinate space, ownership root, lifetime, and validation criteria before spawning. Build
the abstract layout first; instantiate only after the layout is valid. Navigation must be generated or
baked from the final walkable representation, not assumed from visuals.

## Workflow

1. Specify deterministic input: seed, dimensions, density, biome/rules, target platform budget.
2. Generate pure data first and test its invariants; log seed and compact diagnostics.
3. Materialize under one owned root using prefab/mesh/instance strategy appropriate to count.
4. Pool reusable runtime instances; never allocate/destroy a high-frequency object as normal behavior.
5. Configure/bake NavMesh for final geometry, then test reachability, agent radius and obstacle changes.

## Read on demand

| Need | Read |
|---|---|
| Seeds, grids, graph/room generation, instancing, pooling | `references/deterministic-generation-and-pooling.md` |
| AI Navigation package, surfaces, links, agents, dynamic obstacles | `references/navigation-and-validation.md` |

Use `unity-scenes-content` for additive/Addressable lifetime and `unity-performance-qa` when a
generation strategy changes frame time, memory or build size.

Official baseline: [Unity 6 AI Navigation](https://docs.unity3d.com/6000.0/Documentation/Manual/com.unity.ai.navigation.html).
