# Components, events, and Blueprint communication

Prefer composition: an Actor owns durable world identity; Actor Components own reusable behavior;
Scene Components own transforms. Initialize references after their owner/components exist, not through
global actor searches on Tick. Use overlap/hit callbacks, enhanced-input actions, timers, animation
notifies, delegates, or explicit lifecycle events before adding Tick. If Tick is required, disable it
outside active states and avoid allocation, world searches, and repeated casts.

Choose communication by dependency direction:

- Direct typed reference: one known collaborator with a clear lifetime.
- Blueprint/C++ interface: multiple unrelated receiver classes.
- Event dispatcher/delegate: one-to-many notification where the sender should not own listeners.
- Subsystem: scoped service, not arbitrary actor discovery.

Do not cast a generic object repeatedly to discover capability. Store an interface/reference after
validating it. Check `IsValid` around asynchronously destroyed actors and unbind delegates when a
listener's lifecycle ends.

Enhanced Input maps physical inputs to named Input Actions through Mapping Contexts. Add/remove
contexts deliberately per local player and state; gameplay code responds to actions rather than key
names. Use collision profiles/channels as an explicit contract: query-only triggers should not also
simulate physics unless the design needs both.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/blueprints-visual-scripting-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/enhanced-input-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/collision-in-unreal-engine>
