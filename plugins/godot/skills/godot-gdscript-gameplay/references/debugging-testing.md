# Debugging and testing

Make failures local and observable: use `assert()` for programmer invariants, `push_error()` for
recoverable runtime defects, and structured context in log messages. Break at the first failing
frame rather than adding output inside hot loops. The debugger's Errors, stack traces, monitors,
and remote tree answer different questions; inspect the live tree when a node path or lifecycle is
suspect.

Keep pure rules in scripts/resources without scene dependencies so an external unit-test framework
can exercise them. Scene behavior needs an integration smoke test that creates the scene, drives a
named action, and asserts a visible state or sentinel log.

## Official sources

- Debugging tools: https://docs.godotengine.org/en/4.6/tutorials/scripting/debug/overview_of_debugging_tools.html
- GDScript assertions: https://docs.godotengine.org/en/4.6/classes/class_@gdscript.html
