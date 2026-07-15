# Resource save and load

Persist an explicit schema version, seed, configuration, and player-driven deltas. Resources are
good for authored data; save-game state needs a deliberate format and migration policy. Validate
loaded data before instantiating it, and never deserialize arbitrary untrusted content as a project
resource.

## Official sources

- Saving games: https://docs.godotengine.org/en/4.6/tutorials/io/saving_games.html
- Resources: https://docs.godotengine.org/en/4.6/tutorials/scripting/resources.html
