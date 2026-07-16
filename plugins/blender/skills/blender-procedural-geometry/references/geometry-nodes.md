# Geometry Nodes patterns

## Graph design

Expose a narrow interface: source geometry/collection, density or spacing, seed, scale bounds, and material/selection controls. Use named attributes only for deliberate cross-node data; prefer anonymous attributes/fields for local flow. Place node frames around stages: source, distribute, instance, orient/scale, realize (if needed), output. Keep a group deterministic by driving all random nodes from explicit seed inputs.

## Instances and fields

`Distribute Points on Faces` plus `Instance on Points` is the standard scatter pattern. Use Poisson Disk when minimum separation matters, random distribution when density matters. Align instances using normals/tangents only after defining their local up/forward axes. Random rotation should often be yaw-only; unrestricted rotation is rarely believable. Random scale needs a bounded range and, for natural assets, correlated rather than independent variation.

Instances remain lightweight and editable. Realize only for operations that require real mesh topology: selected booleans, per-instance mesh editing, certain exports, or simulation. Realization multiplies geometry; estimate points × source triangles first. Use `Join Geometry`, collections, and `Collection Info` instead of duplicating source meshes.

## Curves and volumes

Use curves for paths, cables, roads, fences, and profile sweeps; manage spline resolution separately from bevel/profile resolution. Convert to mesh only at a clear boundary. Use volumes for fog/cloud-like effects and ensure their resolution is within budget before remeshing/conversion.

## Official sources

- [Geometry Nodes](https://docs.blender.org/manual/en/4.5/modeling/geometry_nodes/index.html)
- [Fields](https://docs.blender.org/manual/en/4.5/modeling/geometry_nodes/fields.html)
- [Instances](https://docs.blender.org/manual/en/4.5/modeling/geometry_nodes/instances.html)
