<div align="center">

![Artyx Marketplace](assets/banner.png)

# Artyx Marketplace

**Curated MCP servers &amp; skills for the [Artyx](https://artyx.ai) agent — one click to install.**

</div>

---

## What is this?

This repo is the source of truth for the **Artyx Marketplace** — the in‑app catalog where Artyx users install *plugins* that connect the agent to their favorite tools.

A **plugin** bundles two things (either, or both):

- 🔌 **an MCP server** — a live connection to an app or service (Blender, Unreal, GitHub, Figma…)
- 🧠 **skills** — up‑to‑date, task‑specific know‑how that makes the agent genuinely *pro* at that tool

The Artyx desktop app fetches [`marketplace.json`](marketplace.json), renders the gallery, and — on **Install** — writes the MCP config + skills into `~/.artyx`. Any secrets go straight to your OS keychain. That's it.

## v2: verified, portable packages

[`marketplace.v2.json`](marketplace.v2.json) is the release catalog for Artyx 0.6.2+
and uses schema version 2. Every entry identifies one immutable archive by URL, SHA-256,
and byte size, then declares its supported Artyx versions and platforms. Installers must
verify the digest and size before extracting the archive.

Each archive has one canonical `.artyx-plugin/plugin.json` (schema version 2) and explicit
components for its MCP map and skills. The build also generates small compatibility manifests
for Claude, Codex, and Cursor, so the package's identity, setup information, MCP config, and
skill stay aligned across clients. `mcp.json` is canonical; `.mcp.json` is the legacy-compatible
copy and is validated to be structurally equivalent after JSON parsing.

The release pipeline deliberately stores ZIP entries without compression and fixes timestamps.
That makes SHA-256 output reproducible across operating systems and Node versions—an installer
can trust a digest produced in CI rather than a developer's local machine.

## Catalog

| Plugin | Category | What it does |
|---|---|---|
| 🟠 **Blender** | Creative | Drive Blender via a bundled MCP bridge + the Blender add‑on |
| 🎮 **Unreal Engine** | Games | Automate the Unreal Editor through the community MCP bridge |
| 🧩 **Unity** | Games | Drive the Unity Editor through the community MCP bridge |
| 🐙 **GitHub** | Dev | Read repos, triage issues &amp; PRs, inspect CI |
| 🎨 **Figma** | Creative | Read files, frames &amp; design variables |
| 🖌️ **Photoshop** | Creative | Layers, adjustments &amp; exports via a community bridge |

> More coming — and it's just a PR away. 👇

## Anatomy of a plugin

Ultra‑simple, mirroring [Anthropic's plugin layout](https://github.com/anthropics/claude-plugins-official) — one folder, two files, an optional `skills/`:

```
plugins/<name>/
├── .artyx-plugin/plugin.json   # canonical v2 identity + components
├── .claude-plugin/plugin.json   # identity + optional setup guide
├── .mcp.json                    # standard MCP server config (drop‑in compatible)
├── mcp.json                     # canonical v2 MCP config
├── skills/<name>/SKILL.md       # the know‑how (optional)
└── README.md
```

Secrets are bare `${VAR}` placeholders in `.mcp.json` — the app detects them, asks once, and stores them in the OS keychain (never in plaintext). Reserved `${ARTYX_ELECTRON}` / `${ARTYX_BUNDLED}` app‑vars are resolved by Artyx.

## Contribute

Adding a plugin is a folder and a pull request. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the schema and the security checklist. Only the Artyx team merges — every server is reviewed before it ships.

```bash
npm install && npm run validate   # validate your plugin locally
npm run catalog:v2                # regenerate verified digests after a v2 package change
```

---

<div align="center">
<sub>Built for <a href="https://artyx.ai">Artyx</a> — the agentic studio for AI design · MIT licensed</sub>
</div>
