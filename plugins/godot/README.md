# Godot

Artyx spawns the published **`@coding-solo/godot-mcp`** package via `npx`,
pinned to 0.1.1 in `mcp.json`. The server launches its **own headless Godot**
to open the editor, run projects in debug mode, inspect scenes, and stream back
errors and debug output. It does not attach to an already-open editor.

**Install instructions: [Coding-Solo/godot-mcp](https://github.com/Coding-Solo/godot-mcp#readme)**

That URL is `interface.docsUrl` in `plugin.json`, and it is what the desktop's
"How to install" button opens. The steps are not mirrored here or in the
manifest — the server's author owns them.

`GODOT_PATH` is the one setting, and it is optional. `mcp.json` sets it to
`godot`, the binary on PATH; when that is not a working Godot, the server also
searches the usual install folders (`/Applications/Godot.app` on macOS,
`C:\Program Files\Godot` on Windows, `/usr/bin` on Linux). Set it in Artyx
only when your Godot 4 lives somewhere else; Artyx passes it to the server as
the `GODOT_PATH` environment variable. The connection test calls
`get_godot_version`.

## Troubleshooting

- **`ENOENT` on spawn** — `npx` is not on PATH for the desktop's environment.
- **Server starts, nothing opens** — Godot was not found. Set `GODOT_PATH` to
  your Godot 4 binary.
