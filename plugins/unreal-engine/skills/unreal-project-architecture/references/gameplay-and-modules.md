# Gameplay ownership, modules, and C++/Blueprint seams

## Gameplay Framework ownership

Use **GameMode** for server-only rules and spawning policy; clients do not own or receive it. Put
replicated match-wide state in **GameState**, per-player replicated state in **PlayerState**, local
input/camera/HUD decisions in **PlayerController**, and embodied movement/abilities in a Pawn or
Character. Put reusable behavior on Actor Components. Use GameInstance or Subsystems for services
whose lifecycle is explicitly wider than a map; do not turn them into untyped global state.

Design state changes with authority first: server validates and writes replicated state; clients
request intent through RPCs; presentation reacts to replicated values. Do not make a client-side
widget, Tick, or multicast RPC the source of truth.

## C++ and Blueprint boundary

Implement invariants, data validation, interfaces, native components, and hot paths in C++. Expose
small extension points such as `BlueprintImplementableEvent` for visual/audio hooks and
`BlueprintNativeEvent` when a safe C++ default exists. Prefer `TSubclassOf`, `TSoftObjectPtr`, and
interfaces over hard object references where designers need choices or content loads conditionally.

Avoid large Blueprint inheritance chains. Prefer a stable native base plus components and Data Assets;
use Blueprint child classes for configuration, not hidden core logic. Keep Blueprint Callable APIs
task-oriented and make failure values explicit.

## Module hygiene

Split editor-only code into an Editor module; never let Runtime code depend on it. Put public headers
only where another module must include them, forward-declare in headers, and include concrete types in
`.cpp`. Declare module dependencies in `.Build.cs` at the narrowest visibility: public only when a
public header leaks the dependency. Prefer a project plugin for a reusable feature with clear runtime
and editor modules.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/gameplay-framework-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-modules>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/programming-with-cplusplus-in-unreal-engine>
