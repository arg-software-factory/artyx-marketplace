# Lifecycle, input, and signals

`_enter_tree` runs while a node joins the tree; `_ready` runs once descendants are ready; `_exit_tree`
is teardown. Use `_process(delta)` for frame-dependent presentation and `_physics_process(delta)`
for deterministic physics-step movement. Do not mix a Rigidbody's simulation movement with direct
transform assignment.

Define named InputMap actions; consume UI or gameplay input deliberately using `_unhandled_input`
when GUI should get first choice. Use signals for events, include meaningful arguments, and connect
at the owning composition boundary. Timers express delayed behavior better than accumulating
unbounded delta counters.

## Official sources

- Notifications: https://docs.godotengine.org/en/4.6/tutorials/best_practices/godot_notifications.html
- Input events: https://docs.godotengine.org/en/4.6/tutorials/inputs/inputevent.html
