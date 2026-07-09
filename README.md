# Artyx Marketplace

This repository is the curated catalog of Artyx desktop plugins.

An Artyx plugin bundles:

- an MCP server configuration
- one or more agent skills
- optional setup instructions for companion apps or local bridges

The desktop app consumes this repo by fetching `marketplace.json`, rendering the
plugin gallery, and installing a selected plugin by writing its MCP config and
skills into the user's `~/.artyx` directory.

Phase 0 is content only. There is no desktop, Electron, or TypeScript app code
in this repository.

## Layout

```text
marketplace.json
schema/
  marketplace.schema.json
  artyx-plugin.schema.json
plugins/
  <plugin-id>/
    artyx-plugin.json
    setup.md
    skills/
      <skill-id>/
        SKILL.md
```

`marketplace.json` is the lightweight gallery index. Each plugin folder contains
the full install manifest, browsable setup notes, and the skills that should be
copied into the user's Artyx home during install.

## Validate

```bash
npm install
npm run validate
```

See `CONTRIBUTING.md` for the plugin manifest rules, placeholder convention, and
security review checklist.
