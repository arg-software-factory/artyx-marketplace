# Topology, normals, and modifiers

## Model for the consumer

Use continuous edge loops across bending joints; place poles on low-deformation areas; reserve triangles/ngons for flat, non-deforming, or hidden surfaces. For hard surfaces, prioritize clean silhouette, controlled highlights, and predictable bevel widths over an all-quad rule. Avoid long thin quads, internal faces, duplicate vertices, and non-manifold edges.

## Modifier stack

Keep modifiers editable and order them intentionally: Mirror/Array → Boolean → Bevel → Weighted Normal or Subdivision (the precise order is asset-specific). Apply scale before size-dependent bevels. Use Auto Smooth / smooth-by-angle and custom normals only after base topology is sound. Subdivision needs supporting loops or bevels; do not use edge creasing as a substitute for designed transitions.

For Booleans, use watertight cutters with enough overlap, apply only after checking the result, then clean shading artifacts using bevels and normals. Create a low-poly source and a high-poly source separately when baking; do not decimate a hero mesh blindly into a game asset.

## Audit

Check face orientation, non-manifold geometry, loose elements, doubled vertices, unapplied negative scale, and modifier warnings. Inspect highlights under a grazing key light, not only solid viewport shading. Measure triangles after evaluated modifiers when targeting realtime budgets.

## Official sources

- [Modeling introduction](https://docs.blender.org/manual/en/4.5/modeling/introduction.html)
- [Modifiers](https://docs.blender.org/manual/en/4.5/modeling/modifiers/introduction.html)
- [Mesh normals](https://docs.blender.org/manual/en/4.5/modeling/meshes/editing/mesh/normals.html)
