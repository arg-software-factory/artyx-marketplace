# Rendering diagnostics and evidence

Use the tool that exposes the relevant bottleneck. `stat unit` separates game, draw, and GPU frame
time; GPU Visualizer/`profilegpu` identifies GPU passes; Unreal Insights correlates CPU threads,
loading, and frame hitches; view modes such as Shader Complexity, Light Complexity, Nanite and
Lumen visualizations reveal content causes. Capture a comparable camera path and scalability preset
before and after a change.

Do not optimize from draw-call folklore. A scene can be bound by material instructions, translucent
overdraw, shadowing, resolution, texture streaming, geometry, CPU scene traversal, or asynchronous
loading. Change one measured cause and record frame time, not only FPS. Keep a quality budget per
platform: resolution/upscaling, shadow quality, GI/reflections, foliage, post process, geometry, and
texture pool all compete for the same device.

When a visual defect appears, isolate it with view modes and a minimal map before changing global
project settings. Revert debug console variables and temporary scalability changes after capture.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/performance-and-profiling-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-insights-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/viewport-modes-in-unreal-engine>
