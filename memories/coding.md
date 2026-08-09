# Coding Guidelines

> How we write code here. Short, specific, enforceable.

## Principles
- (add core principles: performant, simple, elegant, ...)

## Conventions
- Language(s):
- Formatting / linting:
- Naming:
- Imports / module layout:

## Do / Don't
- DO:
- DON'T:

## Testing
- How to run tests:
- Expectations before commit:
- Plugin .mcp.json host/port/url/command/args/env must use ${VAR} placeholders, never literals; triggers install-time config dialog
- Asset adapter transport placeholders must be declared in `userVars` unless they are host-provided `PLUGIN_ROOT`/`PLUGIN_DATA`; adapter IDs are unique per plugin and extension hints are lowercase without a dot
