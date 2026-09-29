---
name: topology-and-uvs
description: Make a mesh game-ready - clean topology, correct normals and smoothing, and efficient UV layouts with padding and a lightmap channel. Use when retopologizing a sculpt or AI-generated mesh, fixing shading artifacts or bad bakes, unwrapping UVs for baking or tiling, or checking a model before export to Unity, Unreal, or Godot.
---

# Topology and UVs for real-time

## Topology checklist

1. **Scale and transforms:** real-world scale (1 unit = 1 m in Blender, Unity,
   and Godot; Unreal uses centimeters). Apply rotation and scale before export.
2. **Clean geometry:** no non-manifold edges, no zero-area faces, no duplicate
   vertices, no interior faces, no stray loose vertices. Normals point outward.
3. **Triangles are fine, n-gons are not at export.** Model in quads where it
   helps editing, but triangulate on export (or let the exporter do it) so the
   baker and the engine split faces the same way. Bake from the triangulated mesh.
4. **Deforming meshes** need edge loops around joints (shoulders, elbows, knees,
   fingers, mouth, eyes) and even quad flow; static props do not.
5. **Spend triangles on the silhouette.** Flat areas get few polygons; detail
   that does not change the outline goes into the normal map.
6. **Pivot** at the logical origin: base center for props, between the feet for
   characters, hinge point for doors.

## Normals and smoothing

- Every hard edge (sharp edge / smoothing group break) must also be a **UV seam**.
  A hard edge without a seam gives bake gradients; a seam without a hard edge
  is fine.
- For hard-surface baking, prefer one of: hard edges at UV seams on angles over
  ~60 degrees, or weighted/custom normals on a low poly with support bevels.
  Pick one per asset and keep it.
- Bake and render in **MikkTSpace** tangent space (Blender, Unity, Unreal,
  Godot, and glTF all use it), and export tangents or let the engine
  recompute them with MikkTSpace. Mismatched tangents are the usual cause of
  normal-map seams.

## UV layout

- **UV0** (material UVs): no overlaps for anything that is baked uniquely.
  Stack or mirror only parts that can share texels; while baking, move the
  extra copies exactly 1 UV unit out of the 0-1 square so only one copy bakes.
- **Padding** between shells, in pixels at the final texture size: 8 px for
  2K, 16 px for 4K, at least 4 px on 1K and below, so mip levels do not bleed.
- **Straighten** shells of hard-surface parts to reduce stair-stepping and
  improve packing. Place seams where they are hidden or follow hard edges.
- **Uniform texel density** across shells of one asset (see `texel-density`).
  Scale up only what the camera inspects.
- **Tiling surfaces** (walls, floors, trims) use UVs outside 0-1 or trim sheets
  instead of unique texture space.
- **Lightmap UVs (UV1)** for baked lighting in Unity or Unreal: no overlaps, all
  shells inside 0-1, more padding (the engine packs at low resolution). Unity
  can generate them on import ("Generate Lightmap UVs"); Unreal generates them by
  default on static mesh import. Godot 4 LightmapGI can unwrap UV2 on import
  ("Light Baking: Static Lightmaps").

## Checks before handing off

- Face orientation overlay all blue (Blender), no flipped faces.
- Checker texture shows even, square squares with no stretching.
- Triangle count matches the budget from `poly-budgets-lods`.
- The low poly and cage cover the high poly with no gaps before baking.
