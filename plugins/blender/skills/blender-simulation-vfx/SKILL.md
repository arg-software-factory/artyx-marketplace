---
name: blender-simulation-vfx
description: Build stable Blender 4.5 simulations and effects. Use for rigid and soft bodies, cloth, fluid or smoke Mantaflow domains, particle and hair systems, collisions, caches, baking, renderable volumes, and simulation troubleshooting.
---

# Simulation and VFX

Treat simulation as a cached dependency graph, not a random button press. Freeze scale, transforms, collision thickness, frame range, gravity, and cache location before tuning.

1. Define the physical story, units, target shot range, and collision participants.
2. Make a reduced-resolution proof with clear cache ownership and deterministic initial state.
3. Validate collision scale, normals, velocities, and forces before raising resolution/substeps.
4. Bake one layer at a time; invalidate/rebake whenever an upstream dependency changes.
5. Render representative frames and archive the cache or documented regeneration inputs with the `.blend`.

Load [physics-cloth-rigid.md](references/physics-cloth-rigid.md) for body/cloth workflows. Load [fluids-hair-volumes.md](references/fluids-hair-volumes.md) for Mantaflow, particle/hair systems, volumes, and cache strategy.

## MCP verification

Bake and inspect caches through `execute_blender_code`; verify modifier/cache
state in the returned dict. Representative frames need
`render_viewport_to_path` — simulation parameters alone do not prove motion.
