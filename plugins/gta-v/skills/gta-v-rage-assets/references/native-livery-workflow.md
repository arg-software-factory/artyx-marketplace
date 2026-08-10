# Safe native vehicle-livery workflow

1. Probe and import the original YFT through the RAGE adapter. Keep the source
   envelope immutable and resolve every native dependency through the adapter.
2. Confirm the runtime advertises projection authoring and a compatible
   vehicle-livery profile for this document. A rendered GLB preview is not
   sufficient.
3. Apply the orthographic design in Artyx and retain its exact view name,
   source image, dimensions, and source-object lineage.
4. Submit all projection inputs together. The first profile accepts exactly
   one `top` projection and targets only paintable vehicle materials.
5. Require the adapter to create an asset-local livery texture. Never overwrite
   a shared dictionary such as `vehshare.ytd` to install an asset-specific
   design.
6. Aspect-fit the projection into the profile's 2048x2048 native canvas with a
   transparent four-pixel gutter. Map TEXCOORD_1 to that active rectangle so a
   portrait source is neither stretched nor repeated. Encode the result as
   DXT5/BC3 with alpha and the native Legacy mip chain down to 4x4. The
   transparent sentinel used by non-paintable faces must remain transparent at
   every mip level.
7. Export every changed native owner as one staged bundle. For the initial YFT
   profile this means the base vehicle YFT, its `_hi.yft` companion, and the
   asset-local YTD. Both fragments must bind the same authored texture hash.
8. Reopen the staged files and verify the authored shader, triangle positions,
   top-facing selection, UV1 projection, texture binding, dimensions, mip
   chain, and source-envelope hashes. Validation is read-only.
9. Commit the validated authoring receipt explicitly. Pending receipts are not
   replay authority and must remain invisible after cancellation or failure.
10. Resolve the committed document after a process restart, render the result,
   and repeat export/validation before reporting restart-safe success.
11. Report the complete file list, hashes, profile, fidelity, and warnings. Do
   not write into GTA V or an RPF archive automatically.

Stop if the adapter cannot identify a supported paint surface, the requested
view is not supported, UV authoring would exceed native layout limits, the
target dictionary is shared, or staged validation fails.
