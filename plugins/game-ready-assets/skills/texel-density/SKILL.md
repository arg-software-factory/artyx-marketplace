---
name: texel-density
description: Choose, compute, and verify texel density (pixels per meter) so textures look equally sharp across game assets, and pick texture resolutions from it. Use when deciding a texture size for an asset, when one asset looks blurrier or sharper than its neighbors, when scaling UV shells, or when setting a project-wide density standard for Unity, Unreal, Godot, or Blender.
---

# Texel density

Texel density is texture pixels per unit of surface, written in **px/m**
(Unreal teams often use px/cm; 1 px/cm = 100 px/m). One density for every asset
seen at the same distance keeps the world consistent.

## Pick a target

| Camera and platform | Typical target |
|---|---|
| First-person, PC / current console | 1024 px/m (10.24 px/cm) |
| Third-person, PC / current console | 512 px/m (5.12 px/cm) |
| Top-down / strategy | 256 px/m |
| Mobile and standalone VR | 256-512 px/m |
| Hero asset seen up close (weapon in hand, face) | 2x the scene target |
| Distant background | 0.5x or less |

These are common starting points. The project's standard wins, and it should be
written down once and reused.

## Compute it

```
density (px/m) = texture_size_px * sqrt(uv_area_fraction / surface_area_m2)
```

- `uv_area_fraction`: share of the 0-1 UV square the shells cover (0-1).
- `surface_area_m2`: real surface area of those faces, at final scale.

Quick sizing: a surface of about `W x H` meters needs about
`W * density` by `H * density` pixels of unique texture. One 2 m x 2 m face at
512 px/m needs 1024 x 1024 px. A whole 2 m crate has six such faces (24 m2), so
unwrapped uniquely it needs about 2K or more; mirror or stack identical faces,
or use a tiling material, to stay at 1K.

In Blender, check with a checker texture of known size and measure one shell,
or use a texel-density add-on. Scale all shells of an asset by the same factor
so their densities stay equal.

## Choose the texture size

1. Compute the pixels needed from the surface area and the target density.
2. Round **up** to a power of two (512, 1024, 2048, 4096). Non-power-of-two
   textures lose mip-mapping or compression on some platforms.
3. If the result is 4K+ for a regular prop, split into trim sheets or tiling
   materials instead of one unique map.
4. Mobile: stay at 1K or below for most props; 2K only for heroes.

## Verify

- Checker texture: squares are the same size on this asset and on its
  neighbors in the engine, at the gameplay camera distance.
- No shell is scaled up just because there was free UV space. Wasted space is
  cheaper than a density jump the player notices.
- Mirrored or stacked shells count once, which is why they save density.
- Report: target density, measured density, and texture size per map.
