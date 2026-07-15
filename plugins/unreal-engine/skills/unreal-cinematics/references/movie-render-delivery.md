# Movie Render Queue delivery contract

Enable the Movie Render Queue plugin, restart if requested, and use a saved preset rather than relying
on a mutable queue's unsaved settings. A render job binds a Level Sequence, the map it needs, and a
configuration. Set output directory, naming tokens, resolution, frame range/handles, format, and
render settings before queueing a full job. Preserve an image sequence/master output suitable for the
post pipeline; do not make a lossy preview movie the only deliverable.

Run a short calibration render first. Inspect camera cuts, temporal sampling, motion blur, exposure,
anti-aliasing, output color/bit depth, missing assets, warm-up frames, and artifacts at cut boundaries.
Use temporal sampling and high-cost quality overrides only when the sequence and hardware budget
justify them. Record engine version, map, sequence revision, preset, render range, and output path.

Movie Render Graph is appropriate when the project needs reusable conditional render logic; otherwise
a versioned MRQ preset is simpler. Runtime rendering has different constraints and requires runtime
Movie Pipeline APIs; do not assume editor MRQ configuration ships into a game.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/movie-render-pipeline-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/cinematic-render-settings-and-formats-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/movie-render-queue-in-runtime-in-unreal-engine>
