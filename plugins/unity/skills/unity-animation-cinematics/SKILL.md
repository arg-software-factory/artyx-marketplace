---
name: unity-animation-cinematics
description: Author Unity 6.0 LTS animation and cinematics with correct rig import, Animator state machines and blend trees, Timeline/Playables sequencing, Cinemachine cameras, and deterministic verification.
---

# Unity animation and cinematics

Classify the motion first: gameplay-reactive state belongs in an Animator Controller; fixed,
multi-object choreography belongs in Timeline; runtime composition or programmatic control belongs in
the Playables API. Verify package availability before using Timeline or Cinemachine APIs.

## Workflow

1. Inspect source rig type, clip import settings, avatar validity, scale, root motion and target rig.
2. Define ownership: character prefab/Animator for reusable gameplay, scene PlayableDirector for a
   cinematic. Do not hide gameplay state transitions in a cutscene timeline.
3. Build parameters, states, blend spaces, layers and transitions around observable gameplay intent.
4. Bind Timeline tracks explicitly and validate all exposed references in the scene.
5. Test first frame, loop seam, interruption, transition, camera hand-off and skipped-cinematic paths.

## Read on demand

| Need | Read |
|---|---|
| Avatars, clips, root motion, layers, state machines | `references/rigs-animator-and-runtime.md` |
| Timeline, Playables, signals, Cinemachine, renderable sequences | `references/timeline-playables-and-cameras.md` |

Use `unity-scenes-content` for prefab/addressable ownership and `unity-performance-qa` for profile
captures or automated playback verification.

Official baseline: [Unity 6 animation](https://docs.unity3d.com/6000.0/Documentation/Manual/AnimationSection.html).
