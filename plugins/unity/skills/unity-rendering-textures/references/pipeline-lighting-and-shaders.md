# Pipelines, lighting, and Shader Graph

## Pipeline decision

Keep the project pipeline fixed unless the request explicitly includes a migration. URP targets
scalable, broad-platform rendering; HDRP targets high-end visual fidelity and has distinct lighting,
volume, and shader contracts. Query the active Render Pipeline Asset and Quality settings before
choosing a shader. A pink material indicates a missing/incompatible shader, not a texture failure.

## Shader Graph discipline

Start from the pipeline's Lit or Unlit target. Define exposed properties with stable reference names;
renaming a property can break material serialization and scripts. Minimize texture samples and dynamic
branches, prefer keyword variants only where the variant count is controlled, and test every enabled
keyword combination. Put reusable math in Sub Graphs only when it reduces duplication without hiding
sampling costs.

For custom HLSL, document pipeline dependencies and validate shader variants in a player build. Do not
copy Built-in surface shader patterns into SRP code.

## Lighting and post-processing

Choose a lighting intent: baked/static, mixed, or fully realtime. Mark static geometry and configure
lightmap UVs before baking; bake after meaningful geometry changes, not during iteration. Use a global
Volume for project-wide defaults and local Volumes for bounded changes. Lock exposure/color management
before art tuning. Transparent materials are sorted and generally cost more; use alpha clip when the
visual result permits.

Capture Frame Debugger and GPU Profiler evidence when changing shadows, post effects, render scale,
or decals. Optimize overdraw, shadowed lights, render targets, and texture bandwidth before premature
micro-optimizations in shader arithmetic.

## Official sources

- Unity Manual: [URP](https://docs.unity3d.com/6000.0/Documentation/Manual/com.unity.render-pipelines.universal.html)
- Unity Manual: [HDRP](https://docs.unity3d.com/6000.0/Documentation/Manual/com.unity.render-pipelines.high-definition.html)
- Unity Manual: [Shader Graph](https://docs.unity3d.com/6000.0/Documentation/Manual/shader-graph.html)
- Unity Manual: [Lighting](https://docs.unity3d.com/6000.0/Documentation/Manual/Lighting.html)
