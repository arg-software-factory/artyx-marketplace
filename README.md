# Artyx Marketplace

This repository is the curated catalog of MCP servers and skills for the Artyx
agent.

The layout mirrors Anthropic's external plugin shape: each plugin folder is
self-contained and predictable. A plugin can be MCP-only, skills-only, or both.

## Layout

```text
marketplace.json
schema/
  marketplace.schema.json
  plugin.schema.json
  mcp.schema.json
scripts/
  validate.mjs
plugins/
  <plugin-name>/
    .claude-plugin/
      plugin.json
    .mcp.json
    README.md
    skills/
      <skill-id>/
        SKILL.md
```

`marketplace.json` is the gallery index. It keeps only the fields needed to
render the catalog: identity, category, icon, source, homepage, and experimental
status.

Each plugin contains:

- `.claude-plugin/plugin.json`: plugin identity and optional `companion` setup card.
- `.mcp.json`: standard MCP server config using `mcpServers`.
- `skills/<skill-id>/SKILL.md`: optional agent skills.
- `README.md`: human-readable setup notes that mirror the companion card.

## Placeholders

MCP config values can use Anthropic-style `${VAR}` placeholders in `url`,
`headers`, `args`, and `env` values. The desktop prompts the user for each
non-reserved variable.

Reserved app-provided variables are resolved by Artyx and are never prompted:

- `${ARTYX_ELECTRON}`
- `${ARTYX_BUNDLED}`

## Validate

```bash
npm install
npm run validate
```

The validator checks the marketplace index, each plugin identity manifest,
optional MCP config, skill frontmatter, and companion URLs.
