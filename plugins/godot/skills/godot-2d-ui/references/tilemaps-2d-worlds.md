# TileMapLayer worlds

Use TileSet sources for reusable art, collision, and navigation definitions and one TileMapLayer per
logical render or collision layer. Batch cell changes and defer expensive navigation updates while
building large maps. Store generation data separately from rendered cells so a map can be rebuilt
or saved without scraping the scene tree.

Do not create one Node2D per decorative tile. Reserve nodes for interactive entities. Validate tile
coordinates, atlas alternatives, collision shapes, and navigation polygons after an import change.

## Official sources

- Using TileMaps: https://docs.godotengine.org/en/4.6/tutorials/2d/using_tilemaps.html
- TileMapLayer: https://docs.godotengine.org/en/4.6/classes/class_tilemaplayer.html
