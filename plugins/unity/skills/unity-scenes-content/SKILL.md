---
name: unity-scenes-content
description: Structure Unity 6.0 LTS scenes and content safely with prefab ownership, additive loading, Addressables 2.7 runtime assets, build profiles, and deterministic content validation.
---

# Unity scenes and content delivery

Decide asset ownership before editing: a scene owns level composition, a prefab owns reusable object
structure, a ScriptableObject owns reusable authored data, and Addressables owns runtime load/release
contracts. Keep scene topology, prefab edits, and content-delivery changes as explicit separate
decisions.

## Workflow

1. Inventory scenes, load mode, prefab nesting/overrides, package versions, and target platform.
2. Establish stable roots and ownership: environment, gameplay, UI, systems, generated content.
3. Use Prefab Variants for intentional deltas; apply/revert overrides only after comparing the source.
4. Choose direct scene references for always-resident content and Addressables for managed runtime
   loading. Every load path needs an owner and matching release path.
5. Build catalog/content, test fresh install plus update path, then verify Build Profile scene order.

## Read on demand

| Need | Read |
|---|---|
| Scene partitioning, prefab variants, additive loading | `references/scenes-prefabs-and-loading.md` |
| Groups, labels, async handles, remote content, build profiles | `references/addressables-and-builds.md` |

For generated scene content load `unity-procedural-navigation`; for safe live changes load
`unity-mcp`; for build-size/memory regressions use `unity-performance-qa`.

Official baseline: [Unity 6 scenes](https://docs.unity3d.com/6000.0/Documentation/Manual/CreatingScenes.html).
