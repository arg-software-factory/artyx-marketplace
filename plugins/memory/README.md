# Memory

Gives the agent a long-term memory for your project: characters, style
decisions, palettes, naming rules, asset lists, and how they relate. It uses the
official Model Context Protocol **memory server**
(`@modelcontextprotocol/server-memory`, pinned in `mcp.json`), started locally
with `npx`. No account and no cloud.

**Server docs: [modelcontextprotocol/servers: memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)**

## Where the memory lives

`mcp.json` sets `MEMORY_FILE_PATH` to `${PLUGIN_DATA}/memory.jsonl`. The client
replaces `${PLUGIN_DATA}` with the plugin's own data folder, which Agent Plugins
clients keep across plugin updates. Removing the plugin may delete it.

The file is a knowledge graph in JSON Lines: entities (a character, a style
guide), relations between them, and observations (facts) on each. The agent
reads it with `read_graph`, `search_nodes`, and `open_nodes`, and writes it with
`create_entities`, `create_relations`, `add_observations`, and the matching
`delete_*` tools. The connection test calls `read_graph`.

## Troubleshooting

- **"Needs Node"**: `npx` comes with Node.js, from https://nodejs.org/.
- **Memory looks empty after a reinstall**: a removed plugin's data folder may
  have been deleted with it.
