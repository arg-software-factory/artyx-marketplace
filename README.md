<div align="center">

![Artyx Marketplace](assets/banner.png)

# Artyx Marketplace

**Curated MCP servers and skills for the [Artyx](https://artyx.ai) agent.**

</div>

---

## What This Repo Is

Artyx Marketplace is a git-backed catalog of installable plugins for Artyx.

The core rule is simple: [`marketplace.json`](marketplace.json) is a thin
curated index, and each plugin under `plugins/<name>/` is a self-describing
bundle. The plugin's `.artyx-plugin/plugin.json` carries all storefront and
install metadata.

`marketplace.json` only contains ordered pointers:

```json
{ "name": "blender", "source": "./plugins/blender" }
```

Array order is the curation order shown by Artyx. Storefront fields such as
display name, category, icon, copy, screenshots, and experimental status belong
in the plugin manifest, not in the index.

Publishing is merging to `main`. There are no releases, tags, package uploads,
or generated catalogs.

## Plugin Layout

```text
plugins/<name>/
|-- .artyx-plugin/plugin.json       # required manifest
|-- skills/<id>/SKILL.md            # optional, one or more skills
|-- .mcp.json                       # optional MCP server config
|-- assets/                         # optional icons, logos, screenshots, binaries
|-- agents/                         # reserved for future agent bundles
|-- commands/                       # reserved for future command bundles
|-- hooks.json                      # reserved for future hooks
`-- README.md                       # plugin docs and setup notes
```

Plugins can contain MCP config, skills, assets, or any combination that matches
the manifest. The validator allows the reserved `agents/`, `commands/`, and
`hooks.json` paths for forward compatibility.

Secrets and user-specific settings in `.mcp.json` use bare `${VAR}`
placeholders. Artyx resolves reserved app variables such as `${ARTYX_ELECTRON}`
and `${ARTYX_BUNDLED}`; other placeholders are prompted for by the desktop app.

## Manifest

Each plugin manifest lives at:

```text
plugins/<name>/.artyx-plugin/plugin.json
```

The manifest is strict JSON validated by
[`schema/plugin.schema.json`](schema/plugin.schema.json). Required top-level
fields are `name`, `version`, `description`, `author`, and `interface`.

The `interface` block is the storefront card:

| Field | Required | Purpose |
| --- | --- | --- |
| `displayName` | Yes | Human-readable plugin name. |
| `shortDescription` | Yes | Short storefront summary. |
| `category` | Yes | One of `creative`, `dev`, `games`, `productivity`, `other`. |
| `icon` | Yes | Emoji or `./assets/...` path. |
| `longDescription` | No | Longer storefront copy. |
| `capabilities` | No | `Interactive`, `Read`, and/or `Write`. |
| `brandColor` | No | Hex color, such as `#EA7600`. |
| `logo` | No | Optional `./assets/...` logo path. |
| `defaultPrompt` | No | Example prompts to start from. |
| `screenshots` | No | Optional screenshot paths. |
| `experimental` | No | Marks the plugin as experimental. |

Other install metadata, such as `repository`, `license`, `compatibility`,
`components`, and `companion`, also lives in this manifest when applicable.

## Validate

```bash
npm install
npm run validate
```

Validation checks the marketplace schema, plugin manifests, MCP config,
placeholder names, skill frontmatter, repository limits, symlinks, junk files,
and plugin version bumps.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution checklist and review
rules.
