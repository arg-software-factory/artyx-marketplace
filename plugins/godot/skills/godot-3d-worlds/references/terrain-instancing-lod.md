# Instancing, terrain, and LOD

Use MeshInstance3D for unique interactive objects and MultiMeshInstance3D for many identical,
mostly static instances. MultiMesh improves submission throughput but trades per-instance visibility
and interaction for batching. Divide large populations into chunks with their own bounds; one huge
MultiMesh defeats culling.

Set visibility ranges and LOD intent on authored meshes, then verify transitions and shadows on the
target renderer. Terrain-scale worlds need streaming and a coordinate/precision policy before art
placement.

## Official sources

- MultiMeshInstance3D: https://docs.godotengine.org/en/4.6/classes/class_multimeshinstance3d.html
- Visibility ranges: https://docs.godotengine.org/en/4.6/tutorials/3d/visibility_ranges.html
