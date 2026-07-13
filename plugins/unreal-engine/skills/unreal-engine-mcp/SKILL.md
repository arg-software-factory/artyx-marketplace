---
name: Unreal Engine MCP
description: Load this before driving a connected Unreal Editor — actors, Blueprints, level composition, editor control. UE MCP servers silently no-op on bad input more than any other DCC; this skill's list-first, verify-every-write, compile-then-spawn discipline is what makes a build actually stick.
---

# Driving Unreal Engine through MCP

You are operating a LIVE Unreal Editor session. Community UE MCP servers (e.g. chongdashu/unreal-mcp, kvick UnrealMCP) are EXPERIMENTAL: they differ in tool names and silently no-op on bad input more often than Blender. Compensate with tighter verification.

## 1. Discover before you act

Your available UE tools are in your tool list with an `mcp_` prefix. Typical categories:

- **Actor tools** — spawn/delete actors (StaticMeshActor, lights, cameras), set transform, list/find actors, get properties.
- **Blueprint tools** — create Blueprint classes, add components (mesh/camera/light), set component properties/physics, compile, spawn instances.
- **Node tools** — add event nodes (BeginPlay/Tick), function calls, variables, wire pins.
- **Editor tools** — viewport focus, camera placement, sometimes console commands / screenshots.

READ each tool's parameter schema from its description before first use — argument names vary between servers (`actor_name` vs `name`, `location` array vs xyz fields). Do not guess: a wrong argument often creates a mis-named actor instead of erroring.

## 2. The loop (stricter than Blender)

1. **List first** — enumerate level actors before mutating; UE levels are rarely empty (floor, PlayerStart, SkyLight...).
2. **One actor/Blueprint per call** — never batch unrelated spawns in one call.
3. **Verify EVERY write with a read** — spawn → find-by-name → check transform actually matches. UE MCP servers are the most likely to accept a call and do nothing; the read-back is the only truth.
4. **Name deterministically** — `BP_Enemy_01`, `SM_Crate_03`. You will need these exact names to find/modify later; UE auto-suffixes duplicates, so read back the FINAL name after spawn and use that.
5. **Compile after Blueprint graph edits** — an uncompiled Blueprint silently runs the old logic. Compile, then check for reported errors.

## 3. Coordinate system & units

- Units are **centimeters** (Blender/Unity use meters — multiply by 100 when porting dimensions).
- **Z is up**, X forward, **left-handed**. Rotations in degrees (Roll=X, Pitch=Y, Yaw=Z).
- Ground floor is usually at Z=0; spawn actors with Z ≥ half their height or they clip through.

## 4. Blueprint workflow

Order matters, and each step is a separate tool call:

1. Create the Blueprint class (parent: Actor / Pawn / Character).
2. Add components (StaticMesh, Camera, PointLight...) — set the mesh asset path with UE notation: `/Game/Path/Asset.Asset` (engine assets: `/Engine/BasicShapes/Cube.Cube`).
3. Set properties (physics: simulate + mass; light: intensity in candelas for point/spot).
4. Add graph nodes (events → function nodes → connect pins by exact pin names — read them from node info responses).
5. **Compile.** 6. Spawn an instance. 7. Verify with a find/get call.

## 5. Level composition recipe

For "build a scene/level": (a) confirm floor exists or spawn one (scaled cube works: scale 20,20,0.5 at Z=-25), (b) hero actors with varied Yaw so nothing is axis-aligned, (c) lighting: DirectionalLight (sun, intensity ~10 lux-scale) + SkyLight for ambient + accent Point/Spot lights (~5000cd), (d) camera or viewport focus on the composition, (e) final actor list + transforms read-back as your report.

## 6. Failure recovery

- A tool result that echoes your input without an ID/confirmation is a SUSPECT no-op — verify by listing actors.
- `Asset not found` → the asset path notation is wrong; engine primitives live at `/Engine/BasicShapes/*.{Cube,Sphere,Cylinder,Cone,Plane}`.
- Blueprint node connection failures → fetch the node list to get real node GUIDs/pin names; never invent pin names.
- Two identical failures → STOP; re-read the tool schema, then `web_search` the exact error with "unreal mcp" before retrying.
- If the connection drops mid-task (editor recompile/PIE), tell the user to check the UnrealMCP plugin is still listening (default TCP 55557) rather than retrying blindly.
