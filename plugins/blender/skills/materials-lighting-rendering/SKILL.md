---
name: Materials, Lighting & Rendering
description: Load when authoring look-dev in a live Blender session — Principled BSDF PBR recipes (metal/glass/emission/toon) built as node trees via bpy, world HDRI vs sun+sky, a three-point lighting recipe with real energy values, color management (AgX/Filmic), the Eevee-vs-Cycles decision, and render-settings presets for fast previews vs finals.
---

# Materials, Lighting & Rendering (live Blender)

**Reach for this when** the task is "make it look like metal/glass/plastic", "light this scene", "set up the render", or "why does it look flat/blown-out". Assumes the base **Blender MCP** skill: inspect, mutate in small `execute_python` calls (assign `result`), re-derive datablocks from `bpy.data` each call, verify assignments after every write, end with `get_scene_info`. No screenshot tool — verify by reading back socket values, light energies, engine/view-transform settings, and material assignments. You may render a PNG to disk for the human, but you cannot see it; never assert a look you didn't set numerically.

## Socket-name caveat (Blender 4.x renamed Principled inputs)

`Base Color`, `Metallic`, `Roughness`, `IOR`, `Alpha`, `Normal` are stable. Renamed in 4.x: `Emission`→**`Emission Color`** (+`Emission Strength`), `Transmission`→**`Transmission Weight`**, `Subsurface`→**`Subsurface Weight`**, `Specular`→**`Specular IOR Level`**, `Sheen`→**`Sheen Weight`**, `Clearcoat`→**`Coat Weight`**. Access defensively so recipes survive both:

```python
def sock(bsdf, *names):        # first input that exists, across 4.x renames
    return next(bsdf.inputs[n] for n in names if n in bsdf.inputs)
```

## PBR recipes (Principled BSDF node trees)

```python
import bpy
def new_mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    return m, m.node_tree.nodes["Principled BSDF"]
m, b = new_mat("Metal_Steel")               # BRUSHED METAL — metallic=1, mid roughness
b.inputs["Base Color"].default_value = (0.56, 0.57, 0.58, 1)
b.inputs["Metallic"].default_value = 1.0; b.inputs["Roughness"].default_value = 0.35

m, b = new_mat("Glass_Clear")               # GLASS — transmission=1, low roughness, IOR 1.45
b.inputs["Roughness"].default_value = 0.02; b.inputs["IOR"].default_value = 1.45
sock(b, "Transmission Weight", "Transmission").default_value = 1.0

m, b = new_mat("Emit_Warm")                 # EMISSION — strength drives glow/light contribution
sock(b, "Emission Color", "Emission").default_value = (1.0, 0.6, 0.2, 1)
b.inputs["Emission Strength"].default_value = 8.0
result = {"materials": [x.name for x in bpy.data.materials]}
```

**Toon / NPR** isn't Principled — chain **Diffuse BSDF → Shader to RGB (Eevee only) → Color Ramp (`CONSTANT` interp = hard bands) → Emission**:

```python
import bpy
m = bpy.data.materials.new("Toon"); m.use_nodes = True
nt = m.node_tree; n, l = nt.nodes, nt.links
out = next(x for x in n if x.type == 'OUTPUT_MATERIAL')   # keep output, drop the default BSDF
for x in list(n):
    if x is not out: n.remove(x)
dif = n.new("ShaderNodeBsdfDiffuse"); s2r = n.new("ShaderNodeShaderToRGB")   # s2r Eevee-only
ramp = n.new("ShaderNodeValToRGB"); ramp.color_ramp.interpolation = 'CONSTANT'
emit = n.new("ShaderNodeEmission")
l.new(dif.outputs["BSDF"], s2r.inputs["Shader"]); l.new(s2r.outputs["Color"], ramp.inputs["Fac"])
l.new(ramp.outputs["Color"], emit.inputs["Color"]); l.new(emit.outputs["Emission"], out.inputs["Surface"])
result = {"toon_nodes": [x.bl_idname for x in n]}
```

Assign with `obj.data.materials.append(mat)` — verify via `[s.name for s in obj.data.materials]`.

## World: HDRI vs sun+sky

- **HDRI** — realistic image-based lighting + reflections in one node. Best for product/hero look-dev.
- **Sky Texture (Nishita)** — physically-based sun+atmosphere, `sun_elevation`/`sun_rotation` drive time of day. Best for outdoor/environment.

```python
import bpy; scene = bpy.context.scene
world = bpy.data.worlds.new("World"); scene.world = world; world.use_nodes = True
nt = world.node_tree; bg = nt.nodes["Background"]
# HDRI path? -> env = nt.nodes.new("ShaderNodeTexEnvironment"); env.image = bpy.data.images.load("/abs/studio.hdr")
#              nt.links.new(env.outputs["Color"], bg.inputs["Color"])
sky = nt.nodes.new("ShaderNodeTexSky"); sky.sky_type = 'NISHITA'; sky.sun_elevation = 0.35  # no file needed
nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
result = {"world": world.name}
```

