# 3D scene, camera, and lighting

Godot uses a right-handed 3D space; standardize scale, parent transforms, and coordinate conversion
at import boundaries. A WorldEnvironment defines the scene environment; judge camera exposure and
light settings together. Use DirectionalLight3D for sun/moon, Omni or Spot lights for local intent,
and limit shadow-casting lights by the target budget.

Avoid scaling a physics body or imported rig arbitrarily at runtime. Fix asset units or use a stable
wrapper node, then use the same convention for collision, navigation, and animation.

## Official sources

- Introduction to 3D: https://docs.godotengine.org/en/4.6/tutorials/3d/introduction_to_3d.html
- Environment and post-processing: https://docs.godotengine.org/en/4.6/tutorials/3d/environment_and_post_processing.html
