# Runtime animation architecture

An Animation Blueprint evaluates pose logic; keep it data-driven and inexpensive. Feed it stable
movement variables (speed, acceleration, grounded state, movement direction, gameplay tags/state)
from the owning character rather than querying the world repeatedly in transition rules. Use a state
machine for durable locomotion phases, blend spaces for continuous movement ranges, layered blends or
slots for upper-body overlays, and montages for discrete authored actions such as attacks, reloads, or
interactions.

Use Animation Notifies for effects, audio, hit windows, and footstep timing, but let authoritative
gameplay validate damage and state. Handle montage interruption, section jumps, and end callbacks;
never assume a notify will fire after an interrupt. For networked characters, make gameplay state
authoritative and allow animation to present it predictably.

Control Rig is for procedural/editor/runtime rig evaluation and Sequencer authoring. Keep controls
and graph logic versioned with the skeleton; profile it in the actual character count before using
complex per-frame solves broadly.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-blueprints-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-montage-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/control-rig-in-unreal-engine>
