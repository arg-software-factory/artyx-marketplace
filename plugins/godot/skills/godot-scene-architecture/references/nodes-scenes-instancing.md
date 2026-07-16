# Nodes, scenes, and instancing

A Node supplies behavior; a Scene serializes a subtree and can become a reusable PackedScene.
Choose a root that represents the unit's role (`CharacterBody2D`, `Control`, `Node3D`) rather than
a generic container. Keep a scene independently runnable when practical, then compose it from a
dedicated parent scene.

Expose configuration through typed `@export` values or Resource objects. Keep runtime-only state in
the instance, not in a shared Resource unless intentional. When instancing, connect children through
their public signals or an explicit interface at the composition root; avoid hard-coded paths to
grandchildren. Use owners correctly when constructing a scene at runtime that must be saved.

## Official sources

- Nodes and scenes, 4.6: https://docs.godotengine.org/en/4.6/getting_started/step_by_step/nodes_and_scenes.html
- Instancing: https://docs.godotengine.org/en/4.6/getting_started/step_by_step/instancing.html
