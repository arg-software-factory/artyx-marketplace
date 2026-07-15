# Textures and materials

Treat albedo/color textures as color data. Treat normal, roughness, metallic, ambient-occlusion,
masks, and height as non-color data. Match normal orientation and channel packing to the source
pipeline. Use StandardMaterial3D for normal PBR work; write a shader only for requirements it cannot
express cleanly.

Avoid cloning a shared material for small runtime changes when per-instance parameters suffice.
Test mip behavior, compression artifacts, alpha mode, and memory at target resolution.

## Official sources

- StandardMaterial3D: https://docs.godotengine.org/en/4.6/classes/class_standardmaterial3d.html
- Importing images: https://docs.godotengine.org/en/4.6/tutorials/assets_pipeline/importing_images.html