## Three-point lighting recipe (real values)

Key (dominant, ~45° off camera), Fill (soft, opposite, ~1/3 key), Rim/back (separation from background). Area lights read soft; sizes matter.

```python
import bpy
def add_light(name, ltype, energy, loc, size=1.0, color=(1,1,1)):  # AREA=soft, size matters
    ld = bpy.data.lights.new(name, type=ltype); ld.energy = energy; ld.color = color
    if ltype == 'AREA': ld.size = size
    o = bpy.data.objects.new(name, ld); o.location = loc; bpy.context.scene.collection.objects.link(o); return o
key  = add_light("Key",  'AREA', 1000, ( 4, -4, 5), size=2.0, color=(1.0,0.96,0.9))
fill = add_light("Fill", 'AREA', 300,  (-5, -2, 3), size=3.0, color=(0.9,0.95,1.0))
rim  = add_light("Rim",  'SPOT', 600,  ( 0,  5, 4))
result = {"lights": [(o.name, o.data.type, o.data.energy) for o in (key, fill, rim)]}
```

Energy is watts; Area/Point/Spot fall off with distance, Sun uses irradiance (`energy` ~1–5). Blown out? Halve energies before touching exposure.

## Color management (the #1 "looks wrong" cause)

Default view transform is **AgX** (Blender 4.x; filmic highlight rolloff), older is **Filmic**, **Standard** is linear-clipped (usually harsh). Set it explicitly; `look` adds a grade.

```python
import bpy; vs = bpy.context.scene.view_settings
vs.view_transform = 'AgX'; vs.look = 'AgX - Medium Contrast'   # or 'Filmic' / 'Standard'
result = {"view_transform": vs.view_transform, "look": vs.look}
```

## Eevee vs Cycles decision

| Need | Engine |
|------|--------|
| Fast previews, stylized/NPR, Shader-to-RGB toon, iterating on a big scene | **Eevee** |
| Physically-correct GI, caustics, true refraction, heavy transmission/SSS, hero stills | **Cycles** |

The engine enum was renamed: 4.2+ Eevee is `'BLENDER_EEVEE_NEXT'`, older is `'BLENDER_EEVEE'`. Set engine, samples, and output presets robustly in one pass — low samples + `resolution_percentage=50` for previews, high + `100` for finals:

```python
import bpy; scene = bpy.context.scene; r = scene.render
def set_engine(kind):                          # 'EEVEE' | 'CYCLES'
    if kind == 'CYCLES': scene.render.engine = 'CYCLES'; return 'CYCLES'
    for e in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):  # never hard-code; errors on 4.2+
        try: scene.render.engine = e; return e
        except TypeError: continue
eng = set_engine('CYCLES')
if eng == 'CYCLES': scene.cycles.samples = 32; scene.cycles.use_denoising = True   # 256+ final
else: scene.eevee.taa_render_samples = 16                                          # 64+ final
r.resolution_x, r.resolution_y = 1920, 1080
r.resolution_percentage = 50                   # 50 = preview, 100 = final
r.image_settings.file_format = 'PNG'; r.filepath = "/abs/out/preview_"
# bpy.ops.render.render(write_still=True)       # writes a PNG the HUMAN inspects; you can't see it
result = {"engine": eng, "res": [r.resolution_x, r.resolution_y], "pct": r.resolution_percentage}
```

## Pitfalls

- **Renamed 4.x sockets** — `Emission`/`Transmission`/`Specular` throw `KeyError` on 4.x. Use the `sock()` helper (re-paste per call; locals don't persist).
- **Shader to RGB is Eevee-only** — a toon tree using it renders black in Cycles. Pick the engine before the material, and never hard-code `'BLENDER_EEVEE'` (errors on 4.2+) — use the fallback helper.
- **Wrong view transform reads as "bad render"** more often than the lighting does — check `view_transform` first. And fix **blown-out** with energy, not exposure (Area/Point/Spot fall off with distance; Sun does not).
- **Material created but never assigned** — `bpy.data.materials.new` alone shows nothing. Confirm `obj.data.materials` contains it.

## Verification ritual

1. Read back key socket values per material (`Metallic`, transmission, emission strength) and each hero object's `data.materials` slot names — proves the recipe applied and assigned.
2. List lights with `(name, type, energy)`; confirm three-point roles and plausible watts.
3. Report `render.engine`, `view_settings.view_transform`, `render.resolution_*` (the three settings that most change output); final `get_scene_info` → report what you read back, not the intended look. If you rendered a PNG, give the path and flag it visually unverified.
