---
name: unity-overview
description: "Route Unity 6.0 LTS work to the right expert workflow: connected Editor operations, rendering and textures, animation and cinematics, gameplay architecture, scenes and content delivery, procedural navigation, or profiling and QA."
---

# Unity 6.0 LTS expert map

Use this first when a Unity request spans domains. This plugin targets **Unity 6.0 LTS (6000.0)**.
Inspect the project version, render pipeline, installed packages, target platforms, and existing
architecture before choosing an implementation. Do not mix pipeline-specific shaders or package APIs
without confirming the package in `Packages/manifest.json`.

## Choose one primary skill

| Need | Load |
|---|---|
| Operate a connected live Unity Editor safely | `../unity-mcp/SKILL.md` |
| Texture import, PBR, Shader Graph, URP/HDRP lighting | `../unity-rendering-textures/SKILL.md` |
| Rigs, Animator, Timeline, Playables, Cinemachine | `../unity-animation-cinematics/SKILL.md` |
| Runtime C#, composition, input, UI, physics | `../unity-gameplay-architecture/SKILL.md` |
| Scenes, prefabs, Addressables, build content | `../unity-scenes-content/SKILL.md` |
| Seeded generation, pooling, NavMesh | `../unity-procedural-navigation/SKILL.md` |
| Profiling, memory, tests, CI-quality gates | `../unity-performance-qa/SKILL.md` |

## Working contract

1. State the Unity version, pipeline and target platform in the task output.
2. Prefer small composable assets and components over global singletons or runtime discovery.
3. Validate after every boundary: import, compile, scene save, build, and device/profile capture.
4. Load only the reference file named by the selected skill; read a second only when its decision
   depends on it. References are original operational guidance with canonical Unity links.

## Cross-domain order

For a feature: architecture → content/scene ownership → rendering or animation → runtime behavior →
profiling and tests. For an existing project, characterize first; do not “upgrade” pipelines, package
versions, or serialization formats as a side effect of a feature request.

Official baseline: <https://docs.unity3d.com/6000.0/Documentation/Manual/index.html>.
