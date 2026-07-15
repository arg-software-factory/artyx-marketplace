# Rigid bodies, cloth, and collisions

## Rigid bodies

Apply scale and keep simulation geometry simple. Use convex hulls for most moving objects; use mesh collision only where fidelity justifies its cost and instability risk. Set passive bodies for static environment and active bodies for dynamic props. Tune mass by relative material density, then damping, friction, restitution, collision margin, and substeps. Start with a simple impact test before composing a full shot.

## Cloth and soft bodies

Use a sufficiently regular mesh with density only where folds need to resolve. Pin through vertex groups; define collision objects with appropriate thickness and outward normals. Increase quality/substeps only after confirming scale and collision margin. Self collision is expensive and should be enabled selectively. For art direction, combine simulation with shape keys, corrective sculpting, or controlled caches rather than seeking impossible physical perfection.

## Cache integrity

Set frame range and cache type before baking. Any change to topology, modifier order, collision geometry, transforms, or keyframed inputs can invalidate a bake. Bake to a durable project-relative location when delivery requires portability. Scrub forward from the cache start and test shot boundaries; never assume a viewport cache is final.

## Official sources

- [Rigid Body](https://docs.blender.org/manual/en/4.5/physics/rigid_body/index.html)
- [Cloth](https://docs.blender.org/manual/en/4.5/physics/cloth/index.html)
- [Collision](https://docs.blender.org/manual/en/4.5/physics/collision.html)
