# Texture data, baking, and color

## Color interpretation

Use sRGB for authored color/albedo/emission images. Use Non-Color for normal, roughness, metallic, ambient occlusion, masks, height, and packed data maps. A normal map also needs the correct tangent-space orientation and a Normal Map node. Validate alpha mode and premultiplication on the final output path; alpha behavior differs between a material preview, compositor, and exported texture.

Blender 4.5 uses AgX color management by default. Grade in the intended view transform; do not “correct” a texture to compensate for a wrong display transform. Check Base Color under neutral illumination before applying artistic lights.

## Baking

Use an explicit target image node active in each receiving material. Confirm unique, non-overlapping UVs for the baked asset; leave sufficient island margin for the output resolution and mips. For high-to-low normal/AO bakes, match transforms, use a cage or controlled ray distance, and inspect seams. Bake one map at a time, save images intentionally, and record normal convention and resolution.

Common failures: black bake means no active image, wrong engine, missing lights/material setup, or invalid selected-to-active configuration; seams indicate UV/margin/cage issues; gradients often reveal mismatched normals or unapplied transforms. Never overwrite a source texture during a test bake.

## Official sources

- [Image Texture node](https://docs.blender.org/manual/en/4.5/render/shader_nodes/textures/image.html)
- [Render baking](https://docs.blender.org/manual/en/4.5/render/cycles/baking.html)
- [Color management](https://docs.blender.org/manual/en/4.5/render/color_management.html)
