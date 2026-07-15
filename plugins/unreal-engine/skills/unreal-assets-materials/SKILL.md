---
name: unreal-assets-materials
description: Create, import, validate, and optimize Unreal Engine 5.6+ assets and materials. Use for FBX or glTF ingestion, texture settings, PBR material graphs, Material Instances, Nanite, virtual textures, asset references, or content quality checks.
---

# Assets and materials

Read [import-and-textures.md](references/import-and-textures.md) before importing external content.
Read [materials-and-instances.md](references/materials-and-instances.md) before authoring a material
or changing a look. Preserve source files and import settings; do not cure a pipeline problem by
destructively editing the only imported asset.

## Delivery loop

1. Establish scale, axes, UVs, LOD policy, target renderer, platform texture budget, and source path.
2. Import into a stable content root; inspect generated materials, collision, normals, UV channels,
   texture color space, and references before committing the asset.
3. Build reusable parent Materials; expose only intentional parameters and make variants as Material
   Instances.
4. Test the asset in its intended lighting and target platform profile, then inspect memory and shader
   cost before expanding its use.
