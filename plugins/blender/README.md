# Finish setup inside Blender

Connect Artyx to the **official Blender Lab MCP server** over HTTP. This plugin
ships client config only — you install and run the server yourself.

## Steps

1. In Blender, add the Blender Lab extensions repository `https://lab.blender.org/`
   and install+enable the **MCP** add-on (its preferences panel configures
   host/port and optional auto-start).
2. Install the official MCP server:
   `pip install "git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp"`
   (requires Python 3.10+).
3. Run it in HTTP mode: `blender-mcp --transport http --port 8000` (any free
   port; enter the same port when Artyx asks during install).

## Troubleshooting

- **Connection refused** — Is `blender-mcp` running in HTTP mode? Does the port
  match what you entered in Artyx?
- **Tools time out** — Is Blender open with the MCP add-on enabled? Check the
  add-on preferences for auto-start errors.
- **Wrong Blender instance** — Only one add-on listener should own the configured
  port.

Docs: https://www.blender.org/lab/mcp-server/
