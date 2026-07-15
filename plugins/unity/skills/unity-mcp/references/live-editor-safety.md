# Live Editor safety and recovery

## Preconditions and ownership

Treat a scene and its serialized assets as a transaction boundary. First record the active scene,
dirty state, selected objects, render pipeline, and a hierarchy snapshot. Define a dedicated root
such as `_Generated/Encounter_01`; only that root may be deleted or recreated by automation. If a
request names an object but not its scene or prefab source, resolve that ambiguity before writing.

Do not author while in Play Mode: scene object changes are normally reverted when the mode exits.
Do not reload or create a scene after starting work unless the task explicitly requires a multi-scene
operation and the current scene has been saved. Prefer additive scene loading for intentional
composition; unload only scenes opened by the current task.

## Mutation discipline

- Inspect a serialized component before setting fields. Unity serialization uses field names and may
  silently retain a prior value when a reference, enum, shader property, or type is wrong.
- Create assets at stable paths and make one asset authoritative. Editing a prefab instance differs
  from editing its prefab asset; apply intentionally, never incidentally.
- Make generated writes idempotent: find the owned root, replace it, produce counts and return the
  generated seed/configuration.
- Preserve Undo for user-visible Editor changes. A custom editor batch should register a single
  meaningful undo operation rather than leave partially-created objects.

## Failure recovery

After a source or package edit, wait for a compile cycle and read errors once. Fix the first compiler
error before interpreting downstream errors. A domain reload invalidates object references and tool
handles; re-query by stable asset path, GUID, or hierarchy path instead of retrying an old handle.

If an editor call times out, make a cheap read-only status request once. Do not repeat a write until
you determine whether it completed. If it did, verify and continue; if not, retry the idempotent
operation once. Save only after the expected hierarchy and console state are observed.

## Official sources

- Unity Manual: [Scenes](https://docs.unity3d.com/6000.0/Documentation/Manual/CreatingScenes.html)
- Unity Manual: [Prefab workflow](https://docs.unity3d.com/6000.0/Documentation/Manual/Prefabs.html)
- Unity Scripting API: [Undo](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Undo.html)
- Unity Manual: [Enter Play Mode settings](https://docs.unity3d.com/6000.0/Documentation/Manual/ConfigurableEnterPlayMode.html)
