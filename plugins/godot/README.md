# Point Artyx at your Godot

Artyx spawns the published **`@coding-solo/godot-mcp`** package via `npx`. The
server launches its **own headless Godot** (via `GODOT_PATH`) to open the
editor, run projects in debug mode, inspect scenes, and stream back errors and
debug output. It does not attach to an already-open editor.

## Prerequisites

- Godot 4.x installed
- Node.js and `npx` on PATH

## Steps

1. Ensure Node.js and `npx` are available on your PATH.
2. Locate your Godot 4 executable:
   - macOS: `/Applications/Godot.app/Contents/MacOS/Godot`
   - Windows: `C:\Godot\Godot_v4.x.exe`
   - Linux: the extracted `Godot_v4.x` binary
3. Paste that full path when Artyx prompts for `GODOT_PATH` during install.

Docs: https://github.com/Coding-Solo/godot-mcp#readme
