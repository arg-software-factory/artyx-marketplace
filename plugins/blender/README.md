# Blender

Connects Artyx to the **official Blender Lab MCP server** (`blender-mcp` 1.0.3)
and the MCP add-on inside Blender. This plugin ships client configuration and
skills only.

**Setup: [blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/)**

That URL is `interface.docsUrl` in `plugin.json`, and it is what the desktop's
"How to install" button opens. The steps are not mirrored here: Blender owns
them, and a copy only goes stale.

## How it connects

```
Artyx  <= MCP over stdio =>  blender-mcp  <= TCP 127.0.0.1:9876 =>  MCP add-on in Blender
```

- The client starts `blender-mcp` itself with `uvx`, pinned to commit
  `2cea8d566dde07fbac28a61d698909d69724e853` of the Blender Lab repository,
  which is the `v1.0.3` tag (see `mcp.json`; JSON has no comments, so the tag
  is recorded here). A commit cannot move the way a tag can. The first start
  clones and resolves it, which takes a few seconds; later starts are fast. It
  needs `uv` and `git` on the machine (`requires`).
- The artist opens Blender 5.1 or later with the MCP add-on enabled. The
  add-on listens on port 9876 by default.
- The only setting is that port, `BLENDER_MCP_PORT`. Artyx probes
  9876-9879 and pre-fills the one that answers. Other clients use the literal
  9876 in `mcp.json`.
- The server connects to Blender only when a tool runs, so a connection test
  calls `get_blendfile_summary_path_info`.

Do not use `uvx blender-mcp` from PyPI: that is a different, third-party
project with the same name.

## Troubleshooting

- **"Cannot connect to Blender at localhost:9876"**: open Blender, enable the
  MCP add-on with Auto Start, and turn on Preferences > System > Allow Online
  Access. Check that the port in Artyx matches the add-on's port.
- **"Needs uv"**: install uv from https://docs.astral.sh/uv/.
- **Screenshots come back cut off on macOS**: update the add-on to 1.0.3 or
  later from the Blender Lab extensions repository.
- **Security**: `execute_blender_code` runs Python inside Blender with no real
  sandbox. Only connect a Blender session you are willing to let the agent
  change.
