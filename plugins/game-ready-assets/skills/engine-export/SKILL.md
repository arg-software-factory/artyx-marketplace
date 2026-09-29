---
name: engine-export
description: Export a game asset with the right units, axes, transforms, pivots, naming, collision, LODs, and animation settings for Unity, Unreal Engine, Godot 4, or back into Blender, using FBX or glTF. Use when an asset imports at the wrong size or rotation, when choosing FBX vs glTF, when setting up collision or LOD naming, or before handing an asset from Blender or Artyx to an engine.
---

# Export per engine

## Before any export

- Apply rotation and scale (Blender: Object > Apply > Rotation & Scale). Keep
  location at the pivot you want.
- One asset per file, named `SM_<Asset>` (static) or `SK_<Asset>` (skinned),
  materials `M_<Asset>`, textures per `pbr-texture-sets`.
- Triangulate or confirm the exporter triangulates; export tangents only if the
  engine will not recompute them with MikkTSpace.
- Remove unused materials, hidden helper objects, and empty UV maps.

## Coordinate systems

| Tool | Units | Up | Handedness |
|---|---|---|---|
| Blender | meter | Z | right |
| glTF 2.0 | meter | Y | right |
| Godot 4 | meter | Y | right |
| Unity | meter | Y | left |
| Unreal | centimeter | Z | left |

The exporters convert axes; your job is to keep scale at 1.0 and verify with
a known object (a 1 m cube and an arrow pointing to the asset's front).

## Unity (FBX)

- Blender FBX export: Apply Scalings "FBX All", Forward "-Z", Up "Y".
- Static meshes: turn Blender's "Apply Transform" on so objects arrive without
  a -90 degree X rotation. It is experimental and breaks armatures and
  animation, so never use it on skinned meshes.
- Skinned meshes: leave "Apply Transform" off and enable "Bake Axis
  Conversion" in Unity's model importer instead.
- LODs: `<Name>_LOD0`, `<Name>_LOD1`... in one file build a LOD Group.
- Skinned: export deform bones only, "Add Leaf Bones" off; set Rig to Humanoid
  or Generic in the importer.
- Materials: import textures separately and build URP/HDRP materials; do not
  rely on embedded FBX materials.

## Unreal Engine (FBX, or glTF through Interchange)

- Keep Blender at 1 unit = 1 m and export with Apply Scalings "FBX Units
  Scale"; the asset then imports at the right size with import scale 1.0.
- Characters: do not use Blender's "Apply Transform" on skinned meshes;
  Unreal's FBX importer converts the axes ("Convert Scene", on by default).
  Enable "Force Front X Axis" if the mesh comes in facing the wrong way. Name the armature object `Armature` (Unreal otherwise adds it as
  an extra root bone), and turn "Add Leaf Bones" off.
- Collision for static meshes, in the same file: `UCX_<Mesh>_01` (convex),
  `UBX_` (box), `USP_` (sphere), `UCP_` (capsule). Each hull must be convex.
- LODs: FBX LOD group, or build them in the Static Mesh Editor. Nanite: enable
  on import for eligible static meshes.
- Normal maps are DirectX (see `pbr-texture-sets`).

## Godot 4 (glTF)

- Prefer glTF 2.0 binary (`.glb`). Godot can also import `.blend` directly when
  the Blender path is set in Editor Settings (it runs the glTF exporter).
- Blender glTF export: "+Y Up" on (default), apply modifiers, export tangents
  if you baked normals, include only selected objects.
- Import hints by node-name suffix: `-col` (mesh plus collision), `-colonly`,
  `-convcol`, `-convcolonly`, `-noimp` (skip), `-navmesh`, `-occ` (occluder),
  `-rigid`; animations ending in `-loop` or `-cycle` import looping.
- Mesh LODs are generated on import; tune in the Advanced Import Settings.

## Back into Blender

- glTF keeps PBR materials best; FBX brings geometry, UVs, and skeletons but
  usually needs materials rebuilt.
- Blender's FBX importer applies the file's own unit scale, so an FBX saved in
  centimeters usually arrives at the right size. Check it against a 1 m cube
  and change the import scale only if it is off.

## Verify in the engine

Size against a 1.8 m reference character or 1 m cube, facing direction,
pivot, smoothing, material slots, collision (show collision view), LOD
switching, and for skinned meshes a test animation. Report each item.
