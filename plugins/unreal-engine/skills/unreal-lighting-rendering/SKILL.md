---
name: unreal-lighting-rendering
description: Light, render, and diagnose an Unreal Engine 5.6+ scene. Use for Lumen, light mobility, exposure, post process, reflections, shadows, Nanite interactions, GPU debugging, renderer selection, or frame-quality tradeoffs.
---

# Lighting and rendering

Read [lumen-and-exposure.md](references/lumen-and-exposure.md) for look development. Read
[rendering-diagnostics.md](references/rendering-diagnostics.md) before making performance claims.
Validate lighting in the target renderer and target hardware tier; editor preview defaults are not a
shipping quality contract.

## Look-development order

1. Lock target platform, renderer, scalability tier, camera framing, and exposure policy.
2. Establish physically coherent key/fill/environment lighting before grading or bloom.
3. Choose Lumen, baked/static, or constrained renderer features from the platform requirements.
4. Diagnose with view modes and GPU evidence, then change the largest measured cost.
5. Recheck dark, bright, interior, exterior, and fast-motion cases after every renderer change.
