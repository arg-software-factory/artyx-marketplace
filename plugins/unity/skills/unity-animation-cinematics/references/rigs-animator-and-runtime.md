# Rig import, Animator, and runtime motion

## Import invariants

Choose Humanoid only when the source is a valid human-like skeleton requiring retargeting; use Generic
for non-humanoid rigs or when exact bone behavior matters. Confirm avatar mapping, scale factor,
orientation, clip range, loop pose, root transform settings and compression in the imported asset.
Changing rig type or root-motion settings after authoring controller logic is a migration, so test all
dependent prefabs.

## Animator design

Use parameters as the narrow contract from gameplay to motion: floats for continuous speed, bools for
lasting conditions, triggers for one-shot requests, and ints only for mutually exclusive modes.
Prefer a 1D/2D Blend Tree for locomotion instead of transition webs. Keep upper-body or additive work
in layers with deliberate Avatar Masks. Make transition conditions mutually understandable; avoid
exit-time-plus-trigger combinations that make input latency unpredictable.

Root motion is an ownership decision. If an animation owns displacement, consume root motion and make
gameplay collision agree. If movement code owns displacement, disable/apply root motion accordingly.
Never have `CharacterController`, Rigidbody, and root motion all independently move the same transform.

## Runtime contract

Cache `Animator` references, hash frequently-used parameter names with `Animator.StringToHash`, and
set only values that actually change. Animation events are authored data that invoke methods by name;
use them for tightly clip-bound effects, not core authority that must survive network/replay/skip paths.
Test state interruption and disable/enable paths, especially for attack, hit and locomotion layers.

## Official sources

- Unity Manual: [Model import settings](https://docs.unity3d.com/6000.0/Documentation/Manual/class-ModelImporter.html)
- Unity Manual: [Mecanim animation system](https://docs.unity3d.com/6000.0/Documentation/Manual/AnimationOverview.html)
- Unity Manual: [Blend Trees](https://docs.unity3d.com/6000.0/Documentation/Manual/class-BlendTree.html)
- Unity Scripting API: [Animator](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Animator.html)
