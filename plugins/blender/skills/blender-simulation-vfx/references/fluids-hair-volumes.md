# Fluids, hair, particles, and volumes

## Fluid domains

Mantaflow requires a domain volume that bounds the entire effect with sufficient margin. Resolution is the primary quality/cost control; start low, then raise only where the camera resolves detail. Configure inflow/effector behavior, obstacle thickness, mesh/noise layers, and cache type deliberately. Smoke/fire shading needs density, blackbody/flame, lights, and world exposure tested together; liquid meshing needs particle radius and smoothing validated at final scale.

## Hair and particles

Use curves/hair systems for groomed strands and instancing for repeated vegetation/props. Control guide density, children/interpolation, clumping, roughness, and collision budget separately. For large environments, keep instances procedural and use LOD/viewport display controls. Convert only when the downstream pipeline requires real geometry.

## Volume rendering

Volume step rate, density, anisotropy, light sampling, and noise dominate quality and time. Tune a sparse representative shot before committing to a full domain render. Avoid using density to compensate for poor lighting; test against the final view transform.

## Official sources

- [Fluid](https://docs.blender.org/manual/en/4.5/physics/fluid/index.html)
- [Hair](https://docs.blender.org/manual/en/4.5/physics/particles/hair/index.html)
- [Volume objects](https://docs.blender.org/manual/en/4.5/modeling/volumes/index.html)
