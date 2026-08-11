# Vendored Agent Plugins 1.0.0 schemas

These two files are copied byte-for-byte from the canonical Agent Plugins
schema host. Do not edit them. They are the normative artifact this repository
validates against.

| File | Source URL | SHA-256 | Bytes |
|---|---|---|---|
| `plugin.schema.json` | `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` | `0a4aad95ce337878ad38802ebf0daa3fde76abe3f65400c86bcbb1ec0b3ab883` | 1805 |
| `mcp.schema.json` | `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json` | `6539175bfcdf43085855183e86da40ea94b166547a72b47ae9a0a390516d3acb` | 3408 |

Fetched and verified identical: 2026-08-08.

## Why they are vendored

The specification says a client must not retrieve a schema while it loads a
plugin. Validation must run from a local copy. The same rule applies to CI: a
network failure must not change what this repository accepts.

## Why the schema alone is not enough

Run the schema first, then apply the rules it cannot express.

**The schema is stricter than the specification in exactly two places.** Both
files set `additionalProperties: false`, so a validator reports an unknown
top-level field in `plugin.json` as an error. The specification says to report
that field and ignore it, then keep loading. The same applies to a non-object
`extensions` value. `tooling/scripts/lib/spec-plugin.mjs` re-classifies those two error
shapes and treats every other error as fatal.

**The schema is looser than the specification everywhere else.** It cannot
express: that a `command` is one executable token; that a `url` is absolute,
carries no user information and no fragment, and uses HTTPS off loopback; that
two header names must not collide when compared case-insensitively; that
`mcp.json` must target the same specification version as `plugin.json`; or that
`${PLUGIN_ROOT}` and `${PLUGIN_DATA}` are the only placeholders. Those rules
live in `tooling/scripts/lib/spec-mcp.mjs`.

## Checking for drift

```bash
npm run schemas:verify
```

It re-fetches both files, compares them to these copies, and fails on any
difference. `.github/workflows/schema-drift.yml` runs it weekly and opens an
issue. It never blocks a pull request, because an upstream edit must not fail
work that has nothing to do with it.

## Upgrading to a later specification version

A published canonical schema identifier is never reassigned to different
contents, so a new version always arrives as a new directory.

1. Add `tooling/schemas/<version>/` with both files and a new `UPSTREAM.md`.
2. Teach `tooling/scripts/lib/spec-plugin.mjs` and `spec-mcp.mjs` the new identifier.
3. Migrate each plugin's `$schema` pair. Both files in one plugin must always
   name the same version.

Keep the old directory until no plugin targets it.
