# Data, assets, and loading boundaries

Use a **Primary Data Asset** for a named, inspectable gameplay definition that should participate in
Asset Manager loading; use a Data Table for many uniform rows authored from a shared schema; use a
Data Asset for a smaller authored configuration. Keep mutable session state out of those assets:
copy definitions into runtime state and serialize durable user state through a versioned SaveGame.

Hard references make an asset load with its referencer. Use them for mandatory, small dependencies
such as a pawn's core component class. Use soft object/class references for optional cosmetics,
large maps, catalogs, and delayed content; load asynchronously, expose loading/failure UI, and retain
the handle/object for as long as it is needed. Do not synchronously load soft references on gameplay
critical paths.

Assign one owner for each content root, use stable asset names, and redirect intentionally after
renames. Treat maps, skeletal meshes, materials, and high-resolution textures as heavy references;
inspect Reference Viewer before adding them to globally loaded assets.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/data-assets-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/asset-management-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/asynchronous-asset-loading-in-unreal-engine>
