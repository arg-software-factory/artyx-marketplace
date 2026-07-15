---
name: Materials & Lighting
description: Load when texturing or lighting a live UE 5.8 level — material instances vs parents, scalar/vector parameters, Lumen-era lighting (directional sun + skylight + sky atmosphere + height fog baseline with real intensities), and post-process volume essentials, discovered via describe_toolset and verified by reading properties back.
---

# Materials & Lighting (native UE 5.8 MCP, Lumen era)

**Reach for this when** the task is "light this scene", "make it look like dusk/night/studio",
"give this a metal/plastic material", "tint these actors", or "set up a material instance".
Assumes the base **Unreal Engine MCP** skill is loaded (discovery-first, cm units). You have no
guaranteed way to SEE the frame — there may be no screenshot tool. Verify by reading property
values back and stating intensities numerically; never claim a look you did not read. If a render
or viewport-capture tool surfaces in `describe_toolset`, use it and still report the numbers.

## Discover your material + property surface

```
list_toolsets
describe_toolset {name: "MaterialInstanceTools"}   # material instance create/param tools
describe_toolset {name: "ObjectTools"}             # generic set-property (light intensity, etc.)
describe_toolset {name: "ActorTools"}              # spawn lights, edit actor/component props
```

Documented: `MaterialInstanceTools` covers creating/modifying material instances; `ObjectTools`
covers generic object property reads/writes (your lever for light intensity, fog density, PPV
settings when there is no dedicated light tool). Community sessions also report `MaterialTools`.
Exact tool + arg names come only from `describe_toolset` — confirm live, never invent.

## Materials: instance the parent, never mutate it

Per-actor variation ALWAYS goes through a **Material Instance Constant** (MIC), not the base
Material. Editing the parent Material changes every actor that uses it and can trigger a shader
recompile stall.

- A parameter is only settable on an instance if the parent Material exposed it as a **named
  Parameter** (ScalarParameter / VectorParameter / TextureParameter node). If a param will not set,
  the parent almost certainly does not expose it — tell the human; do not fight it.
- **Scalar** params drive single floats: `Roughness` (0=mirror, 1=matte), `Metallic` (0 or 1, rarely
  between), `Specular`, `Emissive Strength`, `Opacity`.
- **Vector** params drive colors as **linear RGBA** float4 (NOT 0-255 sRGB): pure red is
  `[1,0,0,1]`; a mid grey is `~[0.21,0.21,0.21,1]`. Author base colors in the 0.02-0.9 range —
  never pure `[0,0,0,1]` or `[1,1,1,1]` (physically implausible, reads flat).

```
# 1. create an instance of a parent that exposes params:
call_tool { toolset:"MaterialInstanceTools", tool:"<create instance tool>", arguments:{
    name:"MI_Crate_Worn", parent:"/Game/Materials/M_Master.M_Master",
    path:"/Game/Materials/Instances" } }
# 2. set params (exact keys from describe_toolset):
call_tool { toolset:"MaterialInstanceTools", tool:"<set scalar tool>",
    arguments:{ instance:"MI_Crate_Worn", parameter:"Roughness", value:0.65 } }
call_tool { toolset:"MaterialInstanceTools", tool:"<set vector tool>",
    arguments:{ instance:"MI_Crate_Worn", parameter:"BaseColor", value:[0.35,0.22,0.12,1] } }
# 3. assign to the actor's mesh-component material slot (ActorTools/ObjectTools):
#    slot index is 0-based; a mesh with 3 sections has slots 0,1,2.
```

Roughness/metallic variance across a set is what sells realism — do not give ten props the exact
same 0.5 roughness.

## Lumen lighting baseline (dynamic GI — no lightmaps)

UE5 defaults to **Lumen** for global illumination and reflections: lighting is fully dynamic, no
bake step, and **emissive materials contribute to GI**. A believable outdoor scene needs four
coordinated actors (spawn via the level/actor tools, set props via ObjectTools):

1. **DirectionalLight** (the sun). Intensity is in **lux**; UE default ~10. With auto-exposure a
   clear-day sun reads well around **3-8 lux**; push toward physical daylight (up to ~100000) only
   if the human has clamped/disabled auto-exposure. Set `Atmosphere Sun Light = true` so the sky's
   sun disk tracks it. Rotation (Pitch) sets time of day: -45 = mid-morning, -10 = golden hour,
   +5 = below-horizon dusk.
2. **SkyLight** (ambient fill / sky bounce). Source = Captured Scene, Intensity ~1. If the sky
   changes after capture, it needs a recapture (`Real Time Capture = true` keeps it live).
3. **SkyAtmosphere** — physically-based sky + aerial perspective; nearly free and makes the
   directional sun believable. One per level.
4. **ExponentialHeightFog** — depth and mood. `Fog Density ~0.02`; enable **Volumetric Fog** for
   light shafts/god-rays. This is what turns a flat lit box into an atmosphere.

Accent/interior lights are **PointLight / SpotLight / RectLight**. Their intensity unit depends on
the light's `Intensity Units` (Candelas, Lumens, or EV): in candelas an accent reads ~2000-8000 cd;
in lumens a room bulb is ~800-1600 lm. Read the unit before setting a number, or you will be 100x
off. SpotLights need `Inner/Outer Cone Angle`; RectLights need `Source Width/Height`.

**Studio / product look**: skip the sun; use a large RectLight key (front-45), a dimmer RectLight
fill (opposite), a rim SpotLight behind, a mid-grey SkyLight, and a neutral seamless backdrop.

## Post-process volume essentials

Spawn a **PostProcessVolume**, set `Infinite Extent (Unbound) = true` so it affects the whole level
(otherwise it only applies inside its box). Then the high-value knobs (via ObjectTools property set):

- **Exposure** — Metering Mode + Min/Max EV100. Auto-exposure is why a light change may look wrong
  at first; lock Min=Max EV100 for a fixed, predictable exposure when tuning intensities by number.
- **Bloom** intensity (keep subtle, ~0.4-0.7), **Color Grading** (temperature, saturation, contrast),
  and **Lumen** quality overrides (final gather quality, reflection quality) for hero shots.
- Vignette/film grain only if the user asked for a stylized look.

## Pitfalls

- **Setting a param the parent does not expose** — silently no-ops. If a value will not stick,
  the parent Material lacks that Parameter node.
- **sRGB 0-255 colors in a vector param** — everything blows out white. Vector params are LINEAR
  0-1 float4.
- **Wrong intensity unit** — a PointLight at "5" is invisible if the unit is candelas; "5000" is a
  supernova if the unit is EV. Read `Intensity Units` first.
- **Editing the parent Material for one actor** — recompiles shaders and changes every user of it.
- **Blaming your call when auto-exposure ate the change** — lock exposure before judging intensity.
- **Forgetting the SkyLight recapture** after changing the sky/sun — ambient stays stale unless
  Real Time Capture is on.

## Verification ritual

1. Read back each material instance's parameter values -> confirm scalars/vectors match intent.
2. Confirm the assignment: read the actor's material slot -> it points at your MIC, not the parent.
3. Read back each light's Intensity + unit, color, and rotation, and the fog density / PPV exposure.
4. Report the actual numeric values you read (intensities, roughness, colors), and state plainly
   that you could not visually confirm the render unless a capture tool was available.
