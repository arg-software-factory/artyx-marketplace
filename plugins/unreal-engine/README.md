# Unreal Engine

Unreal Engine 5.8 ships a native MCP server inside the editor. Artyx connects
to it directly over local HTTP — there is no third-party server to install.

**Install instructions: [Unreal MCP in the Unreal
Editor](https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor)**

That URL is `interface.docsUrl` in `plugin.json`, and it is what the desktop's
"How to install" button opens. Epic owns the enable-the-plugin and
start-the-server procedure; it is not mirrored here or in the manifest.

Artyx talks to `http://127.0.0.1:8000/mcp`, the editor's default, as written in
`mcp.json`. The port is the one setting (`UNREAL_MCP_PORT`): change it only if
you started the server on another port. Artyx swaps it into the url; nothing
else in the configuration changes.

## Troubleshooting

- **Connection refused** — The server is not started. It does not auto-start
  unless the editor preference for it is enabled.
- **Empty tool list** — No project is open in the editor.
