---
name: Level Assembly & Spawning
description: Load when assembling a level in a live UE 5.8 editor — spawning/placing actors, transforms in centimeters, outliner/folder organization, batch layouts, and world-partition awareness, with the discover-via-describe_toolset then verify-by-read discipline that stops silent no-op spawns.
---

# Level Assembly & Actor Spawning (native UE 5.8 MCP)

**Reach for this when** the task is "build/lay out a level", "place these actors", "scatter
props", "block out a scene", or "arrange a set". Assumes the base **Unreal Engine MCP** skill
is loaded: the native server hides real tools behind `list_toolsets` -> `describe_toolset` ->
`call_tool`; units are **centimeters**, Z is up, left-handed. Locals never persist — re-derive
actor labels from live reads every step.

## First: discover your spawn/transform surface

Spawning lives in `ActorTools` and/or `SceneTools`. Do this before your first spawn:

```
list_toolsets                              # confirm ActorTools / SceneTools are present
describe_toolset {name: "ActorTools"}      # read EXACT tool names + arg schemas
describe_toolset {name: "SceneTools"}
```

You are looking for tools shaped like: a **list/query** tool (list actors in the level), a
**spawn** tool (create actor by class/asset + transform), a **transform/edit** tool (set
location/rotation/scale/label), a **destroy** tool, and often a **folder/outliner** tool. Their
exact names are whatever `describe_toolset` returns from THIS editor — the doc example signature
is `set_actor_label(actor, label)`, but confirm live. Never invent one.

## Inspect before you build

Call the list-actors tool first. A "fresh" level still ships a floor, PlayerStart, SkyLight,
DirectionalLight, SkyAtmosphere, and often ExponentialHeightFog. Record what exists so you do not
duplicate a sun or spawn a second floor. If the user wants a clean slate, destroy deliberately by
exact label (read the label back first), one actor per call.

## Classes, assets & paths

- **Primitives / static meshes** — spawn a StaticMeshActor and point its mesh at an engine shape:
  `/Engine/BasicShapes/Cube.Cube`, `.../Sphere.Sphere`, `.../Cylinder.Cylinder`, `.../Cone.Cone`,
  `.../Plane.Plane`. Project meshes use `/Game/Path/Asset.Asset`.
- **Lights / cameras / volumes** — spawn by class name (DirectionalLight, PointLight, SpotLight,
  SkyLight, CineCameraActor, PostProcessVolume, ExponentialHeightFog). If the spawn tool wants a
  class path, engine classes resolve as `/Script/Engine.PointLight` — but check the schema first;
  many tools take a plain type string.
- Whatever the field names are (`type`, `class`, `asset_path`, `name`, `location`, `rotation`),
  match `describe_toolset` exactly.

## Transforms in centimeters (the #1 porting bug)

A "2 meter" crate is `200` cm. A human-height camera is `~160`. A room "10 m" across is `1000`.
Ground floor at Z=0 -> a 100 cm cube sits at Z=50 (half-height) to rest on the floor, not sink
into it. Vary Yaw so nothing is perfectly axis-aligned (5-20 deg) — grid-perfect placement reads
as machine-made. Scale is a multiplier on the mesh's native size, not a dimension.

```
# conceptual call_tool shape — use the EXACT keys describe_toolset gave you:
call_tool { toolset:"ActorTools", tool:"<spawn tool>", arguments:{
    name:"SM_Crate_01", type:"StaticMeshActor",
    mesh:"/Engine/BasicShapes/Cube.Cube",
    location:[0, 0, 50], rotation:[0, 0, 12], scale:[1, 1, 1] } }
```

## Batch layouts — spawn one at a time, arrange by math

There is rarely a true multi-spawn tool; loop single spawns and compute positions yourself. Read
the FINAL label back after each spawn (UE auto-suffixes `SM_Crate_01`, `SM_Crate_01_2`, ...) and
use that exact label for the next edit.

- **Grid**: `location = [origin_x + col*spacing, origin_y + row*spacing, z]`, spacing in cm
  (e.g. 250 for 2.5 m).
- **Ring**: `x = r*cos(theta)`, `y = r*sin(theta)`, `theta = 2*pi*i/n`, face-inward Yaw = `deg(theta)+180`.
- **Scatter**: jitter a grid by +/- 30-40% of spacing per axis and randomize Yaw; keep Z on the floor.

Announce the batch to yourself as a plan, verify each member landed before moving on.

## Outliner / folder organization

A flat outliner is unusable. If `describe_toolset` exposes a folder/label-path tool, set an
outliner folder per group (`Environment/Props`, `Lighting`, `Cameras`). If it does not, encode the
group in the actor label prefix (`ENV_`, `LGT_`, `CAM_`) so the human can still filter. Group as
you spawn, not in a cleanup pass.

## World Partition awareness

UE 5.x open-world maps use World Partition: the level streams in cells and only loaded cells are
editable. Consequences for spawning:

- Actors you spawn land in the currently loaded region; if the user pans far away, they may be in
  an unloaded cell and your read tool may not see them until that cell loads.
- Prefer building near the current viewport/origin unless the user gives world coordinates.
- Data Layers may hide actors; a "missing" actor may just be on an unloaded layer, not gone —
  verify by label query before re-spawning.
- If a whole region reads as empty when it should not, tell the human the cell may be unloaded
  rather than assuming your spawns failed.

## Pitfalls

- **A spawn result that echoes your input with no returned label/id is a suspect no-op** — list
  actors and confirm before continuing.
- **Meters instead of centimeters** — everything ends up 1/100 scale, clustered at the origin. If
  actors look invisible/tiny, you almost certainly forgot the x100.
- **Reusing an intended label after auto-suffix** — your later edit hits the wrong (or no) actor.
  Always edit by the read-back label.
- **Sinking through the floor** — Z must be >= half the actor's world-space height.
- **Second sun / second floor** — you skipped the inspect step.

## Verification ritual

1. List all level actors -> confirm your new labels are present with the right count.
2. Read back each hero actor's transform -> location/rotation/scale match your intent (in cm).
3. Spot-check outliner folder / label prefixes so the human can find each group.
4. Report the actual actor labels + transforms you read back, and flag anything that may be in an
   unloaded World Partition cell.
