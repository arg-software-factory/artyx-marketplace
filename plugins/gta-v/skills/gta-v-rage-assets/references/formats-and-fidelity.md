# RAGE formats and fidelity

## Core formats

| Extension | Meaning | Typical Artyx projection |
| --- | --- | --- |
| YTD | Texture dictionary | Texture collection and image previews |
| YDR | Drawable | GLB preview plus texture slots |
| YDD | Drawable dictionary | Selectable compound object preview |
| YFT | Fragment | Compound preview with preserved native envelope |

The adapter can discover companion dictionaries, high-resolution variants,
skeletons, and archive context that are not visible from a loose filename.
Always use its dependency graph instead of guessing adjacent files.

## Fidelity levels

- `exact-passthrough`: unchanged native bytes can be emitted as-is.
- `targeted-patch`: the source envelope is retained and narrowly identified
  fields, such as texture payloads, are replaced.
- `semantic-rebuild`: the adapter can author a new native representation from
  common asset semantics; byte identity is not expected.
- `preview-only`: Artyx can inspect or render the asset but cannot safely write
  the requested native result.

A single adapter can advertise several levels because support can differ by
format and operation. The per-asset probe/handshake result is authoritative.

## Why GLB is not the native source of truth

A GLB projection can carry geometry, normals, UVs, materials, images, skins,
and animations, but it does not automatically retain RAGE shader parameters,
render buckets, dictionary ownership, hashes, LOD thresholds, fragment
physics, collisions, damage state, or unknown native fields. Keep the source
envelope and express modifications as semantic patches.
