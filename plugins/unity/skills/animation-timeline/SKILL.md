---
name: Unity Animation & Timeline
description: Load when authoring motion in Unity — deciding Animator vs Timeline, creating AnimationClips and blend trees programmatically (manage_animation), building Timeline/PlayableDirector cinematics and Cinemachine shots via editor scripting, and dodging root-motion traps. Covers the exact tool-call shapes plus the C# escape hatch where no dedicated Timeline tool exists.
---

# Animation & Timeline

Reach for this when something must be ANIMATED or CHOREOGRAPHED: character state machines, blended
locomotion, procedurally-authored clips, or a scripted cutscene. Pick the right system first — using
Timeline for gameplay state (or an Animator for a one-off cinematic) is the classic mistake.

Builds on the base `unity-mcp` skill. `manage_animation` covers Animator + AnimationClips; Timeline
has **no dedicated tool** — it's built with `execute_code`; Cinemachine rides on `manage_camera`.

## 0. Enable groups; verify APIs

```python
manage_tools(action="activate", group="animation")      # manage_animation
manage_tools(action="activate", group="scripting_ext")   # execute_code (Timeline, PlayableDirector)
manage_tools(action="activate", group="docs")            # unity_reflect — Timeline/Playables APIs vary
# manage_camera (Cinemachine) is core, already on
```
Before any Timeline `execute_code`: `unity_reflect(action="get_type",
class_name="UnityEngine.Timeline.TimelineAsset")` — if it returns nothing, `com.unity.timeline`
isn't installed (`manage_packages(action="add_package", package="com.unity.timeline")`).

## 1. Animator vs Timeline — decide before building

| Use **Animator Controller** (`manage_animation`) when… | Use **Timeline** (`execute_code`) when… |
|---|---|
| State depends on gameplay input/params (idle↔run↔jump) | A fixed, time-sequenced cinematic (cutscene, intro) |
| Motion loops / blends by a continuous parameter | Multiple objects choreographed on one clock |
| Reused across many instances of a character | Camera cuts, audio, activation tracks together |
| Reacts every frame to logic | Authored once, played by a `PlayableDirector` |

Rule of thumb: **gameplay = Animator; scripted show = Timeline.** They compose — a Timeline
Animation Track can drive an Animator-owned rig for a scene, then hand control back.

## 2. AnimationClips programmatically (manage_animation, clip_* keys verbatim)

```python
manage_animation(action="clip_create",
  clip_path="Assets/Anim/DoorOpen.anim",
  properties={"name": "DoorOpen", "length": 1.0, "frameRate": 60, "loop": False})

# Keyframe a transform channel. property/propertyPath match Unity's serialized curve binding.
manage_animation(action="clip_add_curve",
  clip_path="Assets/Anim/DoorOpen.anim",
  properties={"relativePath": "", "type": "Transform", "propertyPath": "localEulerAngles.y",
              "keys": [{"time": 0, "value": 0}, {"time": 1.0, "value": 90}]})

# Animation event (calls a method on the bound GameObject's components at a time)
manage_animation(action="clip_add_event",
  clip_path="Assets/Anim/DoorOpen.anim",
  properties={"time": 1.0, "functionName": "OnDoorFullyOpen", "stringParameter": "front"})
```
`clip_set_vector_curve` sets an x/y/z channel in one call; `clip_get_info` reads curves back —
always verify a curve landed (a bad `propertyPath` is silently dropped).

## 3. Blend trees (continuous, parameter-driven motion)

```python
manage_animation(action="controller_create_blend_tree_2d",
  controller_path="Assets/Anim/Player.controller",
  properties={"stateName": "Strafe", "blendParameterX": "MoveX", "blendParameterY": "MoveY"})
for clip, pos in [("Idle",[0,0]),("Fwd",[0,1]),("Back",[0,-1]),("Left",[-1,0]),("Right",[1,0])]:
    manage_animation(action="controller_add_blend_tree_child",
      controller_path="Assets/Anim/Player.controller",
      properties={"stateName": "Strafe", "clipPath": f"Assets/Anim/{clip}.anim", "position": pos})
```
1D: `controller_create_blend_tree_1d` + `blendParameter` + child `threshold`. Drive at runtime with
`animator_set_parameter`.

