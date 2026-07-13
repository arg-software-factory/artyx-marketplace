---
name: Godot MCP
description: Load this before ANY Godot task through the bundled godot-mcp server — teaches the headless-process operating model (the server launches its OWN Godot, it does NOT attach to your open editor), the session ritual, the exact 14-tool inventory with parameters, and the run_project/get_debug_output/stop_project verification loop.
---

# Driving Godot through MCP

## 1. The operating model — read this first, it changes everything

The bundled server is **Coding-Solo/godot-mcp**. It does **NOT** attach to the Godot
editor the user has open. It **launches its own Godot process** (path from the
`GODOT_PATH` env var, with auto-detection fallback) to operate on a **project directory
on disk**. Simple ops call Godot's CLI directly; complex ops run a bundled
`godot_operations.gd` script. Consequences you must internalize:

- **You edit files on disk, not a live session.** `create_scene` / `add_node` /
  `save_scene` rewrite `.tscn` files in the project folder. If the user has that same
  project open in the editor, **they will not see your changes until they reload**
  (Project → Reload Current Project, or reopen the scene). Tell them to reload.
- **There is no "current scene" state.** Every tool takes an explicit `projectPath`
  (and usually `scenePath`). Nothing is implicit. Confirm the target project first.
- **Verification is a real process, not a query.** You confirm behavior by
  `run_project` → `get_debug_output` → `stop_project`. That launched process captures
  stdout/stderr (prints, errors, warnings). This is your feedback loop.
- **There is NO GDScript-writing tool.** The server manipulates scenes and runs
  projects; it cannot author or attach `.gd` scripts. See the `gdscript-gameplay` skill
  for the honest collaboration boundary.

## 2. The session ritual (do this every task)

1. **`get_godot_version`** — confirm Godot is reachable and 4.x. If this fails, the
   `GODOT_PATH` is wrong or Godot isn't installed — stop and tell the user.
2. **`list_projects` / `get_project_info`** — establish and confirm the exact
   `projectPath` you will operate on. Never assume it.
3. **Work in small steps** — one scene op per call; save; re-read structure.
4. **Verify** — `run_project` (optionally a specific `scene`), read
   `get_debug_output`, then `stop_project`. Report the ACTUAL output you read, not
   what you intended.
5. **Hand off** — tell the user to reload the project in their editor if they have it
   open, and flag anything only a human can do (script attach, visual layout tweaks).

## 3. Tool inventory (exact names + parameters, verified from src/index.ts)

Params are camelCase in the schema; the server also normalizes snake_case internally.

| Tool | Required params | Optional params |
|------|-----------------|-----------------|
| `get_godot_version` | — | — |
| `list_projects` | `directory` | `recursive` (bool, default false) |
| `get_project_info` | `projectPath` | — |
| `launch_editor` | `projectPath` | — |
| `run_project` | `projectPath` | `scene` (res:// path of a specific scene) |
| `get_debug_output` | — | — |
| `stop_project` | — | — |
| `create_scene` | `projectPath`, `scenePath` | `rootNodeType` (default `Node2D`) |
| `add_node` | `projectPath`, `scenePath`, `nodeType`, `nodeName` | `parentNodePath`, `properties` (object) |
| `load_sprite` | `projectPath`, `scenePath`, `nodePath`, `texturePath` | — |
| `save_scene` | `projectPath`, `scenePath` | `newPath` (write a variant instead) |
| `export_mesh_library` | `projectPath`, `scenePath`, `outputPath` | `meshItemNames` (array) |
| `get_uid` | `projectPath`, `filePath` | — (Godot 4.4+) |
| `update_project_uids` | `projectPath` | — (Godot 4.4+) |

Notes: `run_project`/`get_debug_output`/`stop_project` are stateless singletons — one
run at a time; call `stop_project` before the next run. `scenePath`, `texturePath`,
`outputPath` are `res://`-relative (see `scene-architecture` for path hygiene).

## 4. The verification loop in practice

```
run_project { projectPath: "/abs/path/game", scene: "res://scenes/main.tscn" }
# ... let it run a moment ...
get_debug_output            # read prints, "SCRIPT ERROR", "ERROR", "WARNING" lines
stop_project                # always stop before the next run
```

Read the output like a log: `SCRIPT ERROR` + a `.gd:line` = a runtime script fault;
`ERROR: Condition ... is true` = engine-level (missing resource, bad path); `WARNING`
= non-fatal (unused signal, shadowed var). A clean run that prints your expected
sentinel line ("READY OK") is your proof of success — design scripts to print such
sentinels (see `project-qa-performance`).

## 5. Error patterns & fixes

- **`get_godot_version` fails / "command not found"** → `GODOT_PATH` unset or wrong.
  It must point at the Godot **executable** (e.g. `/Applications/Godot.app/Contents/
  MacOS/Godot` on macOS, `Godot_v4.x.exe` on Windows). Ask the user to set it.
- **"project.godot not found" / project ops fail** → `projectPath` must be the folder
  **containing** `project.godot`, not a subfolder or a `.tscn`. Re-run
  `get_project_info` to confirm.
- **Node/scene op "succeeds" but user sees nothing** → they didn't reload the editor,
  OR a node wasn't owned by the root and dropped on save (see `scene-architecture`
  ownership rule). Re-read with `get_project_info`.
- **Headless quirks** → the launched process may run without a window/GPU depending on
  the host. Rendering-dependent metrics (draw calls, GPU memory) can be zero/absent;
  logic, node counts, and script prints are always reliable.
- **Two consecutive failures of the same op** → STOP. Re-read `get_project_info`,
  confirm `projectPath`/`scenePath`, and `web_search` the exact error string before
  retrying. Never blindly re-run a mutation.

## 6. When to hand off to the human editor

The MCP surface is scene-file + run-project. Hand these to the human: attaching/writing
GDScript (`gdscript-gameplay` boundary), fine visual layout, animation editing in the
AnimationPlayer, importing assets through the editor's import pipeline, and anything
needing the editor's inspector. Your job: build the structure, wire what the tools
allow, and PROVE it runs — then tell the human exactly which one-click steps remain.
