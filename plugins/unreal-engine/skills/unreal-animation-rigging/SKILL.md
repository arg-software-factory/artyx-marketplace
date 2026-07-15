---
name: unreal-animation-rigging
description: Build and debug Unreal Engine 5.6+ character animation. Use for skeleton import, retargeting, Animation Blueprints, state machines, montages, root motion, IK Rig, Control Rig, animation notifies, or runtime animation performance.
---

# Animation and rigging

Read [skeletons-retargeting.md](references/skeletons-retargeting.md) when importing or sharing motion.
Read [runtime-animation.md](references/runtime-animation.md) for Animation Blueprints, montages,
root motion, and gameplay synchronization. Keep skeleton naming, scale, retarget poses, and root-motion
policy stable before producing a library of clips.

## Animation build loop

1. Validate bind pose, hierarchy, scale, root bone, skin weights, and coordinate conversion in a
   skeletal-mesh preview before integrating gameplay.
2. Establish IK Rig/Retargeter and a documented neutral retarget pose before batch retargeting.
3. Drive locomotion from authoritative movement data, use state machines for sustained states and
   montages for bounded actions.
4. Place gameplay-critical timing in notifies/state transitions, then test interruption, network
   authority, camera changes, and low frame rates.
