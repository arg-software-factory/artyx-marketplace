# Headless run and debug loop

1. Resolve the executable with `get_godot_version`. A failure means `GODOT_PATH` must point to the
   Godot binary, not its application bundle or project folder.
2. Confirm the project directory and its renderer/settings with `get_project_info`.
3. Run a focused `res://` scene where possible. Only one bridge run exists at once; stop it before
   starting another run.
4. Read `get_debug_output` after startup and after the behavior under test. Classify `SCRIPT ERROR`
   by its file and line; treat engine `ERROR` lines as defects until explained; record warnings.
5. Call `stop_project` even after a failure. A bounded smoke run is safer than leaving a game loop
   alive.

For deterministic smoke checks, have project code emit a distinct readiness or assertion message.
Do not use frame time, GPU counters, or screenshots from a headless host as proof of visual quality.

## Official sources

- Command line, Godot 4.6: https://docs.godotengine.org/en/4.6/tutorials/editor/command_line_tutorial.html
- Debugger panel, Godot 4.6: https://docs.godotengine.org/en/4.6/tutorials/scripting/debug/overview_of_debugging_tools.html
