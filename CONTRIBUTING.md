# Contributing a plugin

This guide explains how to add or change a plugin in this marketplace. Read
[README.md](README.md) first for the short version of what this repository
is.

## The rule that surprises people

`mcp.json` is the **only** MCP configuration a plugin has, and it is
portable: any Agent Plugins 1.0.0 client reads it and runs it as written. A
client expands no `${VAR}` in `url`, `command`, or a header value (only
`${PLUGIN_ROOT}` and `${PLUGIN_DATA}`, and only in `args`, `env` values, and
`cwd`), and it never accepts a secret in `headers` or `env`.

So `mcp.json` always holds a **working default**: a pinned server version, a
real loopback URL with a real port, a literal env value. There is no second
copy of the configuration anywhere, and no patch over it.

What the user may change is declared in the Artyx-only extension,
`extensions["ai.artyx.desktop"].userVars`, and Artyx applies each saved value
by exactly one rule:

- **stdio server:** the value becomes the environment variable of the same
  name, replacing the literal default `mcp.json` declares for it. The var's
  `default` must equal that literal.
- **streamable-http server:** a var of `type: "port"` replaces the port of the
  server's `url`. The var's `default` must equal the port written in the url.

Nothing else is substituted. The validator rejects a var that matches neither
rule (`artyx.uservar.orphan`) and a default that disagrees with `mcp.json`
(`artyx.uservar.default-drift`), because then a client that never reads our
namespace would run something different from what Artyx calls "default".
`tooling/scripts/new-plugin.mjs` generates both shapes correctly — see "Worked
examples" below.

## Layout

```
plugins/<name>/
  plugin.json          required  — the manifest
  mcp.json             optional  — present only if the plugin connects to MCP
  skills/              optional
    <slug>/
      SKILL.md
      references/      optional, loaded only when a skill points at it
  ai.artyx.desktop/    Artyx client files (Agent Plugins 8.2)
    logo.png           required  — Artyx convention, not a spec field
  README.md            recommended — notes for reviewers
```

A plugin can be skills and MCP (`blender`), skills only
(`game-ready-assets`), or MCP only (`memory`).

`<name>` is the plugin's identifier. It must equal the directory name, the
`name` field inside `plugin.json`, and the `name` this plugin uses in
`.agents/plugins/marketplace.json`. All three are checked and must agree.

## `plugin.json` fields

The schema is closed — `additionalProperties: false` — so a field not in this
table has no meaning. A conformant client reports it and ignores **that
field**, then keeps loading the plugin; the data is simply invisible, which is
worse than an error because nothing tells the user. Artyx's publishing policy
is stricter and fails the build, so this repository never ships a package with
one. `$schema` and `name` are the only fields the specification itself
requires.

Two other rules are worth knowing here, because they are easy to get
backwards. An unknown key **inside `author`** is fatal, unlike an unknown key
at the top level. And a non-object `extensions` is ignored, but a non-object
*value inside* `extensions` is fatal — only the outer field is forgiven.

| Field | Required | Notes |
| --- | --- | --- |
| `$schema` | yes | Must be exactly `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`. Selects which rules apply. Never fetched — a client, and this repository's validator, always reads a local copy. |
| `name` | yes | 1-64 characters: lowercase letters, digits, `.`, `-`. No leading, trailing, or doubled `-`, and no `..`. Must equal the `plugins/<name>` directory and the catalog entry. |
| `version` | policy | The specification accepts any string, or none. Artyx's publishing policy requires semver (`X.Y.Z`) — see [tooling/docs/spec-conformance.md](tooling/docs/spec-conformance.md) for why. |
| `description` | policy | Long-form prose for the storefront detail view. Optional in the specification; Artyx warns when it is missing. |
| `author` | no | `{ name, email, url }`, all optional strings. |
| `homepage` | no | The underlying tool's own site — not this repository. |
| `repository` | no | Where this plugin's source lives. Every plugin here uses this repository's own URL, because the plugin itself is authored here. |
| `license` | no | An SPDX-style string, e.g. `"MIT"`. |
| `keywords` | no | Array of strings. |
| `extensions` | Artyx requires `ai.artyx.desktop` | Reverse-domain-namespaced client data. The specification assigns it no meaning. Artyx's own data lives at `extensions["ai.artyx.desktop"]`; see below. |

## `mcp.json` fields

