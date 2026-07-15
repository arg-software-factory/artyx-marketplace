# Principled PBR and node design

## Surface model

Use Principled BSDF for most opaque, metallic, coated, fabric, skin, glass, and emissive assets. Base Color describes diffuse/albedo for dielectrics and reflection tint for metals. Set Metallic as a material-class decision (normally 0 or 1, not arbitrary gray). Roughness controls highlight width; variation should follow wear, manufacturing, and scale. Use Normal Map for tangent-space normal textures and Bump for height-derived microdetail; never connect either directly to a shader normal input.

Transmission, IOR, coat, subsurface, emission, and volume have energy and renderer implications. Use physically motivated scale: volume density and subsurface distance are scene-unit dependent. Prefer a reusable node group for an asset family; expose only artist-facing controls such as tint, roughness range, normal intensity, and mask scale.

## Coordinates and masks

Use UV coordinates for painted maps and Object/Generated coordinates for procedural detail. Add Mapping nodes rather than destructively scaling textures. Separate macro color variation, meso roughness variation, and micro normal detail so each can be tuned independently. Keep masks legible: name channels, clamp only where physically necessary, and avoid multiplying noise into every input.

## Renderer compatibility

Cycles is the reference for physically-based lookdev. Eevee is appropriate for fast iteration and realtime constraints but has feature-specific approximations. Do not depend on Shader to RGB outside Eevee. Validate transparency, transmission, displacement, and volume behavior in the chosen engine.

## Official sources

- [Principled BSDF](https://docs.blender.org/manual/en/4.5/render/shader_nodes/shader/principled.html)
- [Shader nodes](https://docs.blender.org/manual/en/4.5/render/shader_nodes/index.html)
- [Texture coordinates](https://docs.blender.org/manual/en/4.5/render/shader_nodes/input/texture_coordinate.html)
