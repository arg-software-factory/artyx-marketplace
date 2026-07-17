# Artyx Marketplace

Curated plugins for [Artyx](https://artyx.ai).

The marketplace index is `.agents/plugins/marketplace.json`. Each plugin lives
in `plugins/<name>/` and is self-contained client configuration — **no plugin
ships MCP server code**.

## Plugin format

Every plugin directory contains:

| Path | Required | Purpose |
| --- | --- | --- |
| `.artyx-plugin/plugin.json` | yes | Manifest (name, version, description, skills path, interface metadata) |
| `skills/` | if declared | Expert skill bundles for the agent |
| `.mcp.json` | optional | **Client-only** MCP connection config (how Artyx reaches an external server) |
| `README.md` | recommended | Human setup notes (companion steps are also in `plugin.json`) |

### `plugin.json` fields

- `name`, `version` (semver), `description`, `license`
- `skills` — path to the skills directory (must exist)
- `mcpServers` — path to `.mcp.json` when the plugin connects to MCP
- `interface.displayName`, `interface.category` — shown in the Artyx plugin UI
- `interface.longDescription`, `interface.capabilities`, `interface.brandColor`, …
- `artyx.companion` — install-time setup steps shown in the desktop client
- `icon: "./logo.png"` — **upcoming mandatory field**; plugin logos land in a
  follow-up wave

### `.mcp.json` — client config only

Plugins **connect** to external MCP servers. Supported transports (current
desktop):

**stdio** — spawn a third-party binary:

```json
{
  "mcpServers": {
    "example": {
      "command": "npx",
      "args": ["-y", "some-mcp-package"],
      "env": { "API_KEY": "${API_KEY}" }
    }
  }
}
```

**http** — reach a local or remote HTTP MCP endpoint:

```json
{
  "mcpServers": {
    "example": {
      "type": "http",
      "url": "http://${HOST}:${PORT}/mcp",
      "headers": { "Authorization": "Bearer ${TOKEN}" }
    }
  }
}
```

### Hard rules

1. **No server code in plugins** — no `server/` directory, no bundled `.mjs`
   launchers. Point `.mcp.json` at official or third-party packages instead.
2. **Parameterized host/port** — use `${VAR}` placeholders for hosts, ports,
   tokens, and paths. Artyx substitutes them during install and prompts the user
   when needed. Never hard-code loopback ports in `.mcp.json`.
3. **Category consistency** — `interface.category` in `plugin.json` is the
   source of truth; `marketplace.json` must match (enforced by CI).

## Validation

```bash
node scripts/validate-plugins.mjs
```

Runs on every PR and push to `main` via `.github/workflows/validate-plugins.yml`.
