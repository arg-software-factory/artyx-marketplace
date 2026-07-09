# Contributing

Artyx Marketplace is PR-only. The Artyx team reviews and merges changes.

## Add A Plugin

1. Create `plugins/<plugin-name>/`.
2. Add `plugins/<plugin-name>/.claude-plugin/plugin.json`.
3. Add `plugins/<plugin-name>/.mcp.json` when the plugin exposes MCP tools.
4. Add skills under `plugins/<plugin-name>/skills/<skill-id>/SKILL.md` when the plugin teaches agent behavior.
5. Add `plugins/<plugin-name>/README.md` when setup notes help a human complete installation.
6. Add an index entry to `marketplace.json`.
7. Run `npm run validate`.
8. Open a PR against the integration branch.

Plugin names must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

A plugin can be MCP-only, skills-only, or both.

## Plugin Identity

Each `.claude-plugin/plugin.json` is strict JSON. Unknown fields are rejected.

Required fields:

- `name`: kebab-case plugin name.
- `description`: plugin description.
- `author`: `{ "name": string, "url"?: string }`.

Optional fields:

- `version`: semantic version string.
- `homepage`: documentation or upstream URL.
- `keywords`: string array.
- `companion`: setup card consumed by the desktop.

## MCP Config

Each `.mcp.json` uses the standard MCP shape:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "uvx",
      "args": ["server-package"],
      "env": {
        "EXAMPLE_PORT": "9876"
      }
    }
  }
}
```

HTTP and SSE servers use `type`, `url`, and optional `headers`:

```json
{
  "mcpServers": {
    "server-name": {
      "type": "http",
      "url": "https://example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${EXAMPLE_TOKEN}"
      }
    }
  }
}
```

Stdio servers use `command`, optional `args`, optional `env`, and optional `cwd`.

## Placeholder Rules

Use bare `${VAR}` placeholders in `.mcp.json` values when user configuration or
secrets are needed. Placeholders can appear in `url`, `headers`, `args`, and
`env` values.

Reserved app-provided variables are resolved by Artyx and are never prompted:

- `${ARTYX_ELECTRON}`: the app's node/electron binary.
- `${ARTYX_BUNDLED}`: the bundled MCP servers directory.

Every other `${...}` variable is treated as user-provided. The desktop prompts
for it and should store sensitive values outside plaintext manifests.

Do not hardcode tokens, credentials, bearer strings, or machine-specific paths.

## Companion Setup

Use `companion` when a plugin needs an external application add-on, local bridge,
token setup, or manual step:

- `title`: setup title.
- `summary`: optional short summary.
- `steps`: ordered setup steps.
- `docsUrl`: optional documentation URL.
- `downloadUrl`: optional download URL.
- `prerequisites`: optional prerequisite list.

Mirror the same setup information in `plugins/<plugin-name>/README.md` so the
repo remains readable without the desktop app.

## Security Review Checklist

- Inspect the exact `command` and `args`; reject obfuscation or shell wrappers that hide what will run.
- Prefer pinned server versions when the upstream supports them.
- Treat every non-reserved `${...}` value as user-provided and potentially sensitive.
- Never commit real tokens, API keys, cookies, OAuth credentials, or bearer values.
- DCC and game-editor socket bridges must bind to localhost unless there is a reviewed authentication story.
- Mark unverified upstream commands or auth flows with `experimental: true` in `marketplace.json`.
- Keep setup instructions honest about prerequisites, network access, and local services.
