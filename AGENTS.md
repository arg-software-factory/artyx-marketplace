# Artyx Marketplace

This repository is a curated, code-free catalog. Keep its public structure
small and predictable:

- `.agents/` owns the marketplace index.
- `plugins/` and `agents/` contain installable packages.
- `tooling/` owns schemas, validation, scaffolding, tests, and maintainer docs.
- `.github/` owns automation.

Do not add adapter executables, game data, compiler binaries, build outputs, or
session-specific agent memory. Conversational plugins may ship skills and MCP
configuration. Native-asset plugins may additionally declare isolated external
or signed official runtimes and Protocol v2 adapters, but runtime code remains
in its engine repository.

Run `npm run check` before committing. Also run `npm run schemas:verify` when
changing vendored schema inputs.
