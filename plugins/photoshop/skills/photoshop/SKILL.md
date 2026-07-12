---
name: Photoshop MCP
description: Use Photoshop MCP tools to inspect documents, layers, selections, adjustments, and exports with careful verify-after-write discipline.
---

# Driving Photoshop through MCP

You are operating a live Photoshop document through a community MCP bridge. Tool
names and capabilities vary by UXP plugin, so trust the available tool schemas.

## Workflow

1. Inspect the open document, canvas size, color mode, active layer, selected
   area, and layer stack before mutating anything.
2. Make one logical edit at a time: select, create or modify a layer, apply an
   adjustment, then verify the layer stack or document state.
3. Use deterministic layer names so later edits can target the correct object.
4. Keep destructive operations explicit. Prefer duplicated layers or reversible
   adjustments when the tool surface supports them.
5. For exports, confirm format, size, destination path, and color/profile
   expectations before writing files.

Summarize the visible document state after edits, including changed layers and
export paths.
