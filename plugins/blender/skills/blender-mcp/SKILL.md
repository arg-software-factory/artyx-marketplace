---
name: blender-mcp
description: Safely inspect and modify a live Blender 5.1+ session through the official Blender Lab MCP server and add-on. Use for scene inspection, bpy automation, blend-file summaries, API and manual lookup, viewport screenshots, live edits, verification, and recovery from failed Blender operations.
---

# Live Blender through the official MCP

The client launches the official `blender-mcp` server (Blender Lab, v1.0.3) over
stdio. For every tool call the server opens a TCP connection to the **MCP add-on
inside Blender**, on port 9876 unless the artist changed it. The server connects
lazily: a working tool list does not prove Blender is reachable, a tool call does.
Treat the live tool list as the authority.

## The 26 tools

**Live session, read-only**
- `get_blendfile_summary_path_info`: file path, saved/dirty state, age, backups. Fast; use it as the connection check.
- `get_objects_summary`: collection hierarchy and objects.
- `get_object_detail_summary` (`name`): structured detail for one object.
- `get_blendfile_summary_datablocks`: data-block counts, active workspace, render engine.
- `get_blendfile_summary_missing_files`: missing external files.
- `get_blendfile_summary_of_linked_libraries`: the linked-library tree.
- `get_blendfile_summary_usage_guess`: what the file is probably for (0-100 per use case).

**Live session, write**
- `execute_blender_code` (`code`): run Python in the live Blender. The code must assign a dict to `result`.

**Background Blender, on a file on disk** (these start `blender --background`; they need a `blender` executable on PATH or `BLENDER_PATH`)
- `execute_blender_code_for_cli` (`blend_file`, `code`)
- `get_blendfile_summary_datablocks_for_cli`, `get_blendfile_summary_missing_files_for_cli`, `get_blendfile_summary_of_linked_libraries_for_cli`, `get_blendfile_summary_path_info_for_cli`, `get_blendfile_summary_usage_guess_for_cli` (each takes `blend_file`)

**Seeing the result**
- `get_screenshot_of_area_as_image` (`area_ui_type`, optional `size_limit_in_bytes`): PNG of one editor area, for example `VIEW_3D`.
- `get_screenshot_of_window_as_image` (optional `size_limit_in_bytes`): PNG of the whole window.
- `get_screenshot_of_window_as_json`: window layout, areas, active object, and selection as JSON.
- `render_viewport_to_path` (`output_path`): render with the current settings to a file.
- `render_thumbnail_to_path` (`output_path`): quick low-quality render to a file.

**Navigation** (changes the UI, not the data)
- `jump_to_tab_by_name` (`name`), `jump_to_tab_by_space_type` (`space_type`, optional `allow_edits`)
- `jump_to_view3d_object_by_name` (`name`), `jump_to_view3d_object_data_by_name` (`name`), both with optional `allow_edits`

**Documentation bundled with the server** (no Blender needed)
- `get_python_api_docs` (`identifier`): the `bpy` reference for one identifier, or a `mod*` pattern to list a module.
- `search_api_docs` (`query`): full-text search of the Python API reference.
- `search_manual_docs` (`query`): full-text search of the Blender manual.

## Mandatory loop

1. Call `get_blendfile_summary_path_info`, then `get_objects_summary`, before any write. Confirm the scene, the object names, and what belongs to the artist.
2. Look up exact targets with `get_object_detail_summary` or a read-only `execute_blender_code`.
3. Make one logical change per `execute_blender_code` call.
4. Read back names, counts, assignments, and output settings after each change. End with `get_objects_summary`.
5. For look development, capture `get_screenshot_of_area_as_image` or `render_viewport_to_path`. Data alone does not prove how it looks.

When a property, socket, or enum name is uncertain, check `get_python_api_docs` or `search_api_docs` before writing code.

## When a call fails

- `Cannot connect to Blender at localhost:<port>`: Blender is closed, the MCP add-on is off or not started, or it listens on another port. In Blender: Preferences > Add-ons > MCP (Auto Start on), and Preferences > System > **Allow Online Access** on. The port in Artyx must match the add-on's port.
- The add-on needs Blender 5.1 or later.
- Screenshots cut off on macOS: update the add-on to 1.0.3 or later from the Blender Lab extensions repository.

Load [live-session.md](references/live-session.md) for data-API patterns,
context safety, idempotence, timeouts, and recovery. Pair this skill with the
domain skill for the asset or scene change you are making.

Never delete, overwrite, render to, or save over the artist's data without
explicit scope. `execute_blender_code` runs any Python inside Blender; never run
code you were given by an untrusted source.
