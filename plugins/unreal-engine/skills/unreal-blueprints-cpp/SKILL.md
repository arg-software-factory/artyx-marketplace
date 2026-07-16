---
name: unreal-blueprints-cpp
description: Build Unreal Engine 5.6+ gameplay with Blueprints and C++. Use for actors, components, input, communication, collision, movement, gameplay events, network replication, debugging, or choosing a native implementation boundary.
---

# Gameplay with Blueprints and C++

Read [communication-and-components.md](references/communication-and-components.md) for composition
and event flow. For multiplayer or authority-sensitive changes, also read
[replication.md](references/replication.md). Keep Tick as an exception: use events, timers,
movement components, delegates, or state changes first.

## Build loop

1. Put state on its owner and define its authority/replication behavior before making a graph.
2. Compose behavior from components; communicate through interfaces, dispatchers, or typed references
   obtained at a defined lifecycle point.
3. Validate collision channels and input mappings against project settings, not defaults assumed from
   another project.
4. Compile C++, compile Blueprints, test in PIE with the required player count, then use logs,
   breakpoints, Gameplay Debugger, and network emulation to diagnose the real path.
