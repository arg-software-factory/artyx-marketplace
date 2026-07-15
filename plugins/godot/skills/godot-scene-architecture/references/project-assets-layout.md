# Project assets and layout

Keep source art, imported runtime art, scenes, scripts, resources, and tests in predictable
top-level folders. Use lowercase, stable paths because exported platforms can be case-sensitive.
Reference assets with `res://`, never editor-machine absolute paths. Keep generated files outside
source art and exclude `.godot/` from version control.

Godot imports external assets into `.godot/imported` and tracks stable resource identity with UIDs.
Move or rename through the editor when possible; manual path changes can leave stale references.
Use `.tres` Resources for inspectable authored data, `.res` only where binary storage is intentional,
and validate references after migrations.

## Official sources

- Project organization: https://docs.godotengine.org/en/4.6/tutorials/best_practices/project_organization.html
- Import process: https://docs.godotengine.org/en/4.6/tutorials/assets_pipeline/import_process.html
- VCS: https://docs.godotengine.org/en/4.6/tutorials/best_practices/version_control_systems.html
