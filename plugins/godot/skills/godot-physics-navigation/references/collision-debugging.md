# Collision debugging

Enable visible collision shapes, inspect the Remote scene tree, and log layer/mask values before
changing geometry. Typical failures are no overlapping masks, a missing or disabled shape, movement
outside the physics tick, a scaled parent, or assuming Area sends collision responses. Reproduce in
a minimal scene before changing global project settings.

## Official sources

- Debugger tools: https://docs.godotengine.org/en/4.6/tutorials/scripting/debug/overview_of_debugging_tools.html
