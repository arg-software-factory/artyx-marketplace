# Artyx Marketplace

Artyx Marketplace is the curated catalog of plugins that [Artyx
Desktop](https://artyx.ai) offers to install. The desktop checks the commit at
the head of `main`, downloads that snapshot, and reads the catalog at
`.agents/plugins/marketplace.json`. A merge to `main` is a publish — there is
no separate release step.

Each plugin lives in its own directory under `plugins/`. A plugin is
configuration and documentation by default: it points Artyx at an MCP server or
external native runtime and optionally ships skills. Signed bundled runtimes are
reserved for official Artyx packages and are verified before execution.

A plugin also owns its **install instructions**, and it owns them by
reference: `interface.docsUrl` points at the upstream page, and that single
button is everything the desktop shows. Artyx ships no setup steps of its
own for anything in this catalog. When a vendor changes how their software is
installed, they change their own page, the next marketplace poll picks the
URL up, and no Artyx release is involved.

## Plugins

| Plugin | Category | Tagline |
| --- | --- | --- |
| [Blender](plugins/blender) | Creativity | Build and animate 3D scenes in a live Blender session. |
| [Unity](plugins/unity) | Developer Tools | Drive the Unity Editor: scenes, GameObjects, scripts, play-mode. |
| [Unreal Engine](plugins/unreal-engine) | Developer Tools | Automate the Unreal Editor: actors, Blueprints, levels. |
| [Godot](plugins/godot) | Developer Tools | Launch Godot, run projects, and read debug output over MCP. |
| [Game-Ready Assets](plugins/game-ready-assets) | Creativity | Budgets, topology, UVs, textures, LODs and export for any engine. |
| [Memory](plugins/memory) | Creativity | Remembers your project: characters, style decisions, naming, across chats. |
| [GTA V RAGE Assets](plugins/gta-v) | Creativity | Import, retexture, author liveries, and export GTA V bundles. |
| [GoldSrc Studio Models](plugins/goldsrc) | Creativity | Inspect, retexture, and compile GoldSrc MDL v10 assets. |

## The format

Every plugin here is an [Agent Plugins
1.0.0](https://agent-plugins.org/) package: a `plugin.json` manifest, an
optional `mcp.json`, and optional `skills/`. That format is not Artyx-specific
— any client that implements the specification can install these plugins,
because each `mcp.json` works with its literal values and carries no
Artyx-only data. Artyx's own storefront data (display name, tagline, typed
settings, a connection check) lives in one namespaced extension block,
`extensions["ai.artyx.desktop"]`, and its client files (the logo) live in the
`ai.artyx.desktop/` directory. The specification says every other client must
ignore both.

The catalog carries three kinds of plugins: skills and MCP (Blender, Unity,
Unreal Engine, Godot), skills only (Game-Ready Assets), and MCP only (Memory).

Artyx extension `schemaVersion: 3` explicitly classifies packages as
`conversational` or `native-asset`. How a user setting reaches an MCP server
is described in
[tooling/docs/spec-conformance.md](tooling/docs/spec-conformance.md#mcp-configuration-lives-only-in-mcpjson). Native runtimes, adapters, typed setup and
semantic authoring profiles are documented in
[tooling/docs/asset-adapters.md](tooling/docs/asset-adapters.md).

## Quickstart

```bash
npm ci
npm run validate  # Agent Plugins 1.0.0 + Artyx publishing policy
npm test          # the validator's own test suite
```

`npm run validate` is what CI runs on every pull request. See
[CONTRIBUTING.md](CONTRIBUTING.md) for how to add or change a plugin, and
[tooling/docs/spec-conformance.md](tooling/docs/spec-conformance.md) for where and why this
repository is stricter than the specification.

The repository intentionally has five content surfaces: `.agents/` is the
catalog, `plugins/` and `agents/` are installable packages, `.github/` is CI,
and `tooling/` contains every schema, validator and maintainer document. No
adapter executable or session-specific development state belongs here.
