# Latest Session

2026-07-17T1520 (claude) - Pure-client marketplace plugin cleanup

Wave 1 pure-client cleanup largely landed on feat/pure-client-cleanup. Done: mcp-power-user removed; Blender connects to official Lab HTTP MCP (BLENDER_MCP_PORT); Godot spawns @coding-solo/godot-mcp via npx (GODOT_PATH); Unreal host/port parametrized; CI validator + root README for pure-client rules. Constraints for any follow-up: no bundled server code in plugins; only stdio/http transports; all host/port/url/command/args/env values use ${VAR} placeholders; no new .mcp.json shapes; do not touch plugins/roblox-studio/. Next: verify branch completeness vs full wave spec, run CI validator locally, open/merge PR to main (live for all desktop clients). If more plugins remain in spec tail, apply same pattern: delete server/, external MCP only, bump plugin.json, update companion steps and skills.
