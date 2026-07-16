# Dependency boundaries

Use direct node references only for structural parent/child dependencies. Resolve them in `_ready`
with `@onready`, not at script parse time. Use signals for events crossing scene boundaries, groups
for deliberate many-to-many broadcasts, and injected exported references for optional collaborators.

Autoloads suit small, process-lifetime services such as settings, save coordination, or a scene
router. Do not turn every shared convenience into a singleton: it hides ownership and makes tests
order-dependent. Prefer a Resource for static authored data and a regular node for lifecycle-bound
behavior. Disconnect or use one-shot connections where lifetime makes retained callbacks unsafe.

## Official sources

- Scene organization: https://docs.godotengine.org/en/4.6/tutorials/best_practices/scene_organization.html
- Autoloads: https://docs.godotengine.org/en/4.6/tutorials/scripting/singletons_autoload.html
- Signals: https://docs.godotengine.org/en/4.6/getting_started/step_by_step/signals.html
