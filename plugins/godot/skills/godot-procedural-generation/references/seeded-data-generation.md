# Seeded data generation

Use a `RandomNumberGenerator` seeded from a stored integer for every replayable generation pass.
Pass the generator or derived seeds into subsystems instead of calling global random state. Keep a
serializable configuration Resource and emit a data model before creating nodes; this lets tests
compare layouts without rendering a scene.

## Official sources

- RandomNumberGenerator: https://docs.godotengine.org/en/4.6/classes/class_randomnumbergenerator.html
