# Safe scene edits

Make paths explicit and preserve ownership. A saved `.tscn` only serializes nodes owned by the
scene root or a valid scene owner; a node can appear in-memory yet disappear after save when
ownership is wrong. Keep the operation sequence small: create/open target, add one node beneath a
known parent, assign only serializable properties, save, then run.

Use `res://scenes/...` and `res://art/...` consistently. Never construct paths from host-specific
absolute paths inside scene properties. Do not overwrite a working scene to make an experiment:
use `save_scene` with `newPath` for a variant, validate it, then promote deliberately.

After edits, an editor already viewing the project needs a reload/reopen. UID maintenance is only
for project changes that genuinely need it; do not run a broad UID rewrite as a routine fix.

## Official sources

- Nodes and scenes, Godot 4.6: https://docs.godotengine.org/en/4.6/getting_started/step_by_step/nodes_and_scenes.html
- Scene organization: https://docs.godotengine.org/en/4.6/tutorials/best_practices/scene_organization.html