## 4. Timeline + PlayableDirector (execute_code — no tool)

Build the asset, add tracks, bind objects, and attach a director. Keep it ONE compiled routine.

```python
execute_code(action="execute", code='''
using UnityEngine.Timeline; using UnityEngine.Playables; using UnityEngine.Animations;
var tl = ScriptableObject.CreateInstance<TimelineAsset>();
AssetDatabase.CreateAsset(tl, "Assets/Cine/Intro.playable");

var animTrack = tl.CreateTrack<AnimationTrack>(null, "Hero");
var clip = AssetDatabase.LoadAssetAtPath<AnimationClip>("Assets/Anim/Wave.anim");
var tc = animTrack.CreateClip(clip); tc.start = 0; tc.duration = clip.length;
tl.CreateTrack<ActivationTrack>(null, "ShowLogo");      // toggles a GameObject on/off over time

var go = new GameObject("IntroDirector");
var dir = go.AddComponent<PlayableDirector>();
dir.playableAsset = tl;
var hero = GameObject.Find("Hero");
if (hero) dir.SetGenericBinding(animTrack, hero.GetComponent<Animator>());  // bind track → object
AssetDatabase.SaveAssets();
return $"timeline with {tl.outputTrackCount} tracks";
''')
```
Track types: `AnimationTrack`, `ActivationTrack`, `AudioTrack`, `ControlTrack`, `SignalTrack`,
`CinemachineTrack` (needs Cinemachine). Bindings via `PlayableDirector.SetGenericBinding(track,
object)` — an unbound track does nothing at play.

## 5. Cinemachine shots (manage_camera — verified reachable)

`manage_camera` unifies Unity Camera + Cinemachine; Tier-2 actions need `com.unity.cinemachine`
(check with `manage_camera(action="ping")`).

```python
manage_camera(action="create_camera", properties={
  "name": "CloseUp", "preset": "third_person", "follow": "Hero", "lookAt": "Hero", "priority": 20})
manage_camera(action="ensure_brain")                                  # CinemachineBrain on Main Camera
manage_camera(action="set_blend", properties={"style": "EaseInOut", "duration": 1.5})
manage_camera(action="force_camera", target="CloseUp")               # cut to it
manage_camera(action="screenshot_multiview", max_resolution=480)     # verify the framing
```
For a cutscene, put a `CinemachineTrack` on the Timeline (§4) and bind cameras to it instead of
`force_camera`.

## Pitfalls

- **Root motion vs in-place.** If the clip has root motion but the Animator's *Apply Root Motion* is
  off (or vice-versa), the character moonwalks or drifts. Match them: set `Animator.applyRootMotion`
  via `manage_components`/`execute_code` to the clip's intent, and for scripted movement usually turn
  root motion OFF and move the transform yourself.
- **Humanoid vs Generic clip mismatch** — a Generic clip on a Humanoid avatar (or reverse) silently
  produces no motion. Confirm avatar type (see `character-setup`).
- **Unbound Timeline tracks** do nothing — every track needs `SetGenericBinding`/track binding.
- **Timeline for gameplay** — a `PlayableDirector` overrides the Animator while playing; don't drive
  live gameplay state through Timeline.
- **Editing during Play Mode** — per base skill, animator/clip edits made while playing revert on stop.

## Verification ritual

1. `manage_animation(action="controller_get_info", ...)` / `clip_get_info` — states, blend children,
   and curves present.
2. Timeline: `execute_code` → `return AssetDatabase.LoadAssetAtPath<UnityEngine.Timeline.TimelineAsset>(
   "Assets/Cine/Intro.playable").outputTrackCount;` and confirm each director binding is non-null.
3. `manage_editor(action="play")` → `read_console(action="get", types=["error"])` (watch for
   "Animator is not playing"/missing-binding warnings) → `manage_editor(action="stop")` — ONCE.
4. `manage_camera(action="screenshot_multiview")` for cinematic framing; then `manage_scene(action="save")`.
