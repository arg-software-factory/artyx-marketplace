# Contributing

Artyx Marketplace is PR-only. The Artyx team reviews and merges changes.

## Add A Plugin

1. Create `plugins/<plugin-id>/`.
2. Add `plugins/<plugin-id>/artyx-plugin.json`.
3. Add each skill under `plugins/<plugin-id>/skills/<skill-id>/SKILL.md`.
4. Add `plugins/<plugin-id>/setup.md` with human-readable setup notes.
5. Add an index entry to `marketplace.json`.
6. Run `npm run validate`.
7. Open a PR against the integration branch.

Plugin ids must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

## Manifest Schema

Each `artyx-plugin.json` is a strict JSON manifest. Unknown fields are rejected.

Required root fields:

- `id`: plugin id.
- `name`: machine-readable name.
- `version`: semantic version string like `1.0.0`.
- `summary`: short gallery summary.
- `author`: `{ "name": string, "url"?: string }`.
- `category`: one of `creative`, `dev`, `games`, `productivity`, `other`.
- `icon`: emoji shown in the gallery.
- `mcp`: MCP connection configuration.

Optional root fields:

- `displayName`
- `description`
- `tags`
- `license`
- `homepage`
- `experimental`
- `notes`
- `skills`
- `configSchema`
- `companion`

### MCP Config

`mcp` requires:

- `transport`: one of `stdio`, `http`, `sse`.
- `auth`: one of `none`, `oauth`.

Optional `mcp` fields:

- `timeoutMs`
- `bundledServer`
- `command`
- `args`
- `env`
- `cwd`
- `url`
- `headers`

For stdio plugins, use `command`, `args`, `env`, and `cwd` as needed. A bundled
stdio plugin can omit `command` and `args` when the desktop app provisions the
server.

For http or sse plugins, use `url` and `headers` as needed.

### Config Fields

`configSchema` has this shape:

```json
{
  "fields": [
    {
      "key": "API_KEY",
      "label": "API key",
      "type": "string",
      "sensitive": true,
      "required": true,
      "help": "Create this in the provider dashboard.",
      "placeholder": "sk-..."
    }
  ]
}
```

Config field keys must match `^[a-zA-Z0-9_]+$`. Field types are `string`,
`number`, or `boolean`.

### Placeholder Rules

Values in `mcp.env`, `mcp.args`, `mcp.url`, and `mcp.headers` may contain:

- `${config.KEY}` for a non-sensitive `configSchema` field. The value is
  substituted and persisted at install time.
- `${secret.KEY}` for a `sensitive: true` field. The value is stored in the OS
  keychain and injected at connect time. It is never persisted as plaintext.

Do not hardcode secrets in manifests, setup docs, or skills.

### Companion Setup

Use `companion` when a plugin needs an external application add-on, local bridge,
or manual setup step:

- `required`: whether setup is required before connect.
- `title`: setup title.
- `summary`: optional short summary.
- `steps`: ordered setup steps.
- `docsUrl`: optional documentation URL.
- `downloadUrl`: optional download URL.
- `prerequisites`: optional prerequisite list.

## Security Review Checklist

- Inspect the exact `command` and `args`; reject obfuscation or shell wrappers
  that hide what will run.
- DCC socket bridges must bind to localhost only. These bridges are commonly
  unauthenticated by design, so avoid exposing them to the network.
- Secrets must go through `configSchema` with `sensitive: true`; never hardcode
  credentials, tokens, or bearer strings.
- Pin server versions when the upstream supports it.
- Mark unverified upstream commands with `experimental: true` and add a `notes`
  field explaining what must be verified before stabilizing.
