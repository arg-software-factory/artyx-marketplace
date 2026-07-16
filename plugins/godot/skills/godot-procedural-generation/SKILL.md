---
name: godot-procedural-generation
description: Generate deterministic Godot 4.6+ content. Use for seeded maps, rooms, TileMapLayer and GridMap generation, MultiMesh population, chunk streaming, procedural resources, save/load, and verification of generated worlds.
---

# Procedural generation

Separate deterministic data generation from scene realization. Store the seed and configuration,
create only under a generated owner root, and support teardown without scanning or deleting
unrelated nodes. Keep a chunk boundary and budget before generating large content.

| Need | Read |
| --- | --- |
| Seeds, random streams, replayable layouts | [seeded generation](references/seeded-data-generation.md) |
| Grid and tile world construction | [TileMap and GridMap](references/tilemap-gridmap-generation.md) |
| MultiMesh, chunks, lifetime and budgets | [instancing and chunks](references/multimesh-chunking.md) |
| Resource persistence and load validation | [resource save/load](references/resource-save-load.md) |

Use `godot-performance-qa-export` to measure generated content and `godot-mcp` only for the
bridge's supported scene operations and run validation.
