# Gameplay architecture

Model state explicitly: a controller owns intent, a body owns motion, a Resource owns configuration,
and a scene root coordinates collaborators. CharacterBody movement belongs in `_physics_process`:
compute desired velocity from actions, call `move_and_slide()`, then derive presentation from the
result. Keep combat, AI, and UI as components or child scenes with narrow signal contracts.

For asynchronous flow, await signals or Timer timeouts and cancel or guard work when the owner exits
the tree. Avoid global mutable state for per-level state. Seed random generators at a game/session
boundary so bugs and replays remain reproducible.

## Official sources

- 2D movement: https://docs.godotengine.org/en/4.6/tutorials/2d/2d_movement.html
- CharacterBody2D: https://docs.godotengine.org/en/4.6/classes/class_characterbody2d.html
