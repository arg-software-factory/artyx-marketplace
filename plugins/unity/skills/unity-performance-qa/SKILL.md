---
name: unity-performance-qa
description: Measure and harden Unity 6.0 LTS projects through Profiler and Frame Debugger evidence, CPU/GPU/memory diagnosis, Unity Test Framework 1.4 tests, build validation, and regression-safe performance budgets.
---

# Unity performance and QA

Measure first. A high frame time, allocation, draw-call count, load hitch, or visual defect has a
different cause depending on target hardware, render pipeline, content and build configuration.
Define a representative scene, device class, repeatable input, warm-up state and numeric budget before
changing code or assets.

## Workflow

1. Reproduce in a development player or target device when possible; Editor-only profiles are clues.
2. Capture CPU, GPU, memory, rendering and loading evidence with markers around the user path.
3. Identify the dominant bottleneck, change one causal subsystem, then recapture the same scenario.
4. Add the smallest useful automated test at the failed boundary and a smoke test for user-visible flow.
5. Validate clean build, package/asset integrity, console errors, platform log and performance budget.

## Read on demand

| Need | Read |
|---|---|
| Profiler workflow, render/memory diagnosis, common remedies | `references/profiling-rendering-and-memory.md` |
| Edit/Play mode tests, CI, build and release checks | `references/testing-builds-and-ci.md` |

Use `unity-rendering-textures` for fidelity/cost tradeoffs and `unity-scenes-content` for content
loading/build layout. Do not optimize a metric that has not been captured.

Official baseline: [Unity 6 profiling](https://docs.unity3d.com/6000.0/Documentation/Manual/Profiler.html).
