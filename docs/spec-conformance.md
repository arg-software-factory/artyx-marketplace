# Where this repository differs from Agent Plugins 1.0.0

Every package here is a conformant [Agent Plugins
1.0.0](https://agent-plugins.org/) package. A client that implements only
the specification, and never reads `extensions["ai.artyx.desktop"]`, can
install any plugin in this repository and it will work.

This repository is still stricter than the specification in a few named
places, because it is not just an implementation of the standard — it is a
curated, single-vendor storefront built on top of it. This document lists
every place the two disagree, and why. None of it is a claim that the
specification is wrong; it is Artyx publishing policy layered on top of a
format that intentionally leaves those questions open.

## `version` must be semver

The specification requires `plugin.json` to be a JSON object; beyond that,
`version` is an ordinary optional string, and a client MUST NOT reject a
plugin for using a non-semver value, or none.

This repository's validator requires `X.Y.Z` semantic versioning as
**publishing policy**, not client behavior: `scripts/lib/spec-plugin.mjs`
reports a missing or non-semver `version` as `plugin.version.missing` /
`plugin.version.not-semver`, both warnings under `--spec-report` and both
blocking under the default (`npm run validate`) mode. Artyx uses `version`
as a filesystem path segment when it caches an installed plugin, and to
decide whether an update is available. Neither operation is meaningful
without an ordering, so a plugin without one cannot ship here — but that
requirement is ours, not the specification's, and a plugin without a
`version` at all is still perfectly valid Agent Plugins 1.0.0.

## Two validator modes, one CI gate

```bash
node scripts/validate.mjs                # publishing policy — what CI runs
node scripts/validate.mjs --spec-report  # exactly what a conformant client does
```

The two modes read the same findings and disagree only about which ones fail
the run. `scripts/lib/report.mjs` tags every finding with an axis, `spec` or
`artyx`, and every finding also carries a severity from the specification's
own failure ladder (`fatal`, `component`, `entry`, `ignored`, `warn`).
`--spec-report` fails only on a `spec`-axis `fatal` — the one severity that
means a conformant client refuses to load the plugin at all. The default
mode fails on anything at `fatal`, `component`, `entry`, or `ignored`,
`artyx`-axis findings included.

That gap is deliberate. The specification says a client MAY continue past an
unknown top-level field, a broken `mcp.json` that only disables MCP, or one
skipped skill — the rest of the plugin still loads, so none of those reject
it outright. A curated, first-party marketplace has a higher bar: it should
never ship a package that any conformant client would silently load only
part of. So a finding a conformant client tolerates can still fail CI here,
as publishing policy, and the text output says so explicitly whenever that
happens.

## Two fields the standard has never heard of

`extensions["ai.artyx.desktop"]` and `logo.png` are both required by this
repository's validator (`artyx.extension.missing`, `plugin.logo.missing`,
both `artyx`-axis, both fatal under the default mode) and both entirely
absent from the specification.

- **`extensions["ai.artyx.desktop"]`** carries the storefront name, tagline,
  category, and everything else the Artyx desktop needs to present and
  install a plugin. The specification defines the `extensions` object and
  says every client but the owner of a namespace must ignore it — it assigns
  the namespace's *contents* no meaning at all. A plugin missing this
  namespace is spec-valid and installable by some other conformant client;
  it just cannot appear in *this* storefront, because Artyx would have
  nothing to show the user.
- **`logo.png`** at the package root is a path convention this repository
  invented, not a manifest field of any kind — there is no `icon` or
  `logo` key in `plugin.json` to point at it. Artyx inlines it as a data URI
  for the storefront card.

Neither check runs under `--spec-report`; both are `artyx`-axis.

## Asset adapters live only in Artyx's namespace

`assetAdapters` in extension `schemaVersion: 2` is another Artyx publishing and
runtime contract, not an Agent Plugins component. A portable client ignores it
without validation and can still load the package's skills or MCP servers.
Artyx Desktop additionally registers the declared external process as a direct,
deterministic asset capability. See [asset-adapters.md](asset-adapters.md).

The distinction is intentional: Agent Plugins stays portable and this
marketplace stays code-free, while Artyx can extend native object and image
handling without pretending those operations are MCP tools.

## Plugins dropped in the rebuild

Four plugins existed before this repository's Agent Plugins 1.0.0 rebuild and
did not survive it. Three were dropped for a technical reason and one was not,
and the difference is worth stating plainly.

### Could not be expressed portably

- **`figma`** and **`github`** connected over `streamable-http` with the
  vendor's API token in an `Authorization` header. The specification forbids a
  credential in `headers` outright — headers are visible package data,
  committed in plain text, and a token there would leak to everyone who reads
  the repository. There is no overlay escape hatch. The
  `extensions["ai.artyx.desktop"].mcp` patch holds a user-supplied value behind
  a declared `userVar`, but the specification's text is explicit that a
  credential must never appear in `mcp.json` at all, patched or not.
- **`roblox-studio`** launched its server through an absolute, per-platform
  command: a `.bat` under `%LOCALAPPDATA%` on Windows, a different absolute
  path elsewhere, and no base command at either. The `stdio` variant accepts a
  bare command resolved on `PATH` or a `./`-relative path inside the package —
  never an absolute one, and never one that differs by operating system.
  Nothing in the three closed variants expresses "run this platform-specific
  absolute path", so there is no portable `mcp.json` to write.

### Dropped for scope, not for conformance

- **`photoshop`** was a plain stdio server, `npx -y photoshop-mcp`, with no
  placeholder, no credential, and nothing a conformant `mcp.json` cannot say.
  It would migrate in three lines. It was cut because the catalog was narrowed
  to the 3D and game-engine tools that match what Artyx is for. If that
  judgement changes, it comes back unchanged — no format work is needed.

`git log` for `[FEAT] rebuild the marketplace on Agent Plugins 1.0.0` has the
full migration record.
