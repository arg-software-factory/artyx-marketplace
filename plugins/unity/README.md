# Unity MCP

This plugin connects Artyx to **Unity's official MCP Server** in Unity 6 through the
local Unity relay. It does not install the older community Python bridge.

## Requirements

- Unity 6 (6000.0)+ with the `com.unity.ai.assistant` package installed.
- The Unity AI project, account, and subscription/trial requirements described in the
  [Unity MCP documentation](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.9/manual/integration/unity-mcp-get-started.html).
- A value for `UNITY_MCP_RELAY`: the absolute executable path to Unity's local relay.

## Setup

1. Open the Unity project. Go to **Edit → Project Settings → AI → Unity MCP Server**;
   confirm **Unity Bridge** is Running (or select **Start**).
2. Set `UNITY_MCP_RELAY` when Artyx prompts. Unity installs the relay under
   `~/.unity/relay/`; choose the documented executable for the current OS. Do not use
   `~` in the value because many MCP clients do not expand it.
3. Reconnect Artyx. Under **Pending Connections**, inspect the client and select
   **Accept**. The client should then appear in **Connected Clients**.
4. Ask the agent to summarize Console warnings/errors. That read-only request confirms
   the connection before any project mutation.

The relay receives the required `--mcp` argument. With several Unity Editors open, set
the target through the relay's documented `--project-path`/`UNITY_PROJECT_PATH` or
`--instance-id`/`UNITY_INSTANCE_ID` options; do not let an edit land in the wrong project.

## Operating safely

- Inspect the active scene, hierarchy, and Console before each task.
- Make one reversible change at a time; read it back, then save in Edit Mode.
- After C# edits, wait for compilation and resolve Console errors before continuing.
- Use focused Edit Mode/Play Mode tests; exit Play Mode before authoring because runtime
  changes are normally reverted.
- Keep Unity's connection approval intact. Never replace the relay, scan ports, or
  expose editor control outside the local user session.

See [the included operator skill](skills/unity-mcp/SKILL.md) and Unity's
[MCP setup guide](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.9/manual/integration/unity-mcp-get-started.html).
