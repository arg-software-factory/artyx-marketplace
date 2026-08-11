# Fidelity and validation

## Exact restoration

`MDL -> preview GLB + opaque source envelope -> MDL` restores the original
verified bytes. If the envelope or hash is missing, fail closed.

## Semantic compilation

`GLB/MDL -> QC + SMD + indexed BMP -> StudioMDL -> MDL` intentionally produces
different bytes. Validate magic/version/length, bounded tables, bones, hitboxes,
attachments, bodygroups, sequences, texture indices/palettes and triangle
commands after reopening the compiled file.

The first creation profile supports one-bone static props. Player, weapon and
arbitrary animation-retargeting profiles require separate donor contracts and
are not implied by a successful static-prop compile.
