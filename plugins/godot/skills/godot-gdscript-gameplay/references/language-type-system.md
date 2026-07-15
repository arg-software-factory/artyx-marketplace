# GDScript types and data

Type public APIs, exports, collections, and return values. Use `@export` for editor-authored input,
`@onready` for tree-dependent references, and `class_name` for reusable domain types. Prefer a
Resource subclass for immutable/configuration data shared by many instances; duplicate or create
runtime state when mutation must not leak to peers.

Use `preload()` for static dependencies needed by every instance and `load()` only when deferred
loading is a measured requirement. Avoid untyped Dictionary payloads at durable module boundaries:
use a typed object/Resource or validate every key. Do not use `Variant` merely to avoid a design
decision.

## Official sources

- GDScript basics, 4.6: https://docs.godotengine.org/en/4.6/tutorials/scripting/gdscript/gdscript_basics.html
- Resources: https://docs.godotengine.org/en/4.6/tutorials/scripting/resources.html
