---
name: blender-mcp
description: Safely inspect and modify a live Blender session through the bundled Artyx Blender MCP server. Use for scene inspection, importing, bpy automation, live edits, verification, and recovery from failed Blender operations.
---

# Live Blender through Artyx MCP

Use the actual tool list as authority. This plugin currently exposes `get_scene_info`, `get_object_info`, `import_model`, and `execute_python`.

1. Call `get_scene_info` before writing; confirm version, scene, object names, and user-owned content.
2. Query exact targets with `get_object_info` or a read-only `execute_python` snippet.
3. Make one logical mutation per call. Prefer the data API; use `bpy.ops` only when its context is known.
4. Assign a JSON-serializable dictionary to `result` in every `execute_python` call.
5. Read back names, counts, assignments, and output settings after every mutation. End with `get_scene_info`.

Load [live-session.md](references/live-session.md) for data-API patterns, context safety, idempotence, timeout handling, and recovery. Pair this skill with the domain skill that describes the intended asset or scene change.

Never delete, overwrite, render to, or save over user data without explicit scope. Do not claim visual correctness from data alone; inspect a render or viewport result when available.
