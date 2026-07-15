# Profiling rendering, CPU, and memory

## Capture protocol

Profile the target player with a reproducible route and record device, build type, resolution, quality
level, pipeline, scene, duration, warm-up behavior and input. Deep Profile changes timing materially;
use it briefly to find managed call detail, then confirm with normal instrumentation. Compare the same
frame range before/after a single change. Use Profiler markers or `ProfilerMarker` around systems where
built-in categories are too broad.

## Diagnose by dominant cost

- **Main thread CPU:** inspect scripting, physics, animation, UI rebuild, loading and GC allocation.
  Remove repeated searches/allocations, reduce unnecessary work frequency, batch where it preserves
  semantics, and verify the new call path.
- **Render thread/GPU:** use Frame Debugger and GPU timing to inspect passes, overdraw, shadows,
  post-processing, render targets, material variants and texture bandwidth. Do not optimize draw calls
  blindly when the frame is GPU-bound on shading/fill rate.
- **Memory:** use Memory Profiler/snapshots to distinguish managed heap, native objects, textures,
  meshes, bundles and duplicate assets. Resolve ownership and release paths; `Resources.UnloadUnusedAssets`
  is not a substitute for fixing retained references.
- **Loading:** capture async work, decompression, catalog/bundle operations and activation. Spread work
  only if the feature remains responsive and required objects are not accessed early.

## Budget and regression

Express budgets as percentiles/frame time and memory ceilings for a named device tier, not “60 FPS on
my machine.” Track a representative scene plus worst-case interaction. A visual change is accepted only
after correctness and its measured cost are both known.

## Official sources

- Unity Manual: [Profiler](https://docs.unity3d.com/6000.0/Documentation/Manual/Profiler.html)
- Unity Manual: [Frame Debugger](https://docs.unity3d.com/6000.0/Documentation/Manual/FrameDebugger.html)
- Unity Manual: [Memory Profiler](https://docs.unity3d.com/6000.0/Documentation/Manual/ProfilerMemory.html)
- Unity Scripting API: [ProfilerMarker](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Profiling.ProfilerMarker.html)
