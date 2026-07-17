---
name: blender-mcp
description: Safely inspect and modify a live Blender session through the official Blender Lab MCP server. Use for scene inspection, bpy automation, blend-file summaries, API docs lookup, viewport screenshots, live edits, verification, and recovery from failed Blender operations.
---

# Live Blender through official MCP

Artyx connects over **HTTP** to a locally running `blender-mcp` process (official
Blender Lab package) that relays to the Blender MCP add-on. Use the live MCP tool
list as authority; the server also bundles Blender Python API reference and
manual excerpts via `get_python_api_docs`.

## Tool surface (official)

**Inspect (live session):** `get_objects_summary`, `get_object_detail_summary`,
`get_blendfile_summary_datablocks`, `get_blendfile_summary_missing_files`,
`get_blendfile_summary_of_linked_libraries`, `get_blendfile_summary_path_info`,
`get_blendfile_summary_usage_guess`.

**Inspect (CLI / background Blender):** `*_for_cli` variants of the blend-file
summary tools plus `execute_blender_code_for_cli`.

**Mutate:** `execute_blender_code` — prefer the data API; use `bpy.ops` only
when context is explicit.

**Docs:** `get_python_api_docs` — query API identifiers or discover modules
with a trailing `*` pattern.

**Viewport / render proof:** `get_screenshot_of_area_as_image`,
`get_screenshot_of_window_as_image`, `get_screenshot_of_window_as_json`,
`render_thumbnail_to_path`, `render_viewport_to_path`.

**Navigation:** `jump_to_tab_by_name`, `jump_to_tab_by_space_type`,
`jump_to_view3d_object_by_name`, `jump_to_view3d_object_data_by_name`.

## Mandatory loop

1. Call `get_blendfile_summary_path_info` and `get_objects_summary` before
   writing; confirm version, scene, object names, and user-owned content.
2. Query exact targets with `get_object_detail_summary` or read-only
   `execute_blender_code`.
3. Make one logical mutation per `execute_blender_code` call.
4. Read back names, counts, assignments, and output settings after every
   mutation. End with `get_objects_summary`.
5. For lookdev, capture `get_screenshot_of_area_as_image` or
   `render_viewport_to_path` — data alone does not prove aesthetics.

## Connection troubleshooting

- Is `blender-mcp` running? (`blender-mcp --transport http --port <port>`)
- Does the HTTP port match what Artyx was configured with (`BLENDER_MCP_PORT`)?
- Is Blender open with the official MCP add-on enabled (Blender Lab repository)?
- Check add-on preferences for auto-start errors and TCP listener status.

Load [live-session.md](references/live-session.md) for data-API patterns,
context safety, idempotence, timeout handling, and recovery. Pair this skill
with the domain skill that describes the intended asset or scene change.

Never delete, overwrite, render to, or save over user data without explicit
scope.
