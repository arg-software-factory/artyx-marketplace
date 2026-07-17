---
name: blender-rendering-lighting
description: Produce and optimize Blender 4.5 look development and final renders. Use for camera setup, lighting, color management, Cycles or Eevee selection, render sampling, denoising, compositing, output settings, and render-performance diagnosis.
---

# Lighting and rendering

Choose the renderer and delivery constraints first. Establish scale, camera, neutral reference lighting, and AgX display transform before material or light micro-tuning.

1. Lock camera composition, focal length, aspect ratio, resolution, and frame range.
2. Establish key/fill/rim or motivated environmental lighting; control contrast with placement, size, and distance before grading.
3. Tune materials under representative lighting and test the delivery engine.
4. Use preview settings for iteration; raise samples/adaptive thresholds only after noise sources are understood.
5. Validate output colors, alpha, motion blur, image sequence path, and one full-quality representative frame.

Load [lighting-camera.md](references/lighting-camera.md) for photographic and color-management decisions. Load [cycles-eevee-output.md](references/cycles-eevee-output.md) for engine choice, sampling, passes, compositing, and render budgets.

## MCP verification

Set render settings through `execute_blender_code`, then prove output with
`render_viewport_to_path` or `render_thumbnail_to_path`. Use
`get_screenshot_of_area_as_image` for fast lighting iteration before full renders.
