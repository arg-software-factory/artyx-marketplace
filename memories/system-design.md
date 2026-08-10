# System Design Guidelines

> Architecture and the rules that keep it coherent.

## Architecture
- (high-level shape, main modules, boundaries)

## Data flow
- (how data moves; sources of truth)

## Rules / invariants
- (what must always hold; what not to break)
- Schema v3 distinguishes conversational and native-asset plugins. External runtimes remain code-free; signed bundled runtimes are restricted to official Artyx packages and are verified by Desktop.
- Asset adapters are derived registrations owned by the installed plugin ledger entry; no parallel adapter catalog or independently versioned install record
