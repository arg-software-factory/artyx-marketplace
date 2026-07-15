---
name: unity-rendering-textures
description: "Build technically correct Unity 6.0 LTS visuals: texture import and compression, PBR materials, Shader Graph, URP/HDRP lighting, post processing, and platform-aware rendering diagnostics."
---

# Unity rendering and textures

Identify the active pipeline before selecting a shader or feature: Built-in, URP, and HDRP assets
are not interchangeable. Establish target platform, color space, source asset resolution, memory
budget, and whether the material is opaque, alpha-clipped, or transparent before import.

## Workflow

1. Inspect render pipeline asset, Quality level, color space, platform override and existing material.
2. Define texture semantics and channel packing before importing; set sRGB only for color data.
3. Build a minimal PBR material, then validate under neutral lighting and representative gameplay light.
4. Tune pipeline lighting/post effects at volume and asset level, not by hard-coding camera effects.
5. Profile GPU cost and texture memory on the target class of hardware before increasing fidelity.

## Read on demand

| Need | Read |
|---|---|
| Importer settings, PBR maps, compression, alpha, atlases | `references/texture-import-and-pbr.md` |
| URP/HDRP selection, Shader Graph, lighting, render debugging | `references/pipeline-lighting-and-shaders.md` |

Do not change render pipelines to solve a material issue. Use `unity-performance-qa` for measured
regressions and `unity-scenes-content` for asset ownership/addressability.

Official baseline: [Unity 6 render pipelines](https://docs.unity3d.com/6000.0/Documentation/Manual/render-pipelines.html).
