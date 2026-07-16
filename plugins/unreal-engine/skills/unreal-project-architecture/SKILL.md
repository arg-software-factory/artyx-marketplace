---
name: unreal-project-architecture
description: Design or refactor a maintainable Unreal Engine 5.6+ project. Use for Gameplay Framework choices, C++ versus Blueprint boundaries, modules, plugins, Data Assets, asset ownership, input, or scalable project structure.
---

# Unreal project architecture

Use C++ for durable engine-facing systems, performance-sensitive loops, interfaces, replication
rules, and reusable components. Use Blueprints for composition, asset-specific tuning, UI flow, and
designer-authored sequences. Read [gameplay-and-modules.md](references/gameplay-and-modules.md) for
the ownership model and [data-and-assets.md](references/data-and-assets.md) for content boundaries.

## Design procedure

1. Name the authoritative owner of every state transition (GameMode, GameState, PlayerState,
   PlayerController, Pawn/Character, ActorComponent, or subsystem).
2. Define the C++ contract first: narrow `UFUNCTION`/`UPROPERTY` seams and interfaces; expose only
   designer-tunable data to Blueprints.
3. Choose Data Assets/Data Tables for immutable definitions and SaveGame/runtime state separately.
4. Place dependencies in the smallest module or plugin that owns them; avoid circular includes and
   level-specific assumptions in gameplay code.
5. Validate PIE, standalone, and packaged behavior where authority or asset loading differs.
