# Headless QA

Run the smallest scene that exercises the behavior, capture stderr/stdout, and use deterministic
sentinel output for success. Treat parser errors, missing resources, and script errors as release
blockers. Headless runs validate startup and logic; they do not prove GPU visual quality, so pair
them with target-device rendering checks.

When using this plugin's `@coding-solo/godot-mcp` bridge, run, read `get_debug_output`, and stop the process before a second
test. Preserve the command, scene, and output with the result.

## Official sources

- Command line: https://docs.godotengine.org/en/4.6/tutorials/editor/command_line_tutorial.html
