# System Design Guidelines

> Architecture and the rules that keep it coherent.

## Architecture
- (high-level shape, main modules, boundaries)

## Data flow
- (how data moves; sources of truth)

## Rules / invariants
- (what must always hold; what not to break)
- Marketplace plugins are pure-client: connect to external MCP servers only; never ship bundled server code
