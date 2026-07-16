# Replication: authority before cosmetics

The server owns authoritative gameplay state. Clients send an intent request through a server RPC;
the server validates it, changes replicated state, and clients update presentation from that state.
Use replicated properties for durable state that late joiners need, RPCs for transient commands/events,
and RepNotify only when a client must react to a changed value. Do not use multicast RPCs as a
replacement for replicated state; a late joiner misses them.

Replicate only necessary actors/components and choose relevancy, dormancy, update frequency, and
conditions intentionally. Keep per-player private data owner-only. Avoid replicating every transform
or UI value manually when CharacterMovement or a purpose-built component already owns prediction and
correction.

Test a listen server and dedicated-server topology with simulated latency/loss before declaring a
feature correct. Inspect role/authority, RPC direction, relevancy, and `NetUpdateFrequency` before
changing serialization. Never trust a client-provided damage, inventory, currency, or target without
server validation.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/networking-and-multiplayer-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/replicate-actor-properties-in-unreal-engine>
