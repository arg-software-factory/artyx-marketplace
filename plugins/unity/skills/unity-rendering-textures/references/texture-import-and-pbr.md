# Texture import and physically based materials

## Semantic import contract

Classify every map before import. Base color/emission/UI color are color data and normally use sRGB.
Normal, mask, metallic, roughness/smoothness, ambient occlusion, height, lookup data and packed maps
are linear data and must not use sRGB. Set normal maps to the Normal Map texture type so Unity applies
the correct sampling and platform encoding. Use alpha only when the shader needs it; an unused alpha
raises memory and bandwidth costs.

Keep an explicit source-to-runtime budget. Prefer platform overrides over a universal maximum size:
mobile often benefits from ASTC, desktop from BC formats, and an uncompressed format is an exception
for data requiring exact values. Validate the decoded size, not only the source PNG/TGA size. Avoid
Read/Write Enabled unless CPU pixel access is indispensable; it duplicates texture memory.

## PBR map rules

- **Base Map:** albedo without baked directional lighting; preserve plausible value ranges.
- **Normal:** tangent-space detail; orient according to the importer and validate under moving light.
- **Metallic:** binary-ish material classification, not a generic contrast layer.
- **Smoothness:** Unity commonly stores it in a channel selected by the shader; inspect that shader
  before packing. Roughness is the inverse of smoothness.
- **Occlusion:** subtle contact attenuation, never a replacement for lighting or an all-black multiply.
- **Height/detail:** only use when the material and target budget support its extra samples.

Use texture arrays/atlases only when meshes share compatible layout and sampler settings. Atlas padding
must cover mip bleed. For sprites, use Sprite Atlas and validate packing/tag variants per platform.

## Verification

View the material with neutral light, grazing highlights, and normal-map intensity 0/1 comparison.
Check alpha fringes at mip levels, distant LODs, memory in the Profiler, and the Frame Debugger's
actual texture/shader bindings. A material that looks right only under one post-process stack is not
yet validated.

## Official sources

- Unity Manual: [Texture importer](https://docs.unity3d.com/6000.0/Documentation/Manual/class-TextureImporter.html)
- Unity Manual: [Texture compression formats](https://docs.unity3d.com/6000.0/Documentation/Manual/texture-compression-formats.html)
- Unity Manual: [Materials introduction](https://docs.unity3d.com/6000.0/Documentation/Manual/materials-introduction.html)
- Unity Manual: [Sprite Atlas](https://docs.unity3d.com/6000.0/Documentation/Manual/class-SpriteAtlas.html)
