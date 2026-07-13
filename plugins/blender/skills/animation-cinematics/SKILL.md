---
name: Animation & Cinematics
description: Load for advanced animation in a live Blender session beyond basic keyframes — constraint-driven motion (Follow Path, Track To), drivers, NLA action layering, multi-camera cinematography (focal length, dolly vs zoom, marker-bound camera switching), per-fcurve easing/interpolation, and animated cinematic lighting, using the Blender 5.x layered-action fcurve API.
---

# Animation & Cinematics (live Blender)

**Reach for this when** a shot needs more than "move object A to B": camera language, rig constraints, drivers, layered/NLA animation, or lighting that changes over time. Assumes the base **Blender MCP** skill: set `frame_start/end` FIRST, block poses, mutate in small `execute_python` calls (assign `result`), re-derive objects from `bpy.data` each call, verify keyframe/marker counts after every write, end with a final `get_scene_info`. No screenshot tool — verify by reading frame ranges, keyframe counts, constraint/driver presence, and per-fcurve interpolation.

## The fcurve helper (Blender 4.x AND 5.x)

Blender 5.x moved `Action.fcurves` into layered actions. Always go through this — never touch `action.fcurves` directly in shared code:

```python
def action_fcurves(action):
    fcs = getattr(action, "fcurves", None)
    if fcs is not None:                       # 4.x and older
        return list(fcs)
    return [fc for layer in action.layers for strip in layer.strips   # 5.x
            for bag in strip.channelbags for fc in bag.fcurves]
```

Paste this helper into every `execute_python` call that uses it — Python locals (functions included) do NOT survive between calls.

## Per-fcurve easing (the difference between amateur and pro)

Interpolation is chosen per keyframe, per channel. `CONSTANT` for mechanical/holds, `LINEAR` for constant-velocity (conveyor, camera dolly), `BEZIER` + easing for organic motion. Set `easing` (`EASE_IN`/`EASE_OUT`/`EASE_IN_OUT`) and handle types for anticipation/settle.

```python
import bpy
act = bpy.data.objects["Hero"].animation_data.action
for fc in action_fcurves(act):
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'; kp.easing = 'EASE_IN_OUT'
        kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
    if not any(m.type == 'CYCLES' for m in fc.modifiers):   # cyclic motion: idle bob, spin
        fc.modifiers.new('CYCLES')
result = {"channels": len(action_fcurves(act)),
          "interp": sorted({kp.interpolation for fc in action_fcurves(act) for kp in fc.keyframe_points})}
```

## Constraint-driven rigs (no per-frame keying)

Constraints animate relationships. **Track To** aims one object at another (a camera locked on a subject); **Follow Path** rides an object along a curve — animate the curve's `eval_time` (or enable path animation) rather than the object's location.

```python
import bpy, math
cam = bpy.data.objects["Camera"]; target = bpy.data.objects["Hero"]
tt = cam.constraints.new('TRACK_TO'); tt.target = target
tt.track_axis = 'TRACK_NEGATIVE_Z'; tt.up_axis = 'UP_Y'   # camera looks down -Z
cu = bpy.data.curves.new("Dolly", 'CURVE'); cu.dimensions = '3D'   # follow-path dolly track
cu.use_path = True; cu.path_duration = 96
sp = cu.splines.new('NURBS'); sp.points.add(2)
for p, co in zip(sp.points, [(-6,-6,1.6,1),(0,-8,1.6,1),(6,-6,1.6,1)]): p.co = co
path = bpy.data.objects.new("Dolly", cu); bpy.context.scene.collection.objects.link(path)
fp = cam.constraints.new('FOLLOW_PATH'); fp.target = path; fp.use_curve_follow = True
cu.eval_time = 0;  cu.keyframe_insert("eval_time", frame=1)    # animate travel over path_duration
cu.eval_time = 96; cu.keyframe_insert("eval_time", frame=96)
result = {"constraints": [c.type for c in cam.constraints], "path_dur": cu.path_duration}
```

## Drivers (procedural relationships)

