# Unreal Engine

Unreal Engine 5.8 ships a native MCP server inside the editor. Artyx connects
to it directly over local HTTP — there is no third-party server to install.

**Install instructions: [Unreal MCP in the Unreal
Editor](https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor)**

That URL is `interface.docsUrl` in `plugin.json`, and it is what the desktop's
"How to install" button opens. Epic owns the enable-the-plugin and
start-the-server procedure; it is not mirrored here or in the manifest.

Artyx talks to `http://127.0.0.1:${UNREAL_MCP_PORT}/mcp`. The port is the one
value asked for at install time and defaults to 8000, matching the editor's own
default.

## Troubleshooting

- **Connection refused** — The server is not started. It does not auto-start
  unless the editor preference for it is enabled.
- **Empty tool list** — No project is open in the editor.
