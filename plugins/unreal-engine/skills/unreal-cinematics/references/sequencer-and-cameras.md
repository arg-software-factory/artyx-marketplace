# Sequencer, bindings, and camera continuity

A Level Sequence stores bindings and tracks over a frame range at a display rate. A **possessable**
binds an existing level actor; a **spawnable** is owned by the sequence for its playback lifetime.
Choose deliberately: possessables suit shared set actors, while spawnables make a shot self-contained.
The Camera Cut track determines the active camera. An animated Cine Camera without a camera cut is not
automatically the rendered view.

Use folders, shot/subsequence structure, and stable naming to separate editorial timing from local
animation. Add transform/property tracks only for properties a shot owns. Avoid competing gameplay or
Blueprint ownership while a sequence controls the same property; decide which system wins at runtime.
For character work, Control Rig and animation tracks should have clear layering and blend intent.

Use Cine Camera settings intentionally: focal length controls perspective/framing, aperture controls
depth-of-field, and focus method/distance must be checked at the shot's actual marks. Preview cuts at
real playback speed, inspect interpolation around holds, and leave handles for editorial changes.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/cinematics-and-movie-making-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/how-to-make-movies-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/sequencer-track-list-in-unreal-engine>
