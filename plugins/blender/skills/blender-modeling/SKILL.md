---
name: blender-modeling
description: Create and repair production-ready Blender 4.5 meshes. Use for hard-surface or organic modeling, modifiers, topology, UVs, retopology, sculpting, normal control, and export-safe mesh validation.
---

# Modeling and mesh quality

Choose the deliverable before modeling: hero render mesh, deforming character, simulation collider, or realtime export mesh. Apply real-world scale and transforms deliberately; keep a non-destructive source mesh until the consumer validates it.

1. Block silhouette and proportions with simple, named forms.
2. Choose topology flow for deformation and shading, not arbitrary quad purity.
3. Add bevel/subdivision/weighted-normal modifiers only after primary shape is stable.
4. Build UV seams around material and deformation boundaries; check density and distortion.
5. Validate normals, manifoldness, scale, modifier order, and target triangle budget.

Load [topology-modifiers.md](references/topology-modifiers.md) for hard-surface and deformation rules. Load [uv-retopo-sculpt.md](references/uv-retopo-sculpt.md) for UV, retopo, sculpt, and transfer workflows.

## MCP verification

Inspect with `get_objects_summary` / `get_object_detail_summary`; mutate meshes
via `execute_blender_code`. Confirm vertex/polygon counts and modifier stacks in
the returned payload; use `get_screenshot_of_area_as_image` when silhouette or
shading must be judged.
