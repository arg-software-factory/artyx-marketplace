---
name: unity-gameplay-architecture
description: Design robust Unity 6.0 LTS runtime gameplay with composable C# components, ScriptableObject data, Input System actions, UI boundaries, physics ownership, and testable lifecycle contracts.
---

# Unity gameplay architecture

Build gameplay as a composition of small components with explicit data and event boundaries. Inspect
the project's existing assembly definitions, input backend, UI stack, physics setup, and persistence
rules before adding an architectural pattern. Do not add a service locator, singleton, or package
because a local reference was inconvenient.

## Workflow

1. State the player-visible behavior and identify the authoritative owner of its state.
2. Separate immutable/tunable authoring data, runtime state, presentation, and infrastructure.
3. Define a narrow interface or event boundary; inject references at the composition root/prefab.
4. Select the correct update loop: input/read, simulation, presentation, and persistence are separate.
5. Add edit-mode tests for rules and play-mode tests for integration paths before optimizing.

## Read on demand

| Need | Read |
|---|---|
| Lifecycle, dependencies, ScriptableObjects, events, asmdefs | `references/components-data-and-lifecycle.md` |
| Input System, UI, physics, time and interaction boundaries | `references/input-ui-and-physics.md` |

For streaming/content ownership use `unity-scenes-content`; for concrete editor sessions load
`unity-mcp`; for measurements use `unity-performance-qa`.

Official baseline: [Unity 6 scripting](https://docs.unity3d.com/6000.0/Documentation/Manual/scripting.html).
