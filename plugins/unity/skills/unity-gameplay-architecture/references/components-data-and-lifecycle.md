# Components, data, and lifecycle boundaries

## Ownership model

Give each behavior one authoritative owner. A `MonoBehaviour` owns scene-bound integration and
serialized references; a plain C# object owns deterministic rules; a `ScriptableObject` owns reusable
authored data, not mutable per-session state unless the lifecycle is explicitly controlled. Avoid
using assets as hidden global state because Editor play sessions, domain reload settings, and tests can
retain values unexpectedly.

Use composition at prefab/scene roots. Pass dependencies by serialized reference, constructor/factory
for plain C# objects, or a narrowly scoped installer. `GetComponent` is appropriate for required
co-located parts and should be cached; global `Find*` calls make load order and tests fragile.

## Lifecycle rules

- `Awake`: establish local invariants and cache required components.
- `OnEnable` / `OnDisable`: symmetric subscriptions and cancellation.
- `Start`: interact with already-initialized scene dependencies when necessary.
- `Update`: read/present frame-rate-sensitive behavior; never allocate or scan globally per frame.
- `FixedUpdate`: apply Rigidbody forces/physics decisions, using fixed timestep semantics.
- `OnDestroy`: release external registrations and disposable runtime resources.

Events should communicate facts (`HealthChanged`, `DoorOpened`), not command arbitrary global work.
Unsubscribe on disable; stale listeners are a common duplicate-action and memory-lifetime bug. Use
interfaces for replaceable behavior or tests, not to wrap every class. Keep assembly definitions
acyclic and isolate `UnityEditor` code in Editor-only assemblies.

## Official sources

- Unity Manual: [MonoBehaviour](https://docs.unity3d.com/6000.0/Documentation/Manual/class-MonoBehaviour.html)
- Unity Manual: [Execution order](https://docs.unity3d.com/6000.0/Documentation/Manual/ExecutionOrder.html)
- Unity Manual: [ScriptableObject](https://docs.unity3d.com/6000.0/Documentation/Manual/class-ScriptableObject.html)
- Unity Manual: [Assembly definitions](https://docs.unity3d.com/6000.0/Documentation/Manual/ScriptCompilationAssemblyDefinitionFiles.html)
