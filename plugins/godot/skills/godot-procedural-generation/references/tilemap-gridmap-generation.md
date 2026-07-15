# TileMap and GridMap generation

Generate grid coordinates from data, then apply them in batches to TileMapLayer or GridMap. Keep
tile IDs, atlas coordinates, alternatives, and rotation in a mapping table rather than scattering
magic integers through generation code. Build collisions and navigation after the final grid is
known, and validate a small deterministic seed before a large map.

## Official sources

- TileMapLayer: https://docs.godotengine.org/en/4.6/classes/class_tilemaplayer.html
- GridMap: https://docs.godotengine.org/en/4.6/classes/class_gridmap.html
