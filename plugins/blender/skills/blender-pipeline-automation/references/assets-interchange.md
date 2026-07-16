# Assets and interchange contracts

## Ownership and dependencies

Append when the destination owns a copy; link when a source asset should update centrally. Use Library Overrides for controlled edits to linked data. Asset Browser catalogs and metadata make reusable assets discoverable, but do not replace naming, versioning, and dependency policy. Pack external data only when the delivery contract calls for a self-contained `.blend`; otherwise use stable relative paths and validate missing-file reports.

## Export checklist

For each format, identify the consumer's coordinate system, unit scale, supported material model, tangent requirement, animation sampling, and texture path rules. Apply or preserve transforms consistently; export only intended collections/objects; remove helper geometry and hidden test cameras. Validate normals, triangulation policy, UV sets, vertex colors, armature rest pose, action clips, and root motion. Reimport/reopen the output in the actual consumer before declaring handoff complete.

glTF is strong for PBR-focused realtime interchange; FBX remains common for DCC/game pipelines with importer-specific conventions; USD is suitable where scene composition and richer production data are supported. Do not promise fidelity beyond the consumer's importer.

## Official sources

- [Asset Browser](https://docs.blender.org/manual/en/4.5/editors/asset_browser.html)
- [Libraries and overrides](https://docs.blender.org/manual/en/4.5/files/linked_libraries/index.html)
- [Import and export](https://docs.blender.org/manual/en/4.5/files/import_export/index.html)
