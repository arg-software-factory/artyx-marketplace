# World Partition, Data Layers, and collaboration

World Partition divides a world into streamable grid cells. Editor visibility is not evidence that a
runtime cell will load at the right moment: test streaming sources, player travel, multiplayer
relevancy, and cook output on the target configuration. Keep critical gameplay actors and landmarks
in intentionally loaded or managed areas; do not depend on accidental editor-loaded state.

Data Layers express alternate or conditional content sets, not merely Outliner organization. Give
layers a documented runtime/editor role and test each combination that ships. Use HLODs to reduce the
cost of distant content after the authored world is stable; validate visual transition, streaming
memory, and build time rather than treating HLOD generation as a free optimization.

One File Per Actor reduces source-control contention by externalizing actor data, but it does not
remove ownership rules. Partition large areas by team responsibility, avoid mass incidental changes,
and review rename/delete operations carefully. Before changing partition settings, checkpoint source
control and verify commandlet/build requirements with the project branch.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/data-layers-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/one-file-per-actor-in-unreal-engine>