A driver computes a channel from another value — a scripted expression over variables. Use for follow-through, dependent motion, or exposing a control (e.g. a wheel's rotation driven by forward travel).

```python
import bpy
wheel = bpy.data.objects["Wheel"]; body = bpy.data.objects["Car"]
fcurve = wheel.driver_add("rotation_euler", 1); drv = fcurve.driver; drv.type = 'SCRIPTED'  # idx 1 = Y
var = drv.variables.new(); var.name = "x"; var.type = 'TRANSFORM'
tgt = var.targets[0]; tgt.id = body; tgt.transform_type = 'LOC_X'; tgt.transform_space = 'WORLD_SPACE'
drv.expression = "-x / 0.35"                       # radius 0.35 m -> radians rolled
result = {"driver_expr": drv.expression, "vars": [v.name for v in drv.variables]}
```

## NLA layering

Push a finished action to an NLA strip so you can blend/stack multiple clips (walk + wave), retime, and reuse. Once pushed, the active action slot frees for the next layer.

```python
import bpy; obj = bpy.data.objects["Hero"]
ad = obj.animation_data or obj.animation_data_create()
if ad.action:
    track = ad.nla_tracks.new(); track.name = "Base"
    strip = track.strips.new(ad.action.name, 1, ad.action)   # (name, start_frame, action)
    strip.blend_type = 'REPLACE'; strip.extrapolation = 'HOLD'
    ad.action = None                                          # slot free for the next layer
result = {"nla_tracks": [t.name for t in obj.animation_data.nla_tracks]}
```

## Camera work + marker-bound switching

Focal length is your lens language: **18–24 mm** wide/dramatic (exaggerated depth), **35–50 mm** natural, **85 mm+** compressed/portrait. **Dolly** = move the camera body (parallax changes — cinematic). **Zoom** = animate `lens` (flat, use sparingly). Switch between cameras by binding each to a timeline marker.

```python
import bpy
scene = bpy.context.scene
def make_cam(name, loc, lens):
    cd = bpy.data.cameras.new(name); cd.lens = lens
    co = bpy.data.objects.new(name, cd); co.location = loc
    scene.collection.objects.link(co); return co
wide  = make_cam("Cam_Wide", (0, -10, 2.0), 24)
close = make_cam("Cam_Close", (2, -3, 1.7), 85)
scene.camera = wide                                  # default active
for frame, cam in [(1, wide), (60, close)]:          # marker-bound switching
    mk = scene.timeline_markers.new(f"shot_{frame}", frame=frame); mk.camera = cam
wide.location = (0, -10, 2.0); wide.keyframe_insert("location", frame=1)   # DOLLY (move body) not zoom
wide.location = (0, -6,  2.0); wide.keyframe_insert("location", frame=60)
result = {"cameras": [wide.name, close.name],
          "markers": [(m.name, m.frame, m.camera.name if m.camera else None) for m in scene.timeline_markers]}
```

## Animated cinematic lighting

Key light energy/color for reveals, flickers, day-night. Light data is animated on the light's `.data` (energy/color), not the object.

```python
import bpy
key = bpy.data.objects["KeyLight"]; ld = key.data
for frame, energy, color in [(1, 200, (1.0,0.7,0.4)), (48, 1200, (1.0,0.95,0.9))]:
    ld.energy = energy; ld.color = color
    ld.keyframe_insert("energy", frame=frame); ld.keyframe_insert("color", frame=frame)
result = {"light_keys": len(action_fcurves(ld.animation_data.action)) if ld.animation_data else 0}
```

## Pitfalls

- **Set the frame range first.** `scene.frame_start/end` — keys outside the range silently don't play.
- **Follow Path needs `curve.use_path=True`**; animate `eval_time`/`path_duration`, not the object. No `use_curve_follow` = un-oriented travel.
- **Drivers silently evaluate to 0** on a wrong target id/transform_type — read `driver.expression` back and sample the channel at two frames to confirm it moves.
- **NLA: pushing an action clears the active slot.** Keep keying after a push without a new action and you edit nothing — verify tracks exist.
- **Only ONE `scene.camera` is active** without markers; a marker's `.camera` must be set or switching does nothing.
- **Physics sims need baking + user-triggered playback.** For short clips, keyframe the fake (base-skill rule stands).

## Verification ritual

1. Read frame range + per-object keyframe counts (`len(action_fcurves(action))`, keyframe_points per channel).
2. Confirm constraints (`[c.type for c in obj.constraints]`), driver expressions, and NLA tracks by name; list camera markers `(name, frame, camera)` + active `scene.camera`.
3. When unsure motion applies, sample two frames (evaluate depsgraph, read `obj.matrix_world.translation`) to prove the shot animates.
4. Final `get_scene_info` → report the real animation range, cameras, and lighting keys you read back.
