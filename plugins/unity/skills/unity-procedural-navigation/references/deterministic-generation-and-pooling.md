# Deterministic generation, materialization, and pooling

## Generate data before objects

Use an explicit seed and a locally scoped deterministic random source. Treat the generated layout as
data: occupancy grid, graph, room list, spline, voxel field, or spawn plan. Validate bounds,
connectivity, collision-free placement, minimum spacing and count limits before creating GameObjects.
Persist or log seed, generator version and input parameters so a bug can be replayed exactly.

Keep coordinate conversions explicit: grid coordinates, local generator space, world space and scene
origin are separate. Do not call a global random API from unrelated gameplay while generating if
reproducibility matters. Chunk work under a stable root and include a deterministic chunk identifier;
this makes unload/regeneration and debug visualization safe.

## Materialization strategy

Use a few hand-authored objects with normal prefab instantiation. For many identical render objects,
consider GPU instancing, combined meshes, Tilemaps, Entities/Graphics (only if project architecture
allows), or `Graphics.DrawMeshInstanced` according to platform/profile evidence. Avoid thousands of
individual GameObjects as a default. Create colliders and nav-relevant geometry only where gameplay
requires them.

Pooling is for frequently recycled runtime objects. A pool defines reset, acquire, release, capacity,
overflow and owner behavior. Reset subscriptions, velocities, animation state, particles and child
objects on release; an inactive pooled object must not remain registered or queried. Do not pool a
one-time scene decoration simply to appear optimized.

## Official sources

- Unity Scripting API: [Random](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Random.html)
- Unity Scripting API: [ObjectPool](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Pool.ObjectPool_1.html)
- Unity Manual: [GPU instancing](https://docs.unity3d.com/6000.0/Documentation/Manual/GPUInstancing.html)
- Unity Manual: [Tilemaps](https://docs.unity3d.com/6000.0/Documentation/Manual/tilemaps/tilemaps-landing.html)
