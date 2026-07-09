---
name: Figma MCP
description: Use Figma MCP tools to inspect files, frames, components, styles, and variables before translating design intent into implementation guidance.
enabled: true
---

# Driving Figma through MCP

Use Figma MCP tools to read the actual design state before making claims about
layout, typography, spacing, colors, or component behavior.

## Workflow

1. Start from the file, frame, node, or selection the user identifies.
2. Read node metadata, hierarchy, dimensions, constraints, fills, text styles,
   components, and variables before summarizing.
3. Preserve design-system names when reporting tokens, component variants, or
   variable references.
4. When converting design to code guidance, call out responsive constraints and
   interaction states that are visible in the file.
5. Do not edit Figma content unless the user explicitly asks for a write action.

Report exact node names and relevant ids when the tool exposes them.