Top level: `$schema` (required, must be exactly
`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`, and must name the
same specification version as `plugin.json`'s own `$schema`) and
`mcpServers` (required, an object mapping a server name to exactly one of
the three shapes below).

**stdio** — Artyx spawns a local process and talks over its stdin/stdout.

| Field | Required | Notes |
| --- | --- | --- |
| `type` | yes | `"stdio"`. |
| `command` | yes | One executable token. A bare name resolved on `PATH` (`npx`), or a `./`-relative path that stays inside the plugin root. Never an absolute path — that is not portable across machines. Never a string containing a space; put the rest in `args`. |
| `args` | no | Array of strings. `${PLUGIN_ROOT}` and `${PLUGIN_DATA}` expand here — no other placeholder does. |
| `env` | no | Object of string to string. Same two placeholders expand. A name must not be `PLUGIN_ROOT` or `PLUGIN_DATA`, case-insensitively — Windows environment names ignore case. |
| `cwd` | no | Must start with `./`, `${PLUGIN_ROOT}`, or `${PLUGIN_DATA}`, and must not contain `..`. |

**streamable-http** — Artyx reaches an already-running server over HTTP.

| Field | Required | Notes |
| --- | --- | --- |
| `type` | yes | `"streamable-http"`. |
| `url` | yes | An absolute URL. HTTPS everywhere, or plain HTTP only on `localhost` or a loopback IP literal. No user info, no fragment, and no `${...}` placeholder — a client expands nothing here. |
| `headers` | no | Object of string to string. No placeholder. A name that looks like a credential (matching `Authorization`, or containing `Token`, `Key`, `Secret`, `Password`, `Bearer`, or `Credential`, case-insensitive) is rejected outright — see "Hard rules." |

**sse** — the same two fields as `streamable-http`, with `type: "sse"`. This
is the deprecated HTTP+SSE transport from an earlier MCP revision. A
conformant client is allowed to skip it; the validator only warns, it does
not fail the build. Use `streamable-http` for anything new.

## The `ai.artyx.desktop` extension

Nothing in this section is an Agent Plugins rule. It is Artyx's own contract,
defined in `tooling/schemas/artyx/extension.schema.json`, and every other client
ignores it.

| Field | Required | Notes |
| --- | --- | --- |
| `schemaVersion` | yes | `3`. Versions this object only, independent of plugin semver, Agent Plugins, and the adapter protocol. |
| `pluginClass` | yes | `"conversational"` (skills and MCP) or `"native-asset"` (asset adapters; see [tooling/docs/asset-adapters.md](tooling/docs/asset-adapters.md)). |
| `interface` | yes | Storefront presentation. See below. |
| `compatibility` | no | `{ artyx, platforms }`. `artyx` is a `">=X.Y.Z"` floor — the desktop compares one floor and nothing else, so only that form is accepted. `platforms` is a subset of `["darwin", "win32", "linux"]`; absent means all three. |
| `requires` | no | Runtime executables, e.g. `["npx"]` or `["uvx"]`. The desktop checks these before it spawns a stdio server, so a missing runtime fails with a clear message instead of `ENOENT`. |
| `userVars` | no | The settings a user may change. Each binds to `mcp.json` by one of the two rules above (or, for native-asset plugins, to a `${VAR}` in an adapter transport). See below. |
| `check` | no | `{ "tool": "<name>" }`: a read-only tool, taking no arguments, that "Test connection" calls after `tools/list`. Use it when a server connects to its application lazily (Blender's does). |
| `nativeRuntimes`, `assetAdapters` | native-asset requires both | Code-free declarations of Protocol v2 loaders/exporters invoked directly by Desktop. See [tooling/docs/asset-adapters.md](tooling/docs/asset-adapters.md). |

`interface`:

| Field | Required | Notes |
| --- | --- | --- |
| `displayName` | yes | 1-40 characters. The vendor's own product name, written the way the vendor writes it — not a mechanical prettifying of `name`. `"unreal-engine"` becomes `"Unreal Engine"` because that is genuinely how Epic writes it. |
| `tagline` | yes | 1-100 characters. One line for the storefront card. The long prose is the portable `description`; do not repeat it here. |
| `category` | yes | `"Creativity"` or `"Developer Tools"`, nothing else. Closed on purpose — a free-form string is how the catalog and the manifest drifted apart before. |
| `docsUrl` | yes | `https://` link to the **upstream** install instructions. See "Install instructions live upstream" below. |
| `capabilities` | no | Subset of `["Interactive", "Read", "Write"]`, shown as badges. |
| `brandColor` | no | `#rrggbb`, the vendor's own brand hex, shown behind the logo — the one place the Artyx palette does not apply. |
| `prompts` | no | Array of suggested opening messages, offered right after install. |
| `experimental` | no | Marks the integration unproven. Absent means false. |

`userVars.<NAME>` — `NAME` must match `^[A-Z][A-Z0-9_]*$` and must not be
`PLUGIN_ROOT` or `PLUGIN_DATA`.

| Field | Required | Notes |
| --- | --- | --- |
| `type` | yes | `directory`, `file`, `string`, `secret`, `boolean`, or `port`. A `port` is an integer 1-65535 kept as a string; a var named `*_PORT` must use it. `secret` renders a password input and keeps the value out of logs. |
| `label` | yes | Field label, 60 characters at most. |
| `description` | yes | Helper text under the field. Say where the value comes from, not what the field is called. |
| `required` | yes | Whether install needs a value. With a `default`, install is still one click. |
| `default` | policy | Required for every var bound to `mcp.json`, and equal to the literal there. |
| `detect` | no | `port` only: up to 8 candidate ports (1-65535). The desktop tries the saved value, then the default, then these, by TCP connect on `127.0.0.1`, and pre-fills the first one that answers. |
| `mustExist`, `extensions`, `contains` | no | Checks on `file` and `directory` values. |
| `pattern` | no | A regular expression a `string` value must match. |

## Install instructions live upstream

`interface.docsUrl` is required, and it is the **only** place a user is sent
to learn how to install and run whatever the plugin connects to. The desktop
renders it as one "How to install" button and opens it in the system
browser. It ships no steps, no prerequisites list, and no summary of its
own — for any plugin, including the ones authored here.

This replaced a `companion` block that carried a title, a summary, an
ordered list of steps and a prerequisites array in the manifest. Two things
were wrong with it. It coupled Artyx to a third party's install procedure:
Blender changes a pip command, and the fix is a manifest edit, a marketplace
merge, and a wait for every desktop to re-poll — meanwhile the app is
confidently printing wrong instructions in its own voice. And it does not
scale to a community catalog, where nobody here can keep N vendors' steps
accurate. A URL has neither problem: the party that owns the software owns
the page, and the next poll picks up whatever they changed.

So:

- Point `docsUrl` at the **vendor's or server author's** page, not at
  anything in this repository and not at an Artyx page. The one exception is
  a skills-only plugin with nothing to install, which points at this
  repository's README.
- Pick the page a user landing cold can actually follow — a README anchor
  (`#readme`, `#installation`) beats a repository root.
- Do not restate the steps in `description`, in `tagline`, or in a
  `userVars` description. A `userVars` description says where a value comes
  from ("the port of the MCP add-on inside Blender"), never what to type to
  get there.
- `plugins/<name>/README.md` is for reviewers and contributors of *this*
  package. It is not shipped to users, so it is not a place to smuggle setup
  prose back in.
- `node tooling/scripts/check-doc-links.mjs` fetches every `docsUrl` along with the
  markdown links, so a page that rots or silently relocates is reported.

## Authoring a skill

A skill lives at `skills/<slug>/SKILL.md`. Discovery is exactly one level
deep — a `SKILL.md` nested any further is simply not found.

Frontmatter:

- `name` — **must equal `<slug>`, the directory name.** A skill name is an
  identifier, not a title. This is the mistake this repository's own plugins
  used to make.
- `description` — required, up to 1024 characters. Say what the skill does
  and exactly when to reach for it — this is what routes an agent to the
  right skill among several.
- `license`, `compatibility` (up to 500 characters), `metadata` (a string-to-string
  map), `allowed-tools` — all optional. A client ignores any other
  frontmatter key; put arbitrary data under `metadata` instead of inventing a
  new top-level key.

Body: non-empty markdown after the closing `---` fence. Keep it under 500
lines; past that the validator warns. Push depth into
`skills/<slug>/references/` — a file there loads only when the skill's own
text points an agent at it. Every plugin in this repository follows the same
pattern: one short overview skill that routes to focused topic skills, each
topic skill under a couple hundred lines with two or three `references/`
files behind it. Read `plugins/blender/skills/blender-overview/SKILL.md` for
the shape.

## Hard rules

1. **No server code.** No `server/` directory anywhere in the plugin, and no
   file with a code extension (`.js`, `.cjs`, `.mjs`, `.ts`, `.mts`, `.cts`,
   `.py`, `.rb`, `.sh`, `.bash`, `.zsh`, `.ps1`, `.bat`, `.cmd`, `.exe`,
   `.dll`, `.dylib`, `.so`). A plugin points at an official or third-party MCP
   server or asset adapter; it never ships either executable. Bundled code would mean this repository
   hands an executable to a user's machine through a git checkout, with no
   review surface beyond a diff.
2. **No secret in the portable file.** `mcp.json` is committed, plain text,
   and world-readable. A name that looks like a credential is rejected in
   `headers` or `env`, whether or not it actually holds one — the check is on
   the name because that is all a reviewer or a script can see. Agent Plugins
   has no portable credential field; a server that needs an account token
   cannot ship here until it can take the token through its own sign-in.
3. **The logo lives at `ai.artyx.desktop/logo.png`**: a real PNG (checked by
   magic bytes), a regular file, 256KB or smaller (keep new ones to a few KB) —
   the desktop inlines it as a data URI. It is a client file, so it goes in the
   namespace directory; a `logo.png` at the package root is rejected.
4. **No symlink**, and no `.mcp.json` (dot-prefixed) or `.artyx-plugin/`.
   Both are the pre-1.0.0 layout; a 1.0.0 client never looks for them.

## Worked examples

Four plugins in this repository cover the shapes you will need. Read the
plugin, not just the excerpt below.

**`plugins/blender`** — stdio with one port setting. The server is pinned,
the add-on port is a literal env value, and the setting overrides it:

```jsonc
// mcp.json — literal, working in any client
"blender": {
  "type": "stdio", "command": "uvx",
  "args": ["--from", "git+https://projects.blender.org/lab/blender_mcp.git@v1.0.3#subdirectory=mcp", "blender-mcp"],
  "env": { "BLENDER_MCP_PORT": "9876" }
}

// plugin.json extension — the setting, bound by name to that env key
"userVars": { "BLENDER_MCP_PORT": { "type": "port", "default": "9876", "detect": [9876, 9877, 9878, 9879], … } },
"check": { "tool": "get_blendfile_summary_path_info" }
```

**`plugins/unreal-engine`** — streamable-http with a port setting. `mcp.json`
says `"url": "http://127.0.0.1:8000/mcp"`; `UNREAL_MCP_PORT` is a `port` var
with `default: "8000"`, and Artyx swaps a saved value into the url's port.

**`plugins/unity`** — the zero-config case. `mcp.json` needs no user input
(`uvx` with a pinned package), so the extension declares no `userVars`.

**`plugins/memory`** — `${PLUGIN_DATA}` in `env`: the server stores its file in
the client-managed data folder, which survives updates.

```jsonc
"env": { "MEMORY_FILE_PATH": "${PLUGIN_DATA}/memory.jsonl" }
```

`tooling/scripts/new-plugin.mjs` generates the two setting shapes — a `_PORT`
var over a `streamable-http` url, or `NAME=default` vars on a `stdio` server
(written into `mcp.json` `env`). Anything else it refuses to guess at and
tells you why.

## From clone to PR

```bash
git clone git@github.com:arg-software-factory/artyx-marketplace.git
cd artyx-marketplace
npm ci

# Scaffold. This example is the stdio-plus-env shape (see "Worked examples").
node tooling/scripts/new-plugin.mjs \
  --name my-tool --display "My Tool" \
  --tagline "One line for the storefront card." \
  --category "Developer Tools" \
  --docs "https://my-tool.example.com/docs/mcp#installation" \
  --transport stdio --command npx --arg -y --arg my-tool-mcp@1.2.3 \
  --user-var MY_TOOL_PATH=my-tool \
  --skill my-tool-mcp

# The scaffolder prints a checklist, then runs the validator for you. Work
# through what it cannot generate: plugins/my-tool/ai.artyx.desktop/logo.png, the skill body
# in skills/my-tool-mcp/SKILL.md, plugin.json's top-level "description",
# and README.md.

npm run validate                    # Agent Plugins 1.0.0 + Artyx policy
npm test                            # the validator's own test suite
node tooling/scripts/check-doc-links.mjs    # every URL you wrote must resolve

git checkout -b feature/my-tool-plugin
git add plugins/my-tool .agents/plugins/marketplace.json
git commit -m "[FEAT] add my-tool plugin"
git push -u origin feature/my-tool-plugin
gh pr create --title "[FEAT] add my-tool plugin" --body "$(cat <<'EOF'
## What changed
## Why
## Impact
EOF
)"
```

CI runs `npm run validate` and `npm test` on every pull request
(`.github/workflows/validate.yml`). A weekly job separately checks the
vendored schemas for drift and opens an issue if they move — it never blocks
a PR, because an upstream edit has nothing to do with the change you are
proposing. See [tooling/docs/spec-conformance.md](tooling/docs/spec-conformance.md) for the
handful of places this repository is stricter than the specification, and
why.
