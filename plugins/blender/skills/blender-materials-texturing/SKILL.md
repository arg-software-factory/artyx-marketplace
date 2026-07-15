---
name: blender-materials-texturing
description: Build Blender 4.5 production materials and textures. Use for Principled BSDF PBR authoring, UV and procedural mapping, texture import, normal/roughness/metallic handling, baking, shader debugging, and material validation in Cycles or Eevee.
---

# Materials and texturing

Start from the physical material and target renderer, then establish color space and mapping before tuning artistic variation. Keep source images, packed/generated data, and shader groups named and traceable.

1. Identify dielectric, metal, coated surface, transmission, subsurface, emission, or volume behavior.
2. Feed color data and data maps with their correct color interpretation; validate UVs or object-space/procedural coordinates.
3. Use Principled BSDF as the default interoperable surface; add nodes only to solve a visible requirement.
4. Preview under neutral light and the final scene; test Cycles/Eevee features before committing to renderer-specific nodes.
5. Bake only after low/high mesh, cage/ray distance, UV padding, and target format are locked.

Load [pbr-nodes.md](references/pbr-nodes.md) for physically based node design and mapping. Load [texture-baking-color.md](references/texture-baking-color.md) for image settings, baking, color management, and troubleshooting.
