# UV, retopology, and sculpt workflow

## UVs

Apply object scale before judging texel density. Put seams where a real seam, sharp edge, material border, or occluded edge can hide them; split UV islands at hard normal boundaries when the target requires it. Keep consistent density across assets unless intentional hierarchy demands otherwise. Pack with padding sized for the final texture resolution and mip chain; inspect stretching with a checker texture.

## Retopology

Retopologize onto the high-resolution surface using shrinkwrap or snapping. Concentrate density in silhouette, articulation, face/hands, and visible curvature. Build loops around shoulders, elbows, knees, mouth, and eyes for deformation. Preserve separate parts when that makes rigging, baking, or materials clearer. Project/bake detail only after cage, ray distance, and tangent-space assumptions are verified.

## Sculpt

Use Multires when retaining an editable subdivision hierarchy matters; use Dyntopo for exploratory concept work where topology is disposable; use voxel remesh for broad, fused forms. Work from silhouette → primary masses → secondary planes → tertiary detail. Keep a low-resolution backup and retopologize before animation or realtime export. Mask and face sets organize work; they do not replace topology.

## Official sources

- [UV editing](https://docs.blender.org/manual/en/4.5/modeling/meshes/uv/index.html)
- [Retopology](https://docs.blender.org/manual/en/4.5/modeling/meshes/retopology.html)
- [Sculpting](https://docs.blender.org/manual/en/4.5/sculpt_paint/sculpting/index.html)
