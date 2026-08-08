# Latest Session

2026-08-08 (claude) - docsUrl replaces the companion setup block

Install instructions are now owned by the plugin and referenced, never copied.
`extensions["ai.artyx.desktop"].interface.docsUrl` is required (https, upstream
page) and `companion` is gone from `schemas/artyx/extension.schema.json`, from
blender/unity/godot/unreal-engine (versions bumped: 2.3.0 / 1.5.0 / 2.3.0 /
2.4.0), from `scripts/new-plugin.mjs` (now takes a required `--docs`), and from
CONTRIBUTING/README. Plugin READMEs were rewritten to point at the upstream page
instead of mirroring its steps, and `check-doc-links.mjs` now fetches every
manifest `docsUrl` (and skips RFC 2606 example domains). `npm run validate`,
`npm test` (48) and the link checker are green.

The matching desktop change landed in artyx-desktop: `interface.docsUrl` flows
through the loader into the catalog entry, Settings → Marketplace renders one
"How to install" button per card plus one in the config dialog, and
`marketplace:get-companion` / `CompanionSetup` were deleted.

Constraints unchanged: no bundled server code; stdio + http transports only; the
portable `mcp.json` must equal the overlay with defaults applied. New one: never
restate a vendor's install steps anywhere in this repo — a URL is the interface.
