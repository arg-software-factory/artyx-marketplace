# Import contract and texture correctness

Normalize units and axes in the DCC before import. Apply transforms deliberately, preserve a clean
source hierarchy, and decide whether the asset needs static mesh, skeletal mesh, animations, sockets,
collision, or LODs. Use a unique source asset name and preserve the source path so reimport is
repeatable. After import, inspect scale in a representative level, lightmap/UV channels, normals and
tangents, collision, material slots, and LOD/Nanite behavior.

Texture settings are data semantics, not cosmetic toggles. Base Color/emissive maps normally use sRGB;
linear data maps such as normal, roughness, metallic, ambient occlusion, masks, and packed channels do
not. Select compression by map type and target platform, preserve alpha only when used, and validate
channel packing against the parent Material. A normal map flagged as color data or a roughness map
with sRGB enabled produces physically wrong shading even when it looks plausible in one viewport.

Use Nanite for dense, mostly static geometry where the target platform and material features support
it. It does not replace sensible instance counts, material complexity, texture streaming budgets, or
collision decisions. Inspect the target renderer/platform constraints before enabling it globally.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/importing-assets-directly-into-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/textures-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/nanite-virtualized-geometry-in-unreal-engine>
