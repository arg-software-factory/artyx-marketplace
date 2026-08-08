# Artyx Marketplace

Artyx Marketplace is the curated catalog of plugins that [Artyx
Desktop](https://artyx.ai) offers to install. The desktop reads the catalog at
`.agents/plugins/marketplace.json` over plain git. A merge to `main` is a
publish — there is no separate release step.

Each plugin lives in its own directory under `plugins/`. A plugin is
configuration and documentation, never code: it points Artyx at an MCP
server and, optionally, ships skills that teach the agent how to use it.

## Plugins

| Plugin | Category | Tagline |
| --- | --- | --- |
| [Blender](plugins/blender) | Creativity | Build and animate 3D scenes in a live Blender session. |
| [Unity](plugins/unity) | Developer Tools | Drive the Unity Editor: scenes, GameObjects, scripts, play-mode. |
| [Unreal Engine](plugins/unreal-engine) | Developer Tools | Automate the Unreal Editor: actors, Blueprints, levels. |
| [Godot](plugins/godot) | Developer Tools | Launch Godot, run projects, and read debug output over MCP. |

## The format

Every plugin here is an [Agent Plugins
1.0.0](https://agent-plugins.org/) package: a `plugin.json` manifest, an
optional `mcp.json`, and optional `skills/`. That format is not Artyx-specific
— any client that implements the specification can install these plugins,
because a plugin's portable files carry no Artyx-only data. Artyx's own
storefront data (display name, tagline, install-time prompts) lives in one
namespaced extension block, `extensions["ai.artyx.desktop"]`, which the
specification says every other client must ignore.

## Quickstart

```bash
npm ci
npm run validate  # Agent Plugins 1.0.0 + Artyx publishing policy
npm test          # the validator's own test suite
```

`npm run validate` is what CI runs on every pull request. See
[CONTRIBUTING.md](CONTRIBUTING.md) for how to add or change a plugin, and
[docs/spec-conformance.md](docs/spec-conformance.md) for where and why this
repository is stricter than the specification.
