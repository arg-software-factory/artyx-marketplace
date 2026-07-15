# Scenes, prefabs, and loading topology

## Scene topology

Separate long-lived systems from level content when it simplifies lifetime: a bootstrap scene can own
application services, an additive gameplay scene owns level objects, and a UI scene owns persistent
presentation. This is a design decision, not a default. Establish which scene is active for newly
created objects and lighting settings. Additive loading requires explicit initialization, unload,
and cross-scene reference behavior; do not assume an object survives when its source scene unloads.

## Prefab contract

Use a prefab for reusable object structure and a Variant for a deliberately inherited family. Keep
overrides small and inspect them before applying: applying an instance override can alter all existing
instances. Do not encode scene-specific references into a reusable prefab when they should be wired by
the scene composition root. Nested prefabs should model meaningful ownership, not every visual child.

Names, hierarchy roots, tags, layers and static flags are content contracts. Keep organizational roots
at unit scale and avoid objects with ambiguous generated names. Save after verified changes, and scan
for missing scripts/references before handoff.

## Official sources

- Unity Manual: [Scenes](https://docs.unity3d.com/6000.0/Documentation/Manual/CreatingScenes.html)
- Unity Scripting API: [SceneManager](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/SceneManagement.SceneManager.html)
- Unity Manual: [Prefabs](https://docs.unity3d.com/6000.0/Documentation/Manual/Prefabs.html)
- Unity Manual: [Prefab Variants](https://docs.unity3d.com/6000.0/Documentation/Manual/PrefabVariants.html)
