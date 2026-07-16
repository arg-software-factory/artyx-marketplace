# Shader language

Choose `spatial`, `canvas_item`, `particles`, `sky`, or `fog` by render stage. Expose artist-facing
controls as typed uniforms with useful ranges. Keep coordinate-space changes explicit and avoid
texture reads or branches whose cost grows with every visible pixel.

Use `render_mode` only when its lighting and blending consequences are understood. Validate on the
selected renderer and target GPU; editor preview is not portability proof.

## Official sources

- Introduction to shaders: https://docs.godotengine.org/en/4.6/tutorials/shaders/introduction_to_shaders.html
- Shading language: https://docs.godotengine.org/en/4.6/tutorials/shaders/shader_reference/shading_language.html
