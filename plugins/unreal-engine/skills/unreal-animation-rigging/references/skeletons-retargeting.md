# Skeleton import, IK Rig, and retargeting

One skeleton is a compatibility contract: its bone names, hierarchy, reference pose, root, and scale
affect every animation that shares it. Verify these in the Skeletal Mesh editor before importing a
large library. Keep mesh deformation, control rigs, and exported animation conventions separated;
do not repair systemic DCC transform errors clip by clip in Unreal.

Use an IK Rig to define retarget chains and goals for each skeleton, then create an IK Retargeter to
map source chains to target chains. Build and inspect a deliberate retarget pose for both source and
target; an incorrect neutral pose causes persistent shoulder, hip, and foot artifacts that no blend
setting fixes. Test representative idle, extreme reach, turn, and locomotion clips after retargeting.

Root motion must be a project policy. If enabled, ensure the correct root bone carries intentional
motion and that gameplay movement/replication consumes it consistently. Do not mix in-place and
root-motion locomotion casually across the same character state machine.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/skeletal-mesh-animation-system-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/ik-rig-animation-retargeting-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/root-motion-in-unreal-engine>
