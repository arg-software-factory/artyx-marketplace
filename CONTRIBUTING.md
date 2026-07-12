# Contributing

Artyx Marketplace is PR-only. The Artyx team reviews changes and publishes by
merging to `main`.

## Principle

`marketplace.json` is a thin curated index. Each entry is only:

```json
{ "name": "plugin-name", "source": "./plugins/plugin-name" }
```

All storefront and install metadata lives in
`plugins/<name>/.artyx-plugin/plugin.json`. Keep the index small and put plugin
details in the plugin bundle.

## Add A Plugin

1. Create `plugins/<name>/`.
2. Add `plugins/<name>/.artyx-plugin/plugin.json`.
3. Add optional `skills/<id>/SKILL.md` files.
4. Add optional `.mcp.json` when the plugin exposes MCP tools.
5. Add optional `assets/` files for icons, logos, screenshots, or binaries.
6. Add `plugins/<name>/README.md` with setup notes.
7. Add `{ "name": "<name>", "source": "./plugins/<name>" }` to
   `marketplace.json` in the curated position you want.
8. Run `npm run validate`.
9. Open a PR to `develop`.

Publishing is merge to `main`. There are no releases, tags, generated catalogs,
or packaging steps.

## Plugin Manifest

Each `.artyx-plugin/plugin.json` is strict JSON validated by
[`schema/plugin.schema.json`](schema/plugin.schema.json). Unknown fields are
rejected.

Required top-level fields:

- `name`: kebab-case plugin name.
- `version`: semver version.
- `description`: one-line search/indexing summary.
- `author`: string or `{ "name": string, "url"?: string }`.
- `interface`: storefront metadata.

Optional top-level fields from the schema:

- `$schema`
- `homepage`
- `repository`
- `license`
- `keywords`
- `compatibility`
- `components`
- `companion`

Changing content inside a plugin requires a `version` bump. Artyx desktop caches
installed plugin content by immutable version.

## Interface Block

`interface` is the single source of truth for the storefront card.

Required fields:

- `displayName`
- `shortDescription`
- `category`: one of `creative`, `dev`, `games`, `productivity`, `other`.
- `icon`

Optional fields:

- `longDescription`
- `capabilities`: `Interactive`, `Read`, and/or `Write`.
- `brandColor`
- `logo`
- `defaultPrompt`
- `screenshots`
- `experimental`

Do not duplicate these fields in `marketplace.json`.

## Bundle Layout

```text
plugins/<name>/
|-- .artyx-plugin/plugin.json
|-- skills/<id>/SKILL.md
|-- .mcp.json
|-- assets/
|-- agents/
|-- commands/
|-- hooks.json
`-- README.md
```

`skills/`, `.mcp.json`, and `assets/` are optional. `agents/`, `commands/`, and
`hooks.json` are reserved and may be included for forward-compatible bundles.

Skills must be directories, each with `SKILL.md` frontmatter containing `name`
and `description`. Do not include `enabled:` frontmatter.

## MCP Config

Each `.mcp.json` uses the standard MCP shape:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "uvx",
      "args": ["server-package"],
      "env": {
        "EXAMPLE_TOKEN": "${EXAMPLE_TOKEN}"
      }
    }
  }
}
```

HTTP and SSE servers use `type`, `url`, and optional `headers`.

Use bare `${VAR}` placeholders for user configuration or secrets. Placeholder
names must be uppercase. Reserved app-provided variables are:

- `${ARTYX_ELECTRON}`: the app's node/electron binary.
- `${ARTYX_BUNDLED}`: the bundled MCP servers directory.

Prefer remote HTTP servers or stdio servers launched through
`${ARTYX_ELECTRON}` with `${ARTYX_BUNDLED}` assets. `npx`, `uvx`, `node`, or
other local binaries require `companion.steps` so users know the prerequisite
setup.

## Companion Setup

Use `companion` when a plugin needs an external application add-on, local
bridge, token setup, or manual step:

- `title`
- `summary`
- `steps`
- `docsUrl`
- `downloadUrl`
- `prerequisites`

Mirror setup information in `plugins/<name>/README.md` so the repo remains
readable outside the desktop app.

## Security Review

- Inspect `command` and `args`; reject obfuscation or shell wrappers that hide what will run.
- Prefer pinned server versions when upstream supports them.
- Treat every non-reserved `${...}` value as user-provided and potentially sensitive.
- Never commit tokens, API keys, cookies, OAuth credentials, or bearer values.
- DCC and game-editor socket bridges must bind to localhost unless authentication is reviewed.
- Mark unverified upstream commands or auth flows with `interface.experimental: true`.
- Keep setup instructions honest about prerequisites, network access, and local services.
