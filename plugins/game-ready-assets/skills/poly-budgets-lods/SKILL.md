---
name: poly-budgets-lods
description: Set and check triangle, material, bone, and draw-call budgets for a game asset per target platform (mobile, Switch-class, PC/console, standalone VR), and plan its LOD chain. Use before modeling or retopology, when an artist asks "how many polys", when an asset is too heavy for its platform, or when setting up LODs in Unity, Unreal, or Godot.
---

# Poly budgets and LODs

A budget is a share of a frame, not a number an asset earns by looking good.
Count **triangles** (what the GPU draws), not quads or "polys", and count them
after modifiers, mirroring, and subdivision are applied.

## 1. Ask before you model

- Target platform and frame rate (30, 60, 90+ for VR).
- How large the asset is on screen, and how many copies are visible at once.
- Hero asset (inspected up close), gameplay asset, or background dressing.
- The project's measured budget. If the team has one, it wins over this table.

## 2. Starting ranges for LOD0 (triangles)

| Asset class | Mobile | Switch-class | PC / current console | Standalone VR (Quest-class) |
|---|---|---|---|---|
| Hero character | 5k-15k | 10k-30k | 50k-150k | 10k-25k |
| NPC / crowd character | 2k-8k | 5k-15k | 20k-60k | 5k-12k |
| First-person weapon | 3k-10k | 8k-20k | 20k-60k | 8k-20k |
| Vehicle | 5k-20k | 15k-40k | 50k-150k | 10k-30k |
| Hand-held prop | 100-1.5k | 300-3k | 1k-10k | 300-3k |
| Large environment piece | 500-5k | 2k-10k | 5k-40k | 1k-8k |
| Whole visible scene | 100k-500k | 300k-1M | 2M-10M+ | 300k-1M |

These are common industry starting points, not limits. Move them with the
measured frame time on the target device.

Unreal Engine 5 **Nanite** relaxes triangle limits for eligible opaque static
meshes on PC and current consoles. Skinned meshes (unless the project enables
and verifies Nanite skinning), translucent or heavily masked materials, and
mobile targets still need these budgets.

## 3. The costs that are not triangles

- **Materials per asset:** each material slot is at least one draw call. Aim for
  1 on props, 1-3 on characters and vehicles. Merge with texture atlases.
- **Draw calls per frame:** roughly 100-200 on mobile and standalone VR, a few
  thousand on PC with instancing/batching. Instancing only helps identical meshes
  with the same material.
- **Bones:** 4 influences per vertex is the safe default everywhere. Unreal's
  mobile renderer limits a skinned mesh section to 75 bones by default; split
  sections or trim the rig if you are over.
- **Vertices, not triangles, cost memory:** every UV seam and hard edge splits
  vertices. A 10k-triangle mesh can carry 15k+ vertices when seams are careless.
- **Overdraw:** alpha-tested foliage and particles cost fill rate, not triangles.
  Cut transparent area with tighter cards before you cut triangles.

## 4. LOD chain

Default chain, reducing triangles about 50% per step:

| LOD | Triangles vs LOD0 | Typical switch (screen size) |
|---|---|---|
| LOD0 | 100% | close-up |
| LOD1 | ~50% | ~0.5 |
| LOD2 | ~25% | ~0.25 |
| LOD3 | ~12% | ~0.12 |
| Last | impostor / billboard or culled | far |

Rules:
- Keep the silhouette first; remove interior loops, bevels, and small details.
- Keep the same material slots, pivot, scale, and UV layout across LODs, or the
  switch pops.
- Skinned LODs keep the same skeleton; drop small bones (fingers, face) only in
  lower LODs if the engine supports per-LOD bone reduction.
- Check each switch distance in the engine, at the target resolution.

## 5. Engine setup

- **Unity:** name meshes `<Name>_LOD0`, `<Name>_LOD1`, ... inside one FBX and the
  importer builds a LOD Group. Tune transition percentages on the LOD Group.
- **Unreal:** import LODs with the mesh (FBX LOD group) or generate them in the
  Static Mesh Editor (LOD Settings, reduction %). For Nanite meshes, set a
  fallback triangle budget instead of hand LODs.
- **Godot 4:** mesh LODs are generated on import by default (Import dock, Meshes >
  Generate LODs). Use visibility ranges (HLOD) on nodes for impostors or swaps.

## Report

State the platform, the triangle count per LOD, material count, bone count for
skinned meshes, and whether each number is inside the range above or the
project's own budget.
