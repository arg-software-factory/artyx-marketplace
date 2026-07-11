# Unreal Engine MCP

This plugin connects Artyx to **Epic's native Unreal MCP server** in Unreal Engine 5.8. It deliberately does not install or launch the older community Python bridges.

## Requirements

- Unreal Engine 5.8. Unreal MCP is an **Experimental** built-in plugin.
- An Artyx MCP-capable client running on the same machine as Unreal Editor.

## Setup

1. In the target project, select **Edit → Plugins**, search for **Unreal MCP**, enable it, and restart the editor.
2. Open **Edit → Editor Preferences → General → Model Context Protocol**. Enable **Auto Start Server**.
3. Keep the defaults unless there is a deliberate local conflict: `http://127.0.0.1:8000/mcp` (port `8000`, path `/mcp`).
4. In the editor console, run `ModelContextProtocol.GenerateClientConfig All` (or the named client). Use the generated configuration if your project uses a non-default port or path.
5. Reconnect Artyx and ask a read-only question such as "What actors are selected?" before requesting edits.

The included `mcp.json` targets Epic's documented default endpoint. The server is local-only by design and has **no authentication**: never bind or proxy it beyond loopback.

## Tool availability

Unreal MCP supplies the server; toolsets supply the editor actions. If discovery shows no useful tools, enable **AllToolsets** in **Edit → Plugins**, restart/reconnect, then discover toolsets again. Tool schemas are dynamic, so agents must inspect the connected server rather than assuming a fixed set of commands.

## References

- [Unreal MCP in Unreal Editor](https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor)
- [Working with Plugins](https://dev.epicgames.com/documentation/unreal-engine/working-with-plugins-in-unreal-engine)
- [Unreal coordinate system and spaces](https://dev.epicgames.com/documentation/unreal-engine/coordinate-system-and-spaces-in-unreal-engine)
