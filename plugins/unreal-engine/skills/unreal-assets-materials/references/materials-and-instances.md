# PBR materials, instances, and virtual textures

Keep a small set of parent Materials organized by shading model and feature set. Feed Base Color,
Roughness, Metallic, Normal, Ambient Occlusion, Emissive, and Opacity according to the selected blend
mode; do not use opacity/translucency merely to hide bad geometry. For ordinary dielectrics Metallic
is 0; use 1 for conductive surfaces and let Base Color define the conductor tint. Roughness variation
usually carries more realism than arbitrary color noise.

Expose stable artist controls as named scalar, vector, texture, or static-switch parameters. Build
per-asset variation as a Material Instance, never by duplicating an entire graph or editing a shared
parent for one prop. Static switches create shader permutations: expose them only for genuinely
distinct features and audit permutation growth.

Use Material Editor statistics and Shader Complexity view to find expensive expressions, translucent
overdraw, and feature misuse. Prefer texture/channel packing, shared functions, and simpler lighting
models over micro-optimizing graph syntax. Evaluate Runtime Virtual Textures and Virtual Texture
streaming only for a documented landscape/decal/large-content case; they add setup and cache costs.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-materials>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/instanced-materials-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/runtime-virtual-texturing-in-unreal-engine>
