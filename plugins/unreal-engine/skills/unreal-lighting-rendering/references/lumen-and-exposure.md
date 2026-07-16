# Lumen-era lighting and exposure discipline

Lumen provides dynamic global illumination and reflections in supported UE5 configurations; it is not
a substitute for sensible scene scale, surface detail, mesh setup, or platform qualification. Start
with one Directional Light for sun/moon, Sky Atmosphere and Sky Light for environment contribution,
and controlled local lights. Decide whether the Sky Light is real-time captured and avoid duplicate
sun/sky systems in a map.

Treat exposure as part of the shot. Auto exposure can hide a lighting error or make intensity changes
appear ineffective. For deterministic comparison, use a Post Process Volume with an explicit exposure
range or locked EV100, then tune light intensity in the proper units. Re-enable adaptive exposure only
after validating the transition range. Color grading, bloom, lens effects, fog, and volumetrics should
support the lighting hierarchy rather than compensate for absent key/fill separation.

Check reflection, shadow, translucency, foliage, thin geometry, emissive, and rapid camera movement
in the intended renderer. Lumen, Virtual Shadow Maps, and Nanite have configuration/platform limits;
use the project documentation and target-device profiling rather than an assumed universal quality
setting.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-global-illumination-and-reflections-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/auto-exposure-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/post-process-effects-in-unreal-engine>
