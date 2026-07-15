---
name: unreal-world-building
description: Build scalable Unreal Engine 5.6+ levels and open worlds. Use for level assembly, actor placement, World Partition, Data Layers, One File Per Actor, HLOD, Landscape, foliage, PCG, streaming, or environment validation.
---

# World building and streaming

Read [world-partition-and-layers.md](references/world-partition-and-layers.md) for collaboration and
streaming structure. Read [environment-and-pcg.md](references/environment-and-pcg.md) for terrain,
foliage, instancing, and procedural generation. Do not convert a map or enable world-scale systems
without a source-control, cook, and target-platform plan.

## Assembly loop

1. Define playable scale, traversal speed, streaming budget, lighting model, ownership, and targets.
2. Use stable actor naming, folders/Data Layers, and reusable level/asset boundaries from first pass.
3. Test cell loading, HLOD transitions, collision/navigation, and gameplay traversal outside a fully
   loaded editor viewport.
4. Profile density, material diversity, shadowing, texture streaming, and CPU scene cost before detail.
