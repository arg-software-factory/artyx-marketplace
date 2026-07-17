---
name: roblox-studio-workflows
description: Core workflows for building in Roblox Studio via its official MCP tools - connection checks, Luau script editing, playtesting loops, asset insertion, and multi-instance handling. Use whenever working with Roblox Studio.
---

# Roblox Studio workflows

Roblox Studio's MCP server is built into Studio itself. Every tool operates on a live, running Studio session.

## Always start with a connection check

Before any other tool, call `get_studio_state`. It confirms the connection and tells you which place is open, the play state, and the available datamodel types.

If it fails or no Studio responds:
1. Ask the user to confirm Roblox Studio is running with a place open.
2. Ask them to verify the MCP server is enabled: Assistant panel -> "..." (More) menu -> Manage MCP Servers -> toggle "Enable Studio as MCP server".
3. If they just enabled it, retry once - the connection can take a moment.

## Multiple Studio instances

If the user may have several Studio windows open, call `list_roblox_studios` first. If more than one is listed, confirm which place the user means before `set_active_studio`. Never assume - edits go to the active instance.

## Script editing flow

1. Locate: `script_search` (fuzzy name match) or `script_grep` (content match); `search_game_tree` if you only know the instance location. Scripts are addressed with dot notation (`game.ServerScriptService.MyScript`).
2. Read: `script_read` the target before editing. Never edit a script you have not read.
3. Edit: `multi_edit` with precise edits (it creates the script if the path does not exist; it requires a `datamodel_type`). Keep edits minimal and preserve the user's style.
4. Verify: re-read the changed region, then validate behavior with `execute_luau` or a playtest.

## Running code

`execute_luau` runs code in Studio (requires `datamodel_type`: Edit, Client, or Server). Use it for quick checks, one-off scene manipulation, and printing state. Prefer real scripts via `multi_edit` for anything the experience needs at runtime - command-bar code does not persist as game logic.

## Playtest loop

1. `start_stop_play` to start a playtest.
2. `get_console_output` for errors and prints; `screen_capture` to see the viewport.
3. Optionally drive testing with `character_navigation`, `user_keyboard_input`, `user_mouse_input`.
4. `start_stop_play` again to stop. Always stop when done - edits made during play mode do not persist.

## Asset flow

1. `search_asset` to find Creator Store / inventory assets; surface the top candidates when the choice is subjective.
2. `insert_asset` by numeric asset ID, then `inspect_instance` / `search_game_tree` to confirm placement and reposition if needed.
3. Generation tools (`generate_mesh`, `generate_material`, `generate_procedural_model`) run as async jobs - call `wait_job_finished` before using the result.

## General cautions

- Studio edits are live and undo history belongs to the user; announce destructive changes (deleting instances, overwriting scripts) before making them.
- After any world edit, verify with `inspect_instance` or `get_studio_state` rather than assuming success.
- For Roblox API questions, prefer the server's own `http_get` (allowlisted Roblox docs) over guessing.
