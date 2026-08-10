# GTA V RAGE Assets

Experimental Artyx package for local Grand Theft Auto V asset workflows. It
registers an external RAGE asset adapter and provides agent guidance; it does
not contain an executable, Rockstar game data, or an MCP server.

The adapter's RAGE format layer is based on the independently maintained
[CodeWalker project](https://github.com/dexyfex/CodeWalker/blob/master/README.md).
That public upstream reference is the package's `interface.docsUrl`; it is not
presented as an installer for the experimental Artyx host. The separately built
Artyx runtime is selected through `RAGE_ADAPTER_ASSEMBLY`, and this repository
does not invent or mirror installation procedures that have no public upstream
page yet.

## Declared surface

- `.ytd` is routed as a texture collection, not as a 3D object.
- `.ydr` is routed as an object candidate.
- `.ydd` and `.yft` are routed as compound bundles.
- The external process is started with `dotnet` and the configured
  `RAGE_ADAPTER_ASSEMBLY`.
- Extensions and media types are only discovery hints. The runtime handshake
  and `probe` response decide whether a concrete file is supported.

The plugin advertises targeted texture patching, bounded semantic livery
authoring, and preview-only fallbacks. The first native authoring profile is a
single top-view vehicle livery: the adapter projects onto paintable YFT
surfaces, creates an asset-local DXT5 texture with alpha and mipmaps, and
aspect-fits the projection into a transparent-gutter 2048x2048 native canvas.
It stages the changed base YFT, `_hi.yft`, and YTD together, validates that
bundle without mutating commit state, and explicitly commits only the verified
receipt. Runtime capability negotiation remains authoritative.

This profile does not claim a universal YDR/YDD/YFT-to-GLB-to-native geometry
round trip. Other views, arbitrary shader families, assets without a safe
paint surface, and full seam-aware wraps remain unsupported until the adapter
advertises a matching authoring profile.

The package's MIT license covers only its manifest, logo, and skill content. It
does not relicense CodeWalker, the separately supplied adapter runtime, or game
data; those remain subject to their own terms and distribution review.

## Safety boundary

This integration is for local, user-authorized single-player assets. Source
bundles remain immutable, exports belong in a separate staging directory, and
the adapter must validate an export before the user installs it into any game
or mod directory. The package does not target GTA Online.
