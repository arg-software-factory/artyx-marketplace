---
name: pbr-texture-sets
description: Name, pack, color-manage, and compress PBR texture sets (base color, normal, roughness, metallic, ambient occlusion, emissive, height) for Unity URP/HDRP, Unreal, Godot, glTF, and Blender. Use when exporting from a baker or texturing tool, when channel-packing ORM or mask maps, when a normal map looks inverted, when roughness looks wrong, or when setting import and compression settings.
---

# PBR texture sets

## Naming

One set per material, one suffix per map, no spaces:

```
T_<Asset>_<Variant>_<Map>.png      e.g. T_Crate_Worn_BC.png
```

| Suffix | Map | Color space |
|---|---|---|
| `BC` | Base color (albedo), no lighting or AO baked in | sRGB |
| `N` | Tangent-space normal | Linear (non-color) |
| `ORM` | R = Occlusion, G = Roughness, B = Metallic | Linear |
| `MASK` | Unity HDRP mask map (see below) | Linear |
| `E` | Emissive | sRGB |
| `H` | Height / displacement | Linear |
| `A` | Opacity, when not in base color alpha | Linear |

Keep the same names across engines; only the packing changes.

## Channel packing per target

| Target | Packing |
|---|---|
| **glTF 2.0** | `metallicRoughnessTexture`: G = roughness, B = metallic. `occlusionTexture` reads R, so one ORM file can serve both. |
| **Unreal** | ORM (R = AO, G = roughness, B = metallic) by convention; wire channels in the material. |
| **Godot 4** | `ORMMaterial3D` takes one ORM texture (R = AO, G = roughness, B = metallic). `StandardMaterial3D` takes separate maps with a channel selector. |
| **Unity URP Lit** | Metallic map: R = metallic, **A = smoothness**. Smoothness = 1 - roughness. Occlusion is a separate map (G channel is read). |
| **Unity HDRP Lit** | Mask map: R = metallic, G = AO, B = detail mask, **A = smoothness** (1 - roughness). |
| **Blender** | Separate Image Texture nodes; for a packed ORM use Separate Color and feed each channel; set packed and data maps to Non-Color. |

Inverting roughness to smoothness is the most common Unity mistake. Do it in
the packing step, not in the shader.

## Normal maps

- **OpenGL (Y+):** Blender, Unity, Godot, glTF.
- **DirectX (Y-):** Unreal. Flip the green channel on export, or tick
  "Flip Green Channel" on the Unreal texture.
- Bake in MikkTSpace against the triangulated low poly you export.
- Never store a normal map as sRGB or with color compression meant for albedo.

## Formats and compression

- Author and ship source files as 8-bit PNG (16-bit for height and for normals
  with smooth gradients). Keep layered source files out of the game folder.
- Power-of-two sizes, square when possible; generate mipmaps.
- Engine compression: BC7 (color, ORM), BC5 (normals) on desktop/console;
  ASTC on mobile and standalone VR. In Unreal set Compression Settings to
  `Normalmap` for normals and `Masks (no sRGB)` for ORM. In Unity set Texture
  Type to Normal map for normals and untick sRGB for data maps.
- Base color values stay physically plausible: no pure black below about
  30/255 sRGB, no pure white above about 240/255, metals get their color from
  base color with metallic = 1.

## Check

Load the set on a neutral lit sphere and on the asset in the target engine:
bumps go outward, metals look metallic only where metallic is 1, and rough
areas are rough (not inverted).
