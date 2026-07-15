---
name: godot-mcp
description: Operate a Godot project through Artyx's bundled godot-mcp bridge. Use before calling its scene, project, run, debug, UID, or mesh-library tools; it explains the disk-based headless process, the exact capability boundary, safe writes, and verification loop.
---

# Godot MCP bridge

This bridge launches its own Godot executable from `GODOT_PATH`; it does not attach to an open
editor. Treat every path as explicit, edit one scene operation at a time, and ask the human to
reload an open editor after disk changes.

| Need | Read |
| --- | --- |
| Tool names, inputs, and unavailable capabilities | [tool contract](references/tool-contract.md) |
| Start/run/read output/stop a project safely | [headless run and debug](references/headless-run-debug.md) |
| Create or mutate scenes without ownership/path damage | [safe scene edits](references/safe-scene-edits.md) |

## Mandatory loop

1. Call `get_godot_version`, then establish `projectPath` with `get_project_info`.
2. Inspect before a write; use `res://` paths only where a tool expects them.
3. Save, run the smallest relevant scene, read `get_debug_output`, and always `stop_project`.
4. If the same mutation fails twice, stop, re-inspect paths and scene ownership, then report the
   blocker. Do not retry blindly.

The bridge cannot author or attach GDScript. Use `godot-gdscript-gameplay` for code guidance and
hand the actual code-edit boundary to the repository/editor workflow.
