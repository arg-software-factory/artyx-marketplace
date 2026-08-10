# Native asset plugins

Artyx extension schema v3 distinguishes two plugin classes:

- `conversational`: MCP servers and skills only;
- `native-asset`: conversational capabilities plus deterministic native asset
  runtimes and adapters.

Adapters speak `artyx.asset-adapter/2` directly to Desktop. They are not MCP
tools and their binary parsing, compilation, validation and commit behavior is
never delegated to a model.

## Runtime and adapter declarations

Native runtimes are declared separately from adapters. An external runtime has
a stdio transport; an official bundled runtime has platform artifacts with a
SHA-256, Ed25519 signature and key id. Community packages may declare external
runtimes only.

Each adapter references one runtime and advertises static discovery hints,
source kinds, protocol methods, fidelity levels and semantic authoring profiles.
The runtime handshake and per-source `probe` remain authoritative.

```json
{
  "schemaVersion": 3,
  "pluginClass": "native-asset",
  "nativeRuntimes": [
    {
      "id": "rage-dotnet",
      "delivery": "external",
      "transport": {
        "type": "stdio",
        "command": "dotnet",
        "args": ["${RAGE_ADAPTER_ASSEMBLY}", "--asset-adapter-stdio"]
      }
    }
  ],
  "assetAdapters": [
    {
      "id": "rage",
      "protocol": "artyx.asset-adapter/2",
      "runtime": "rage-dotnet",
      "accepts": [{ "extensions": ["yft"], "kinds": ["compound"] }],
      "sourceKinds": ["local-file", "engine-package-entry"],
      "methods": ["handshake", "probe", "import", "resolve"],
      "fidelity": ["semantic-rebuild", "preview-only"],
      "profiles": [
        {
          "id": "gta5/vehicle-paint3-top-v1",
          "semantic": "vehicle-livery",
          "fidelity": "semantic-rebuild",
          "supportsCreate": false,
          "supportsModify": true
        }
      ]
    }
  ]
}
```

## Round-trip rule

GLB, OBJ and PNG are editable projections. Native authority is the immutable,
content-addressed source envelope plus a semantic profile and committed pointer.
There is no universal `GLB -> native` inverse.

Mutation uses `prepareMutation -> compileNative -> export -> validate -> commit`.
Candidates remain invisible to restart/resolve until commit succeeds. Export is
always staged outside the game or source project.

## Configuration

`userVars` are typed as `directory`, `file`, `string`, `secret` or `boolean`.
`mustExist`, extension filters and patterns let Desktop validate setup before a
runtime is spawned. `${PLUGIN_ROOT}` and `${PLUGIN_DATA}` are host variables and
cannot be used as the executable command.

## Scaffolding

`--asset-adapter` accepts a JSON object containing `{ "runtime": {...},
"adapter": {...} }`. The scaffolder embeds both v3 declarations. Plugin
packages still contain configuration, documentation and skills by default;
only signed official runtimes may contain declared executable artifacts.
