# Landscape, foliage, instancing, and PCG

Build an environment in layers: traversal/blockout, terrain and collision, repeatable structural
modules, vegetation/detail, lighting, then set dressing. Use the correct representation for density:
instancing/foliage for repeated static meshes, Hierarchical Instanced Static Meshes where appropriate,
and individual Actors only when unique behavior, ownership, or interaction requires them. Foliage
density, shadowing, material cost, and collision can dominate a frame long before triangle count.

Landscape is a specialized heightfield system; establish component sizing, material layers, resolution,
and world scale before sculpting. Avoid repeatedly resizing a production landscape. For authored paths,
water, roads, and splines, keep the source rule/asset editable instead of baking accidental geometry.

PCG graphs should take explicit inputs, use deterministic seeds when reproducibility matters, and
respect Data Layers/partition boundaries. Keep generated content identifiable and easy to regenerate;
avoid hand-editing outputs that a subsequent graph execution will overwrite. Validate collision,
navigation, streaming, and runtime cost after generation, not just graph preview output.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/landscape-outdoor-terrain-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/foliage-mode-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/procedural-content-generation-overview>
