---
name: GDScript Gameplay
description: Load when adding behavior/logic to a Godot project through godot-mcp — teaches the honest boundary (the server has NO script-writing tool), the agent-designs / human-attaches / agent-verifies collaboration loop, and signals-first GDScript with _ready/_process discipline, export vars, and print-plus-get_debug_output debugging.
---

# Attaching behavior with GDScript

## 1. The hard boundary (state it to the user, do not paper over it)

The godot-mcp server manipulates **scenes** and **runs projects**. It has **NO tool to
write, edit, or attach `.gd` scripts** — no `create_script`, no `add_script`, nothing.
Behavior therefore comes from a collaboration, not a single tool call:

1. **You design** the complete, correct GDScript (this skill's job).
2. **The script reaches the project** by one of:
   - **You write the `.gd` file to disk** IF you have generic file-write access to the
     project directory (the server operates on files on disk anyway — a script under
     `res://scripts/foo.gd` is just a file). Then it still must be *attached* to a node.
   - **The human pastes/attaches it** in the editor: select the node → Attach Script →
     point at your file (or paste your text). One click for them.
3. **You verify** by running the project and reading debug output. This is the only
   honest proof the behavior works — you cannot introspect the script over MCP.

Two attach-free patterns reduce the human step to near zero:
- **Autoload singletons** (a manager script registered under `[autoload]` in
  `project.godot`) run without being attached to any scene node — ideal for game
  state, event buses, save systems. The human enables it once in Project Settings →
  Autoload.
- **Runtime instancing**: a script already in the tree does
  `preload("res://coin.tscn").instantiate()` to spawn sub-scenes at play time — the
  composition wiring `scene-architecture` couldn't do statically.

Never claim behavior is "done" from a scene build alone. Say: "logic designed; attach
`res://scripts/x.gd` to node Y (or enable as autoload), then I'll verify by running."

## 2. Signals-first architecture (the correct Godot idiom)

Nodes should **emit signals up** and **call methods down** — never reach across the
tree with fragile `get_node("../../Foo")` chains. Decoupling this way is what makes
scenes reusable.

```gdscript
extends CharacterBody2D

## Tuned in the Inspector without touching code — always expose gameplay constants.
@export var speed: float = 220.0
@export var max_health: int = 3

signal died                       ## emit UP; let a manager/HUD decide what happens
signal health_changed(current: int)

var _health: int = max_health

func _ready() -> void:
    # One-time setup: connect signals, cache references, seed state.
    health_changed.emit(_health)
    print("[Player] READY OK")     # sentinel line -> proof in get_debug_output

func take_damage(amount: int) -> void:
    _health = max(_health - amount, 0)
    health_changed.emit(_health)
    if _health == 0:
        died.emit()                # don't queue_free here; let the listener decide

func _physics_process(delta: float) -> void:
    var dir := Input.get_axis("ui_left", "ui_right")
    velocity.x = dir * speed
    move_and_slide()
```

Connect signals in the LISTENER's `_ready` (e.g. a HUD: `player.health_changed.connect(_on_health_changed)`),
or in the editor. Prefer typed signals and typed params — they catch errors at parse time.

## 3. _ready vs _process vs _physics_process discipline

- **`_ready()`** — runs once when the node enters the tree and all children exist.
  Do setup, signal wiring, reference caching here. Children are guaranteed ready
  (children `_ready` before parent).
- **`_process(delta)`** — every rendered frame (variable rate). Use for visuals, UI,
  timers, non-physics polling. Skip it entirely if the node has nothing per-frame.
- **`_physics_process(delta)`** — fixed timestep (default 60 Hz). ALL movement,
  `move_and_slide`, and collision logic go here — never in `_process`.
- Keep per-frame functions cheap: cache node refs in `_ready` (`@onready var hud := $HUD`),
  never `get_node` in a loop; avoid allocations in `_process`.

## 4. Export vars for tweakability

Expose every gameplay constant with `@export` (speed, damage, cooldowns, spawn counts)
so the value is data, editable in the Inspector — not a magic number recompiled by
hand. Use `@export_range(0, 100)` for bounded values and `@export var scene: PackedScene`
to inject a sub-scene to spawn. This is how you make one script serve many tuned nodes.

## 5. Debugging = print + get_debug_output loop

You have no debugger over MCP. Your instrument is `print()` (and `push_warning` /
`push_error`) read back through `get_debug_output`:

```gdscript
func _ready() -> void:
    print("[Enemy] spawned at ", global_position, " hp=", _health)
    if not is_instance_valid(target):
        push_error("[Enemy] no target assigned")   # shows as SCRIPT ERROR-adjacent
```

Loop: ask the human to attach/enable the script → `run_project` → `get_debug_output`
(grep for your `[Tag]` sentinels and for `SCRIPT ERROR` / `.gd:<line>`) →
`stop_project` → fix the script text → repeat. A run that prints every expected
sentinel and no error line is your acceptance criterion. Report the actual captured
lines, not "it should work."

## 6. Common runtime faults in debug output

- `Invalid get index 'X' (on base: 'Nil')` → a `@onready`/`$Node` path is wrong or the
  node was renamed — re-check the tree with `get_project_info`.
- `SCRIPT ERROR: ... Nonexistent function` → typo or wrong node type for the call.
- Signal "connected but nothing happens" → connected in the wrong node, or emitted
  before the listener connected (order-of-`_ready`); connect in the listener, emit later.
- Nothing prints at all → the script isn't attached/autoloaded yet. That's the boundary
  from §1 — confirm the human did the attach step before debugging logic.
