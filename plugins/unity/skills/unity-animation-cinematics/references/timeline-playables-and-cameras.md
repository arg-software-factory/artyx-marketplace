# Timeline, Playables, and cameras

## Timeline ownership

Timeline is a scene-level time sequence. Keep the `TimelineAsset` reusable where possible and put
scene-specific object bindings on the `PlayableDirector`. Each output track must have a deliberate
binding; an unbound track can appear authored but produce no behavior. Use Signals or marker-driven
events for optional orchestration, but make skip/cancel state explicit rather than relying on a final
clip event.

Represent a cutscene as a lifecycle: prepare references and player control, play, permit skip,
restore gameplay camera/input/animation ownership, and clean up transient objects. Validate start,
mid-sequence interrupt, end, and scene unload. Never let a Timeline permanently own an Animator or
camera after it ends without an explicit restoration path.

## Playables

Use the Playables API when runtime code needs to construct, blend, or schedule graphs. Create the
graph, connect inputs with known weights, evaluate/drive it under a known update mode, and destroy it
with the owner. Do not create graphs per frame. For simple authored cinematic work, prefer Timeline;
for gameplay state, prefer Animator.

## Cinemachine

Cinemachine cameras describe shots while the Unity Camera renders. Centralize priority/activation
rules so two systems do not fight for camera control. Define follow/look-at targets and damping from
gameplay constraints, then verify collision, framing, lens, blend, paused state and target removal.
Use the package version installed in the project—the API differs between major versions.

## Official sources

- Unity Manual: [Timeline](https://docs.unity3d.com/6000.0/Documentation/Manual/com.unity.timeline.html)
- Unity Scripting API: [Playables](https://docs.unity3d.com/6000.0/Documentation/Manual/Playables.html)
- Unity Manual: [Cinemachine](https://docs.unity3d.com/6000.0/Documentation/Manual/com.unity.cinemachine.html)
