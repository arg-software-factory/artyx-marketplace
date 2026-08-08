# Godot

Artyx spawns the published **`@coding-solo/godot-mcp`** package via `npx`. The
server launches its **own headless Godot** (via `GODOT_PATH`) to open the
editor, run projects in debug mode, inspect scenes, and stream back errors and
debug output. It does not attach to an already-open editor.

**Install instructions: [Coding-Solo/godot-mcp](https://github.com/Coding-Solo/godot-mcp#readme)**

That URL is `interface.docsUrl` in `plugin.json`, and it is what the desktop's
"How to install" button opens. The steps are not mirrored here or in the
manifest — the server's author owns them.

`GODOT_PATH` is the one value Artyx asks for: the full path to your Godot 4
executable (macOS `/Applications/Godot.app/Contents/MacOS/Godot`, Windows
`C:\Godot\Godot_v4.x.exe`, Linux the extracted `Godot_v4.x` binary). It is
passed to the server as an environment variable.

## Troubleshooting

- **`ENOENT` on spawn** — `npx` is not on PATH for the desktop's environment.
- **Server starts, nothing opens** — `GODOT_PATH` points at something that is
  not a Godot 4 binary.
