---
name: blender-animation-rigging
description: Build and diagnose Blender 4.5 character rigs, object animation, actions, NLA edits, constraints, drivers, cameras, and shot-ready timing. Use for deforming assets, reusable motion clips, cinematic blocking, retargeting, and animation validation.
---

# Animation, rigs, and shots

Lock units, frame rate, frame range, coordinate conventions, and delivery format before keying. Keep authored controls separate from deformation and export skeletons.

1. Create or audit rest pose, bone axes, hierarchy, deformation weights, and control ownership.
2. Block poses and timing before curve polish; validate contacts and silhouette at stepped keys.
3. Store reusable clips as named actions; use NLA only after the action itself is approved.
4. Use constraints/drivers for relationships and expose readable controls instead of baking incidental motion.
5. Verify at playback speed and render representative frames from the delivery camera.

Load [actions-rigs.md](references/actions-rigs.md) for armatures, weights, constraints, and action ownership. Load [fcurves-nla-cameras.md](references/fcurves-nla-cameras.md) for curve polish, NLA, camera grammar, and automation caveats.
