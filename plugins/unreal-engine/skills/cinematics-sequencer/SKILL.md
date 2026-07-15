---
name: Cinematics & Sequencer
description: Load when building a Level Sequence in a live UE 5.8 editor — creating sequences, binding actors, keyframing transforms and cameras, camera cuts, and rendering — with the honest map that Sequencer is the LEAST-verified native MCP surface, plus the LevelSequence API to drive it through the Python power-lever or hand cleanly to the human.
---

# Cinematics & Sequencer (native UE 5.8 MCP)

**Reach for this when** the task is "make a camera flythrough", "animate this door opening in a
cutscene", "create a Level Sequence", "keyframe a camera move", or "render a shot". Assumes the
base **Unreal Engine MCP** skill is loaded (discovery-first, cm units, frames for time, verify-by-read).

## The honest boundary (read this first)

**Sequencer is the thinnest native MCP surface — treat it as unverified until you prove otherwise.**
Epic's documented shipping toolsets (`SceneTools`, `ActorTools`, `MaterialInstanceTools`,
`ObjectTools`) name NO Sequencer/cinematics tool, and no hands-on writeup has confirmed one. So
before promising a cutscene, discover the ground truth:

```
list_toolsets                              # is there a Sequencer/Cinematics/LevelSequence toolset?
describe_toolset {name:"<any such toolset>"}  # exact tool names + args if it exists
```

Then you are on one of three paths:

1. **A Sequencer toolset exists** (best case) — use its discovered tools; the structure below tells
   you what to build.
2. **A Python/console execution tool exists** (check `list_toolsets` — NOT guaranteed; the native
   shipping surface does not document one, though toolsets are built in Python) — drive the
   `unreal` LevelSequence API through it (recipe below). This is your `bpy`-equivalent lever.
3. **Neither** — do the reachable prep (spawn + place a CineCameraActor, name and position hero
   actors) and hand the human a precise Sequencer recipe. Do NOT fabricate a sequencer tool.

Whichever path, the domain structure is identical — learn it once here.

## Level Sequence structure (the mental model)

A **Level Sequence** asset holds **bindings** (actors it controls) and **tracks** (what it
animates on each binding), sectioned over a frame range at a **display rate** (fps). Time is in
**frames**, not seconds: 3 s at 30 fps = frames 0..90. Transforms are still centimeters.

- **Possessable** binding = an existing level actor the sequence drives (most common).
- **Spawnable** binding = an actor the sequence spawns for its duration (self-contained shots).
- **Transform track** on a binding keyframes location/rotation/scale.
- **Camera Cut track** on the sequence itself says WHICH camera is live over each range — without
  it, a rendered/played sequence uses the default viewport, not your camera.
- **CineCameraActor** is the cinematic camera (focal length, aperture, focus). Bind it, keyframe its
  transform, and point a Camera Cut section at it.

## Path 2 recipe — LevelSequence via the Python power-lever

Only if a Python-exec tool surfaced. These `unreal` API calls are the canonical 5.x approach;
confirm exact method names against THIS build's `unreal` module (some shift between versions), and
never claim a shot rendered without reading it back.

```python
import unreal
# 1. create the sequence asset
seq = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
    "CINE_Flythrough", "/Game/Cinematics", unreal.LevelSequence, unreal.LevelSequenceFactoryNew())
seq.set_display_rate(unreal.FrameRate(30, 1))
seq.set_playback_start(0); seq.set_playback_end(90)        # 3 seconds

# 2. bind an existing CineCameraActor from the level (spawn it first via ActorTools)
cam = unreal.EditorActorSubsystem().get_all_level_actors_by_class(unreal.CineCameraActor)[0]
cam_binding = seq.add_possessable(cam)

# 3. transform track + section + keys (dolly the camera along X)
tt = cam_binding.add_track(unreal.MovieScene3DTransformTrack)
sec = tt.add_section(); sec.set_range(0, 90)
chans = sec.get_channels()   # order: Loc X,Y,Z, Rot X,Y,Z, Scale X,Y,Z
chans[0].add_key(unreal.FrameNumber(0),  -600.0)
chans[0].add_key(unreal.FrameNumber(90),  200.0)

# 4. Camera Cut track so the render actually uses this camera
cut = seq.add_track(unreal.MovieSceneCameraCutTrack)
cut_sec = cut.add_section(); cut_sec.set_range(0, 90)
cut_sec.set_camera_binding_id(seq.make_binding_id(cam_binding))   # verify this call in-build

unreal.LevelSequenceEditorBlueprintLibrary.open_level_sequence(seq)   # show it to the human
result = {"sequence": seq.get_path_name(), "range": [0, 90],
          "bindings": [b.get_display_name() for b in seq.get_bindings()]}
```

Keyframing a hero actor (e.g. a door) is the same shape: get the actor, `add_possessable`, add a
`MovieScene3DTransformTrack`, key the rotation channels (indices 3-5) from closed to open.

## CineCameraActor essentials

Set on the camera component: `Current Focal Length` (mm — 35 wide, 50 normal, 85 tele),
`Aperture` (f-stop — lower = shallower depth of field), and focus (Manual with a distance, or
Tracking to lock an actor). A cinematic move keeps focal length and aperture consistent within a
shot unless you deliberately key a zoom/rack-focus.

## Rendering (usually a human handoff)

Rendering is the fiddliest surface and version-sensitive. If a render tool surfaced in discovery,
use it. Otherwise the modern path is **Movie Render Queue** (`unreal.MoviePipelineQueueEngineSubsystem`);
the legacy path is `unreal.SequencerTools.render_movie(...)`. Both are easy to get subtly wrong from
a headless call — prefer handing the human: "Sequence `CINE_Flythrough` is built and bound (0-90 @
30fps, Camera Cut on CineCam). Open Movie Render Queue, add this sequence, pick output (PNG stills or
ProRes/MP4), and Render." For a single still, they can also just scrub to the frame and use High
Resolution Screenshot.

## Pitfalls

- **No Camera Cut track** -> the render ignores your camera and shows the editor viewport.
- **Seconds instead of frames** -> keys land at frame 3 instead of frame 90; always multiply
  seconds x fps.
- **Keying an actor with no binding** -> nothing animates; `add_possessable` first, then track,
  then section, then keys — in that order.
- **Wrong channel index** -> you dolly when you meant to rotate. Channel order is Loc XYZ, Rot XYZ,
  Scale XYZ; read it back.
- **Claiming a shot rendered** when you only built the sequence, or when rendering was handed off.
  State exactly what exists.
- **Assuming a Sequencer tool exists** — it very likely does not in the shipped surface. Discover, do
  not assume.

## Verification ritual

1. Read the sequence back -> confirm it exists at its path, with the expected playback range,
   display rate, and bindings (camera + any hero actors).
2. Confirm the Camera Cut track points at your CineCameraActor over the shot range.
3. Spot-check keyframes: read a track's section channels -> the start/end key values match intent.
4. Report what is built vs. what you handed to the human (rendering almost always), and never imply
   a rendered frame exists unless you read the output file back.
