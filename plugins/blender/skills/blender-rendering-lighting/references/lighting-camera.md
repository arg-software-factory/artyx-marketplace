# Camera, lighting, and color management

## Camera and composition

Set sensor fit, focal length, camera position, and framing from the narrative requirement. Wider lenses exaggerate depth; longer lenses compress it. Correct composition by moving/reframing the camera before distorting the lens. Use depth of field only when focus target, aperture, and render samples support it; shallow DOF can hide asset defects and increase noise.

## Light behavior

Area-light size controls softness; distance and inverse-square falloff determine intensity for point/area/spot sources. A Sun is directional and does not fall off by distance. Start with a motivated key, then add fill only to recover needed information and rim/separation only when it clarifies silhouette. Measure exposure with neutral assets; avoid compensating blown lights with arbitrary color grades.

## Color

Blender 4.5's default AgX view transform provides highlight rolloff. Set the view transform explicitly for a project and grade only after it is fixed. Keep scene-linear lighting/material values physically plausible; use the compositor or look for presentation changes. Verify display-referred output on the destination medium and preserve intended alpha.

## Official sources

- [Cameras](https://docs.blender.org/manual/en/4.5/render/cameras.html)
- [Lights](https://docs.blender.org/manual/en/4.5/render/lights/index.html)
- [Color management](https://docs.blender.org/manual/en/4.5/render/color_management.html)
