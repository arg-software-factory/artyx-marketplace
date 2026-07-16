---
name: unreal-engine-mcp
description: Operate a connected Unreal Editor safely through Epic's experimental native Unreal MCP server in UE 5.8. Use for tool discovery, actor and asset edits, material-instance work, editor inspection, or automation through the live MCP surface.
---

# Unreal MCP (UE 5.8 experimental)

This skill applies only to Epic's **native** UE 5.8 `ModelContextProtocol` plugin, not a third-party
bridge. It is local-only by default and its APIs/toolsets can change. Read
[native-mcp.md](references/native-mcp.md) before connecting or mutating.

## Session protocol

1. Confirm editor, project, map, plugin, and server URL are live.
2. Call `list_toolsets`, then `describe_toolset` for each needed toolset.
3. Use only schemas returned by this editor. Never infer a tool or argument name from this skill.
4. Inspect first; perform serial, small mutations; read back every material change, actor, property,
   asset, or test result.
5. Stop after two equivalent failures and report the exact error plus the unsupported boundary.

Load domain guidance after discovery: project architecture for project-safe edits, materials/lighting
for lookdev, world building for maps, cinematics for sequences, and performance/packaging for tests.
