---
name: blender-pipeline-automation
description: Prepare robust Blender 4.5 production assets and automate repeatable work. Use for collections and assets, linking/appending, import/export, glTF/FBX/USD handoff, bpy batch automation, dependency hygiene, scene budgets, and final delivery validation.
---

# Pipeline, interchange, and automation

Define the target consumer before changing the asset. Interchange is a contract: units, axes, topology, UVs, materials, animation sampling, textures, names, and dependencies must be verified in the receiving application.

1. Organize collections and names by asset role; keep generated/temporary content isolated.
2. Decide whether to append, link, or use an Asset Library based on ownership and update behavior.
3. Validate transforms, applied scale policy, UVs, normals, material slots, action range, and external paths.
4. Export a small representative asset first, reopen it in the consumer, then automate/batch only after acceptance.
5. Measure evaluated geometry, texture memory, draw/instance count, and render time against the delivery budget.

Load [assets-interchange.md](references/assets-interchange.md) for libraries and export contracts. Load [performance-automation.md](references/performance-automation.md) for `bpy` patterns, profiling, data reuse, and delivery audits.
