# Profiling, frame budgets, and memory evidence

Measure frame time in milliseconds, not just average FPS. Set a target frame budget (for example,
16.67 ms at 60 Hz) and allocate a realistic CPU/GPU margin. Capture comparable camera paths and
gameplay load in a Development or shipping-like build; editor overhead and uncooked content can mask
the real bottleneck.

Use `stat unit` to classify frame bound, GPU Visualizer or `profilegpu` for GPU passes, Unreal
Insights for CPU threads, task scheduling, asset loading, and hitches, and memory/streaming tools for
allocation or pool pressure. Correlate evidence: a GPU spike can be shadows, translucency, material
instructions, resolution, post process, or geometry; a hitch can be async loading, garbage collection,
shader work, or game-thread traversal. Do not apply a generic draw-call fix without a trace.

Change the largest measured cost first, then re-capture the same scenario. Preserve visual acceptance
criteria alongside timing: an optimization that breaks streaming, input latency, collision, animation,
or lighting continuity is not complete.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/performance-and-profiling-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-insights-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/memory-insights-in-unreal-engine>
