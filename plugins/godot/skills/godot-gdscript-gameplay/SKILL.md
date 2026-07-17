---
name: godot-gdscript-gameplay
description: Build robust Godot 4.6+ gameplay in GDScript. Use for typed scripts, node lifecycle, input, signals, state, CharacterBody movement, data-driven behavior, debugging, and tests; use alongside godot-mcp only when its bridge can verify the project.
---

# GDScript gameplay

Write typed, small components with explicit input and state ownership. Use `_physics_process` for
physics, `_process` for presentation, and signals for cross-node events.

| Need | Read |
| --- | --- |
| Types, exports, resources, class boundaries | [language and data](references/language-type-system.md) |
| Lifecycle, input, signals, timers | [event flow](references/lifecycle-input-signals.md) |
| State, CharacterBody2D/3D, reusable gameplay | [gameplay architecture](references/gameplay-architecture.md) |
| Errors, assertions, debugger and test boundary | [debugging and testing](references/debugging-testing.md) |

Do not write scripts through the godot-mcp server: it cannot do so. Edit code through the target
project workflow, then use `godot-mcp` to run and capture evidence.
