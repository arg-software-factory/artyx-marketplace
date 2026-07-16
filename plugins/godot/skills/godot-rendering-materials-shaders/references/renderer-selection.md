# Renderer selection

Use Forward+ for desktop-class high-end 3D features, Mobile for mobile-friendly forward rendering,
and Compatibility for broad/older hardware and web-oriented constraints. This is a project decision:
shader features, lighting, post-processing, precision, and performance assumptions vary by renderer.
Prototype the visual target on the lowest supported device before choosing feature-heavy effects.

Do not promise renderer parity. Make quality tiers explicit and gate expensive effects by platform
or project setting rather than silently falling back.

## Official sources

- Renderer comparison: https://docs.godotengine.org/en/4.6/tutorials/rendering/renderers.html
