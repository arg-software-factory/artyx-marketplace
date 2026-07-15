# 2D rendering and camera

Node2D transforms are local to their parent; use a Camera2D for world framing rather than moving
every world object. Put HUD and overlays below CanvasLayer so they do not inherit camera movement.
Set texture filtering and repeat intentionally at project, CanvasItem, or material scope; mismatched
pixel-art filtering produces blur and seams.

Use Z ordering, y-sort, and layers as a documented render policy, not an ad-hoc fix. Keep a single
world scale convention and use Camera2D limits instead of clamping each actor independently.

## Official sources

- 2D introduction: https://docs.godotengine.org/en/4.6/tutorials/2d/introduction_to_2d.html
- Camera2D: https://docs.godotengine.org/en/4.6/classes/class_camera2d.html
