# Native Unreal MCP: safe operating contract

## Scope and setup

UE 5.8 introduces the experimental **Unreal MCP** plugin. Its internal plugin identifier is
`ModelContextProtocol`; the Editor UI calls it Unreal MCP. Enable it in **Edit > Plugins**, accept
the Toolset Registry dependency, and restart. In Editor Preferences > General > Model Context
Protocol, enable Auto Start, or run `ModelContextProtocol.StartServer 8000`. Artyx connects via
`127.0.0.1:${UNREAL_MCP_PORT}` (default port 8000); do not expose the endpoint
remotely because the server has no authentication.

The server executes calls serially on the editor game thread. Do not issue parallel mutations and do
not treat a transport acknowledgement as proof that an editor action completed.

## Discovery-first protocol

With Tool Search enabled, only these meta-tools are listed:

- `list_toolsets` to enumerate capability groups.
- `describe_toolset` to obtain the live tool names and JSON schemas.
- `call_tool` to invoke a discovered tool.

Toolsets are extensible and vary by build/project. Discover the actual read and write operations
before use. If Tool Search is disabled, use the directly advertised tool schemas instead. A native
MCP session does **not** guarantee arbitrary Python, Blueprint graph editing, Sequencer, screenshots,
or any particular asset operation. Hand off unsupported work rather than fabricating a call.

## Mutation discipline

Use deterministic labels and UE units: centimeters, Z-up, left-handed coordinates; rotation is
degrees (Roll X, Pitch Y, Yaw Z). Read the existing level before spawning because default maps
already contain lights, sky, floor, and PlayerStart. After every write, query the created asset or
actor and compare the returned identifier, transform, and property values with the requested state.

For World Partition, a missing actor can be in an unloaded cell or hidden Data Layer. Verify cell and
layer state before creating a duplicate. A material parameter change is valid only after confirming
the parent exposes that parameter and the instance assignment reached the intended mesh slot.

## Recovery

If tools disappear, verify plugin enablement, restart, server state, and call
`ModelContextProtocol.RefreshTools` after changing tool providers. If a call fails twice with the
same schema/error, re-describe the toolset and stop. Report live schema/error text and the remaining
manual action.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-mcp-in-unreal-editor>
- <https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-5-8-release-notes>
