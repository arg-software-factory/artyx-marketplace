---
name: gta-v-rage-assets
description: Safely inspect, preview, retexture, validate, and export local Grand Theft Auto V RAGE assets through the installed Artyx adapter. Use for YTD texture dictionaries, YDR drawables, YDD drawable collections, YFT fragments or vehicles, native dependency resolution, texture-slot edits, and fidelity-aware GTA V exports.
---

# GTA V RAGE asset workflow

Use the installed asset adapter as the authority for availability and concrete
capabilities. Manifest extensions are routing hints, not proof that an
individual asset is writable. The CodeWalker docs linked by the plugin describe
the upstream format toolchain; the Artyx runtime itself comes from the assembly
configured as `RAGE_ADAPTER_ASSEMBLY`.

## Classify before acting

- `.ytd` is a texture dictionary. Open it as a texture collection; it is not a
  mesh and cannot produce orthographic object views by itself.
- `.ydr` is a drawable and can normally provide an object preview.
- `.ydd` is a drawable dictionary and may require selecting one member.
- `.yft` is a fragment, commonly a vehicle, and can include skeleton, damage,
  physics, glass, and other native state that a GLB preview does not preserve.

Load [formats-and-fidelity.md](references/formats-and-fidelity.md) when choosing
an import/export mode or explaining why preview support differs from native
write support.

## Mandatory workflow

1. Confirm the request concerns local, user-authorized single-player content.
   Do not operate on GTA Online or a live game process.
2. Ask the host to probe the selected source. Report the resolved kind,
   dependencies, adapter capabilities, and fidelity before mutation.
3. Import a source bundle into an immutable native envelope. Keep its source
   files, hashes, edition, dependency ownership, and adapter version.
4. Use the generated GLB or images only as Artyx working projections. Never
   describe them as lossless native replacements.
5. Identify textures by the adapter's stable slot/reference, not just a display
   name. Preserve ownership: embedded texture, companion YTD, shared TXD, or
   high-resolution dictionary.
6. Record edits as semantic patches. Preserve compression, mip, alpha, color
   space, and channel-packing requirements unless the adapter explicitly
   changes them.
7. Export to a new staging directory, run adapter validation, and summarize
   every created file and warning. Never overwrite the original RPF or source
   bundle.

For the exact retexture loop and verification gates, load
[safe-retexture-workflow.md](references/safe-retexture-workflow.md).

When the request applies an orthographic design to a GTA V vehicle and asks
for native output, load
[native-livery-workflow.md](references/native-livery-workflow.md). Only use
that path when the runtime advertises projection authoring for the imported
document; a preview overlay alone is not export authority.

## Refuse unsafe shortcuts

- Do not save a native container merely to test whether it can be read again.
  A lossy writer can corrupt data while remaining parseable.
- Do not replace a texture by name when multiple materials can share that name.
- Do not promise native geometry export when the negotiated fidelity is
  `preview-only`.
- Do not route an orthographic vehicle design through a shared texture slot.
  Native livery authoring must produce an asset-local texture and export every
  changed native owner together.
- Do not install output into game archives automatically. Hand the validated
  staging output to the user.
