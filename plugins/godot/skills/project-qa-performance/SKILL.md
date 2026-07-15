---
name: Godot Project QA & Performance
description: Load for the pre-handoff QA pass on a Godot project through godot-mcp — UID hygiene on 4.4+ (get_uid/update_project_uids), project-settings sanity, a run_project smoke matrix across key scenes, reading errors vs warnings in debug output, headless-safe performance metrics (node counts, draw calls) printed from a QA script, and the final checklist.
---

# QA & performance pass over MCP

Run this before telling the user a project is ready. It is the `run_project` +
`get_debug_output` + `stop_project` loop turned into a discipline. Read the `godot-mcp`
base skill for the operating model first.

## 1. UID hygiene (Godot 4.4+)

Godot 4.4+ tracks resources by stable `.uid` identifiers alongside `res://` paths. After
programmatic scene/resource edits, moves, or a version bump, UID references can go stale
— broken `[ext_resource]` links, "resource not found" at load. Fix and confirm:

- `update_project_uids { projectPath }` — resaves resources to refresh UID references.
  Run it after a batch of scene/resource changes or when the user reports missing links.
- `get_uid { projectPath, filePath }` — read the UID of a specific file to confirm it
  resolves / to reference it deterministically.
- These are **4.4+ only** — `get_godot_version` first; on older Godot, skip UID steps
  and rely on `res://` paths (still valid).

## 2. Project-settings & structure sanity

- `get_project_info { projectPath }` — confirm the tree, and that a **main scene** is
  set (`application/run/main_scene` in `project.godot`). No main scene = the game can't
  launch for players even if individual scenes run.
- Confirm input actions the scripts use (`ui_left`, custom actions) exist — a missing
  action isn't an error, it just silently never fires; catch it by testing behavior.
- Confirm every `res://` asset referenced by scenes actually exists (a `run_project`
  surfaces `ERROR: Cannot load` lines for the ones that don't).

## 3. The smoke matrix — run every scene that matters

Don't just run main once. Sweep the key scenes, one run each (stop between runs):

```
run_project { projectPath, scene: "res://scenes/main.tscn" };  get_debug_output;  stop_project
run_project { projectPath, scene: "res://scenes/player.tscn" }; get_debug_output;  stop_project
run_project { projectPath, scene: "res://ui/hud.tscn" };        get_debug_output;  stop_project
```

A scene that loads clean in isolation but breaks under main points at a wiring/
dependency issue, not the scene itself. Record pass/fail per scene.

## 4. Read the debug output: errors vs warnings vs your sentinels

Triage every run's `get_debug_output` into three buckets:

| Line pattern | Meaning | Action |
|--------------|---------|--------|
| `SCRIPT ERROR` / `.gd:<line>` | runtime script fault | must fix — blocks handoff |
| `ERROR: Cannot load` / `Condition ... is true` | engine/resource fault (missing file, bad path, null) | must fix — blocks handoff |
| `WARNING:` (unused signal, shadowed var, deprecated) | non-fatal smell | fix if cheap; note otherwise |
| your `[Tag] ...` prints | expected behavior proof | assert they appear with right values |

Acceptance for a scene = your expected sentinels present, zero `SCRIPT ERROR`, zero
blocking `ERROR`. "No output" usually means a script isn't attached/autoloaded yet
(the `gdscript-gameplay` boundary), not that it passed.

## 5. Performance metrics — printed from a QA script

You have no profiler over MCP; instrument with the `Performance` singleton from a
temporary QA script (attach or autoload it, per the script boundary), sampled after the
scene settles:

```gdscript
extends Node
func _ready() -> void:
    await get_tree().create_timer(1.0).timeout      # let the scene populate
    var p := Performance
    print("[QA] nodes=",   p.get_monitor(p.OBJECT_NODE_COUNT))
    print("[QA] objects=", p.get_monitor(p.OBJECT_COUNT))
    print("[QA] draws=",   p.get_monitor(p.RENDER_TOTAL_DRAW_CALLS_IN_FRAME))
    print("[QA] fps=",     p.get_monitor(p.TIME_FPS))
    print("[QA] mem_mb=",  p.get_monitor(p.MEMORY_STATIC) / 1048576.0)
    get_tree().quit()                               # auto-stop the smoke run
```

Read the `[QA]` lines from `get_debug_output`. Rough smells: **node count** ballooning
into the tens of thousands (use `MultiMeshInstance` / pooling — see
`procedural-generation`); **draw calls** far above material count (missing batching);
static **memory** climbing across identical runs (a leak / unreleased resource).

**Headless caveat:** if the launched process runs without a GPU/window, render metrics
(`draws`, sometimes `fps`) can read 0 or be meaningless — trust them only from a
rendered run. `nodes`, `objects`, `mem`, and script-side counts are always valid.

## 6. Pre-handoff checklist

- [ ] `get_godot_version` — engine reachable; note major.minor (gates UID steps).
- [ ] `get_project_info` — tree sane; **main scene set**; assets resolve.
- [ ] UID pass (4.4+): `update_project_uids`; spot-check `get_uid` on moved resources.
- [ ] Smoke matrix: every key scene runs; pass/fail recorded.
- [ ] Debug output triaged: zero `SCRIPT ERROR`, zero blocking `ERROR`; warnings noted.
- [ ] Behavior sentinels (`[Tag]` prints) confirmed with correct values.
- [ ] Perf sampled: node/draw/mem numbers within sane bounds (or flagged with a fix).
- [ ] `stop_project` called — no orphaned run left alive.
- [ ] Human handoff written: reload the editor; attach/enable any pending scripts;
      list the exact one-click steps and anything only the editor can do.

Report the QA result as evidence — the scenes you ran, the actual output lines, the
metrics you read — never "looks good."
