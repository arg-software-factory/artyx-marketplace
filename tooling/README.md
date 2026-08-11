# Marketplace tooling

Everything in this directory supports maintainers and CI; none of it is part
of an installed plugin package.

- `schemas/` contains pinned Agent Plugins schemas and the Artyx extension,
  catalog, and agent schemas.
- `scripts/` validates, scaffolds, and checks packages.
- `docs/` explains conformance and the native asset-adapter extension.

Product payload stays under `plugins/` and `agents/`. Runtime implementations
stay in their engine repositories. This boundary keeps the marketplace a
small, auditable catalog rather than a runtime monorepo.
