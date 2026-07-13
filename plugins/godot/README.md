# Point Artyx at your Godot

The Godot MCP server launches its **own headless Godot** (via `GODOT_PATH`) to
open the editor, run projects in debug mode, inspect scenes, and stream back
errors and debug output. It does not attach to an already-open editor.

## Prerequisites

- Godot 4.x installed

## Steps

1. Locate your Godot 4 executable:
   - macOS: `/Applications/Godot.app/Contents/MacOS/Godot`
   - Windows: `C:\Godot\Godot_v4.x.exe`
   - Linux: the extracted `Godot_v4.x` binary
2. Paste that full path when Artyx prompts for `GODOT_PATH` during install.
3. The server invokes that executable headlessly to run and inspect your projects — no in-editor add-on is required.

Docs: https://github.com/Coding-Solo/godot-mcp#readme
