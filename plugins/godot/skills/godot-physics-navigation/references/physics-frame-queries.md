# Physics frames and queries

Move CharacterBody in `_physics_process`, set velocity before `move_and_slide()`, and inspect its
collision result afterward. Use direct-space queries only from the physics-safe context and filter
by collision masks. Do not alter a RigidBody transform each render frame; apply forces or use its
physics integration path.

## Official sources

- Ray-casting: https://docs.godotengine.org/en/4.6/tutorials/physics/ray-casting.html
- Physics interpolation: https://docs.godotengine.org/en/4.6/tutorials/physics/interpolation/index.html
