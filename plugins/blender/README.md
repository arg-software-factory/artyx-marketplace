# Blender

Connects Artyx to the **official Blender Lab MCP server** over HTTP. This
plugin ships client configuration only — you install and run the server
yourself.

**Install instructions: [blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/)**

That URL is `interface.docsUrl` in `plugin.json`, and it is what the desktop's
"How to install" button opens. The steps are deliberately not mirrored here or
in the manifest: Blender owns them, and a copy only goes stale.

Shape of the connection: `blender-mcp` runs as a local process in HTTP mode and
relays to the MCP add-on inside Blender. Artyx talks to that process at
`http://127.0.0.1:${BLENDER_MCP_PORT}/` — the port you started it on, asked for
at install time and defaulting to 8000.

## Troubleshooting

- **Connection refused** — Is `blender-mcp` running in HTTP mode? Does the port
  match what you entered in Artyx?
- **Tools time out** — Is Blender open with the MCP add-on enabled? Check the
  add-on preferences for auto-start errors.
- **Wrong Blender instance** — Only one add-on listener should own the
  configured port.
