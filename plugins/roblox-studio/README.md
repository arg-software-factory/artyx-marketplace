# Enable the MCP server inside Roblox Studio

Connects Artyx to the **official MCP server built into Roblox Studio** — nothing
extra to install on the Roblox side, just a one-time toggle.

This plugin bundles no server code. Its `.mcp.json` declares the platform-specific
Studio MCP launch command directly, and Artyx spawns it over the generic stdio
transport:

- macOS: `/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP`
- Windows: `cmd.exe /d /s /c ${LOCALAPPDATA}\Roblox\mcp.bat`

Linux is not supported (Roblox Studio does not run on Linux).

## Prerequisites

- Roblox Studio (latest version) installed
- Signed in to Studio with your Roblox account

## Steps

1. Open Roblox Studio and open any place (or create a new one).
2. Open the Assistant panel and click its … (More) menu → `Manage MCP Servers`.
3. Toggle on `Enable Studio as MCP server`.
4. Keep Studio running — Artyx connects automatically when you use Roblox tools
   (a green indicator in that panel shows connected clients).

Docs: https://create.roblox.com/docs/en-us/studio/mcp

## Tools

Script editing (`script_read`, `multi_edit`, `script_search`, `script_grep`), Luau
execution (`execute_luau`), assets and generation (`search_asset`, `insert_asset`,
`generate_mesh`, `generate_material`, `generate_procedural_model`), scene inspection
(`get_studio_state`, `search_game_tree`, `inspect_instance`), playtesting
(`start_stop_play`, `get_console_output`, `screen_capture`, input simulation), and
multi-instance management (`list_roblox_studios`, `set_active_studio`).
