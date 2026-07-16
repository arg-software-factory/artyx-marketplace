# AI Navigation and path validation

## Navigation ownership

Use the installed AI Navigation package when its components match the project's version. A
`NavMeshSurface` defines which geometry and layers contribute; an agent defines radius, height, step
height, slope and area mask; a link expresses an intentional discontinuity. These values are part of
level design: a mesh that looks walkable may be unreachable for a particular agent.

Choose static baked navigation for stable geometry. When generated/changing content requires runtime
updates, bound the affected surface and update schedule; rebuilding a whole world for a moving prop is
usually the wrong architecture. Use `NavMeshObstacle` carving only where its update cost and behavior
are understood. Ensure procedural chunks build/unload their navigation with the same lifetime as their
visual/collision geometry.

## Validation

After bake/update, sample source and destination on the intended NavMesh, calculate a path, and inspect
status/corners rather than trusting an agent's movement. Test narrow passages at agent radius, slopes,
off-mesh links, unloaded chunks, dynamic blockers, multiple agent types, and recovery when the target
is not on a valid surface. Agents should receive destinations only after the relevant scene/chunk and
NavMesh data are available.

Profile query/path frequency; cache/replan on meaningful changes instead of recalculating every frame.
For gameplay authority, distinguish “no complete path exists” from “agent has not yet reached target.”

## Official sources

- Unity Manual: [AI Navigation](https://docs.unity3d.com/6000.0/Documentation/Manual/com.unity.ai.navigation.html)
- Unity Scripting API: [NavMesh](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/AI.NavMesh.html)
- Unity Scripting API: [NavMeshAgent](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/AI.NavMeshAgent.html)
- Unity Manual: [AI Navigation](https://docs.unity3d.com/6000.0/Documentation/Manual/com.unity.ai.navigation.html)
