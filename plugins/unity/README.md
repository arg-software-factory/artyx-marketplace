# Unity

Connects Artyx to the **CoplayDev Unity MCP** bridge running inside a live
Unity Editor. Artyx launches the Python server through `uvx`; the editor-side
package is installed from Unity's own Package Manager.

**Install instructions: [CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp#readme)**

That URL is `interface.docsUrl` in `plugin.json`, and it is what the desktop's
"How to install" button opens. The steps are not mirrored here or in the
manifest — the bridge's authors own them.

This plugin needs no install-time input: `mcp.json` is literal, so there are no
`userVars` and no overlay. `uvx` must be on PATH, which the desktop preflights
via `requires`.

## Troubleshooting

- **`uvx` not found** — Install uv (https://astral.sh/uv) and restart Artyx so
  the PATH change is picked up.
- **Tools connect but do nothing** — The Unity-side bridge window is closed, or
  the editor is compiling.
