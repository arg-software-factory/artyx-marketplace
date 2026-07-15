# Enable Unreal Engine's native MCP server

Unreal Engine 5.8 ships a native MCP server inside the editor. Artyx connects to
it directly over local HTTP — there is no third-party server to install.

## Prerequisites

- Unreal Engine 5.8 or newer

## Steps

1. In Unreal Engine 5.8+: `Edit → Plugins`, search `Unreal MCP` (plugin id `ModelContextProtocol`), tick `Enabled`, and restart the editor when prompted.
2. Start the server: `Edit → Editor Preferences → General → Model Context Protocol` → enable `Auto Start Server` (off by default), or run `ModelContextProtocol.StartServer` in the editor console on demand.
3. Keep a project open — the server listens on `http://127.0.0.1:8000/mcp` (HTTP + SSE, loopback) and Artyx connects to it automatically once it is running.

Docs: https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor
