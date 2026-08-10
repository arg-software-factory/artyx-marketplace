# External asset adapters

Asset adapters extend Artyx's deterministic file pipeline with game-engine or
tool-specific import, preview, edit, validation, and native export behavior.
They are declared inside `extensions["ai.artyx.desktop"]`; Agent Plugins
clients that do not implement this namespace ignore them and can still install
the portable skills or MCP components in the package.

## Versioning and compatibility

- `schemaVersion: 1` is frozen. It accepts the original storefront, MCP overlay,
  compatibility, requirement, and user-variable fields. Existing packages do
  not need migration.
- `schemaVersion: 2` has the same fields and requires a non-empty
  `assetAdapters` array.
- The adapter protocol is versioned separately. This repository currently
  accepts `artyx.asset-adapter/1`.

Changing the plugin's semver, the Artyx extension schema, and the runtime
protocol are three independent decisions.

## Descriptor

```json
{
  "id": "rage",
  "protocol": "artyx.asset-adapter/1",
  "transport": {
    "type": "stdio",
    "command": "dotnet",
    "args": ["${RAGE_ADAPTER_ASSEMBLY}", "--asset-adapter-stdio"],
    "env": { "GTA_V_PATH": "${GTA_V_PATH}" }
  },
  "accepts": [
    {
      "extensions": ["ydr"],
      "mediaTypes": ["application/x-rockstar-rage-drawable"],
      "kinds": ["object3d"]
    }
  ],
  "operations": [
    "probe",
    "import",
    "preview.3d",
    "texture.read",
    "projection.author"
  ],
  "fidelity": ["targeted-patch", "semantic-rebuild", "preview-only"]
}
```

| Field | Meaning |
| --- | --- |
| `id` | Plugin-local stable identifier. Desktop qualifies it as `<plugin-name>/<id>`. |
| `protocol` | Direct adapter protocol. It is not MCP and is never routed through a model. |
| `transport` | External process launch descriptor. Version 1 supports stdio only. |
| `accepts` | Cheap discovery hints: lowercase extensions without a dot, optional media types, and common asset kinds. |
| `operations` | Static upper bound of features the package expects. `probe` and `import` are mandatory. |
| `fidelity` | Potential preservation modes. The per-asset runtime result can narrow them. |

Accepted kinds are `object3d`, `image`, `texture-collection`, and `compound`.
Accepted operations are `probe`, `import`, `preview.3d`, `preview.image`,
`texture.read`, `texture.patch`, `projection.author`, `export.native`, and
`validate`.

`accepts`, `operations`, and `fidelity` are catalog-time claims. Runtime
handshake and `probe` are authoritative. An extension match must never bypass
content sniffing, dependency checks, or a per-asset fidelity decision.

## Process configuration

`command`, `args`, `env` values, and `cwd` can reference declared `${USER_VAR}`
values. `${PLUGIN_ROOT}` and `${PLUGIN_DATA}` are host-provided in `args`, `env`
values, and `cwd`; they are deliberately rejected in `command`. The validator
rejects undeclared, malformed, or orphaned user variables. `command` is one
executable token because Desktop spawns the process directly and never invokes
a shell; arguments belong in `args`.

The same `userVars` object can feed both an MCP overlay and adapter transports.
Install-time values are still stored and substituted by Desktop, not committed
to this repository.

## Code-free boundary

The marketplace package contains the descriptor and documentation only. It may
not contain an adapter executable, DLL, script, launcher, server directory, or
symlink. `interface.docsUrl` points to upstream runtime documentation, and the
user installs the external adapter independently. Desktop preflights literal
runtime commands listed in `requires` before spawn.

An adapter process is a deterministic host capability, not an agent tool:

- Desktop calls it directly for probe/import/export.
- The agent can use a skill to choose a safe workflow, but model behavior is not
  part of file decoding or encoding.
- A crash or unsupported asset disables that adapter operation without
  replacing built-in OBJ, FBX, GLB, or image handling.

## Catalog and installed-plugin ledger

The plugin remains the only installation unit. A package with several skills,
MCP servers, and asset adapters appears exactly once in
`.agents/plugins/marketplace.json` and exactly once in Desktop's installed
plugin ledger.

On successful install, Desktop derives qualified adapter registrations from the
installed manifest. Updating the plugin replaces those derived registrations;
uninstalling it removes them. The marketplace must not add a parallel adapter
catalog or independent adapter version field, because either could drift from
the plugin/version whose files were actually installed.

`policy.installation: "AVAILABLE"` therefore means the whole package can be
installed, including its declarative adapter registrations.
`policy.authentication: "ON_INSTALL"` means Desktop collects the package's
`userVars` during that transaction; it does not imply that the external adapter
binary is bundled or downloaded.

## Scaffolding

Pass one JSON descriptor object (or an array of descriptors) to the existing
scaffolder:

```bash
node scripts/new-plugin.mjs \
  --name my-game --display "My Game" \
  --tagline "Import and export native game assets." \
  --category Creativity \
  --docs https://upstream.example.com/adapter \
  --transport none \
  --asset-adapter path/to/asset-adapter.json \
  --user-var GAME_ADAPTER_PATH \
  --skill my-game-assets
```

The descriptor is embedded in `plugin.json`; its source JSON is an authoring
input, not another runtime file. The final validator remains authoritative and
checks the complete manifest plus cross-field placeholder rules.
