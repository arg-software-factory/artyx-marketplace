# Armatures, deformation, and actions

## Rig layers

Separate deform bones from animator controls where complexity requires it. Use clear naming (`DEF-`, `CTRL-`, left/right conventions), stable bone rolls, and a documented root. Apply mesh/armature transforms before binding; non-uniform scale and inconsistent rest pose cause difficult deformation and export errors. Test extreme poses early with a low-cost proxy mesh.

Weight paint must support volume preservation and intended articulation. Normalize weights, eliminate accidental influences, and use corrective shape keys or helper bones for predictable problem areas. Constraints are relationships: define target spaces, axes, limits, and evaluation order; avoid circular dependencies. Use IK for pose control, then verify pole targets and stretch behavior.

## Actions

An action is an animation data-block, not merely timeline keys. Give actions intentional names, ranges, and ownership. Avoid keying uncontrolled channels. For reuse, keep each clip self-contained and confirm its start/end pose and root-motion policy. In automated contexts, inspect Blender's action API because Blender 5 layered actions differ from older direct `Action.fcurves` access.

## Official sources

- [Armatures](https://docs.blender.org/manual/en/4.5/animation/armatures/index.html)
- [Skinning and weights](https://docs.blender.org/manual/en/4.5/animation/armatures/skinning/index.html)
- [Constraints](https://docs.blender.org/manual/en/4.5/animation/constraints/index.html)
