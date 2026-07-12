<div align="center">

![Artyx Marketplace](assets/banner.png)

# Artyx Marketplace

**Curated MCP servers &amp; skills for the [Artyx](https://artyx.ai) agent — git-backed and one click to install.**

</div>

---

## What is this?

This repo is the single source of truth for the **Artyx Marketplace** — the in-app catalog where Artyx users install *plugins* that connect the agent to their favorite tools.

A **plugin** bundles two things (either, or both):

- 🔌 **an MCP server** — a live connection to an app or service (Blender, Unreal, GitHub, Figma…)
- 🧠 **skills** — up‑to‑date, task‑specific know‑how that makes the agent genuinely *pro* at that tool

The Artyx desktop app resolves the current `main` commit SHA through `api.github.com`, downloads a zipball from `codeload.github.com` pinned to that SHA, then reads [`marketplace.json`](marketplace.json) and `plugins/<name>/` directly from the checkout. There are no releases, packages, or generated catalogs: publishing is merging to `main`.

On **Install**, the desktop writes the MCP config + skills into `~/.artyx`. Any secrets go straight to your OS keychain. That's it.

## Catalog

| Plugin | Category | What it does |
|---|---|---|
| 🟠 **Blender** | Creative | Drive Blender via a bundled MCP bridge + the Blender add‑on |
| 🎨 **Figma** | Creative | Read files, frames &amp; design variables |
| 🖌️ **Photoshop** | Creative | Layers, adjustments &amp; exports via a community bridge |
| 🐙 **GitHub** | Dev | Read repos, triage issues &amp; PRs, inspect CI |
| 🧩 **Unity** | Games | Drive the Unity Editor through the community MCP bridge |
| 🎮 **Unreal Engine** | Games | Automate the Unreal Editor through the community MCP bridge |
| 🧠 **MCP Power User** | Productivity | Reliable playbook for driving any connected MCP server |

> More coming — and it's just a PR away. 👇

## Anatomy of a plugin

Ultra‑simple, mirroring [Anthropic's plugin layout](https://github.com/anthropics/claude-plugins-official) — one folder, two files, an optional `skills/`:

```
plugins/<name>/
├── .claude-plugin/plugin.json   # identity + optional setup guide
├── .mcp.json                    # standard MCP server config (drop‑in compatible)
├── skills/<name>/SKILL.md       # the know‑how (optional)
└── README.md
```

Secrets are bare `${VAR}` placeholders in `.mcp.json` — the app detects them, asks once, and stores them in the OS keychain (never in plaintext). Reserved `${ARTYX_ELECTRON}` / `${ARTYX_BUNDLED}` app‑vars are resolved by Artyx.

## Contribute

Adding a plugin is a folder and a pull request. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the schema and the security checklist. Only the Artyx team merges — every server is reviewed before it ships.

```bash
npm install && npm run validate   # validate your plugin locally
```

---

<div align="center">
<sub>Built for <a href="https://artyx.ai">Artyx</a> — the agentic studio for AI design · MIT licensed</sub>
</div>
