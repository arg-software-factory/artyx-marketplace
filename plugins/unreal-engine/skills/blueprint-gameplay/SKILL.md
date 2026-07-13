---
name: Blueprint & Gameplay
description: Load when creating or wiring Blueprint actors in a live UE 5.8 editor — class creation, component setup, exposed variables, and simple gameplay via built-in movement components, with an explicit map of what the MCP surface can reach vs. the event-graph work you must hand to the human.
---

# Blueprints & Simple Gameplay (native UE 5.8 MCP)

**Reach for this when** the task is "make a BP_Door that opens", "create a spinning pickup",
"a Blueprint actor with these components", "expose these variables", or "add movement to this
actor". Assumes the base **Unreal Engine MCP** skill is loaded (discovery-first, cm units,
verify-by-read). Read this boundary FIRST, because Blueprints are where the native surface is
thinnest.

## The honest boundary (read before you promise anything)

Epic's DOCUMENTED shipping toolsets (`SceneTools`, `ActorTools`, `MaterialInstanceTools`,
`ObjectTools`) do not name a Blueprint graph tool. Community sessions on UE 5.8 report SOME
Blueprint reach (creating classes / functions, "Editor Toolset" recommended for Actor/Blueprint
control), but **visual event-graph authoring — placing BeginPlay/Tick nodes, wiring pins, writing
function bodies — is not a confirmed MCP capability.** So:

- **Structural work is often reachable**: create a Blueprint class, add components, set component &
  class-default properties, add exposed variables, compile, spawn instances.
- **Graph logic is usually NOT reachable via MCP.** When it is not, you do the structural work and
  hand the human an exact node recipe (see the handoff pattern below). Do NOT fabricate a
  graph-wiring tool to make a recipe "work."

Always resolve this per session: `list_toolsets`, then `describe_toolset` on any Blueprint/asset
toolset that appears. What it returns is the truth; this skill only tells you what to look for.

## Discover your Blueprint surface

```
list_toolsets                          # look for a Blueprint / asset / class toolset
describe_toolset {name:"<that toolset>"}  # exact create/add-component/add-var/compile tool names
describe_toolset {name:"ObjectTools"}     # generic set-property for component & CDO defaults
```

You want tools shaped like: create-blueprint (parent class + path/name), add-component (class +
name + parent/attach), set-property (component or class default), add-variable (name + type +
default + flags), and compile. Confirm the real names before calling — the doc example is a Python
`tool_call` signature, not a promise of a specific MCP tool.

## Create -> components -> defaults -> variables -> compile -> spawn

Order matters; each is a separate call. Name deterministically (`BP_Spinner`, `BP_Door`).

1. **Create the class.** Parent is a real class path: `/Script/Engine.Actor`,
   `/Script/Engine.Pawn`, `/Script/Engine.Character`, or a project BP. Store it under `/Game/Blueprints`.
2. **Add components**, each by class, attached under the root:
   - `StaticMeshComponent` (set its mesh: `/Engine/BasicShapes/Cylinder.Cylinder`), transform in cm.
   - Built-in behavior components (see next section) instead of graph logic where possible.
3. **Set defaults** on components and the class CDO via the property tool (mesh, material, collision,
   physics `Simulate Physics`+`Mass`, light `Intensity`).
4. **Add exposed variables**: give a name + type; mark **Instance Editable** (public, per-instance
   override in the level) and **Expose on Spawn** if a spawner should pass it in. A variable with no
   Instance-Editable flag is invisible to level designers.
5. **Compile.** An uncompiled Blueprint runs the OLD logic silently — always compile after structural
   edits, then check for reported errors.
6. **Spawn an instance** into the level and verify.

## Prefer built-in movement components over graph wiring

The cleanest MCP-friendly gameplay uses Epic's built-in components, which are pure property setup —
no event graph, so they are reachable through the component + property tools:

- **RotatingMovementComponent** — continuous rotation. Set `RotationRate = [Roll,Pitch,Yaw]` deg/sec
  (e.g. `[0,0,90]` spins 90 deg/s around Z). This is the correct way to make a "spinning pickup"
  WITHOUT a Tick node.
- **ProjectileMovementComponent** — velocity + gravity + bounce for thrown/launched actors.
- **FloatingPawnMovement** / **RotatingMovementComponent** on a Pawn for simple kinematic motion.
- **InterpToMovementComponent** — lerp between control points (a platform/elevator path) via
  properties only.

If the desired behavior maps to one of these, you can deliver a working gameplay actor entirely
through MCP. If it needs branching logic, input handling, or custom events, you hit the boundary.

## The human-handoff pattern (when graph logic is unreachable)

Do the reachable part, then hand the human a precise, minimal node recipe — not "open the graph and
figure it out":

> BP_Door: I created the class, added a StaticMeshComponent (mesh set), and an exposed
> `OpenAngle` (float, Instance Editable, default 90) and `bIsOpen` (bool). The open animation needs
> event-graph work I can't do over MCP. In the Event Graph, please: add a Custom Event `ToggleDoor`
> -> Timeline `DoorCurve` (0->1 over 1s) -> Update pin drives a `Lerp (Rotator)` from `[0,0,0]` to
> `[0,0,OpenAngle]` -> `SetRelativeRotation` on the mesh. Compile. I'll verify the components after.

If a Python/console execution tool DID surface in discovery, you may script structural Blueprint
edits through the `unreal` API — but even Python's Blueprint graph editing is limited; treat node
wiring as human territory unless you verify a tool genuinely does it.

## Pitfalls

- **Forgetting to compile** — the BP silently runs stale logic; your "fix" appears to do nothing.
- **Variables not Instance Editable** — the designer cannot tune them; they look missing in the level.
- **Reaching for Tick/BeginPlay nodes** when a RotatingMovementComponent or ProjectileMovementComponent
  does the job as pure property setup.
- **Wrong parent class** — a pickup that needs a collision/overlap should parent from Actor with a
  trigger component, not a bare Actor with only a mesh.
- **Claiming gameplay works** when you only built structure and the graph is still empty. Say what is
  wired and what you handed off.
- **Component attach order** — add the root/mesh first, then attach children to it, or transforms
  resolve against the wrong parent.

## Verification ritual

1. Read the Blueprint back -> confirm its component list (names + classes) and each exposed variable
   (name, type, default, Instance-Editable flag) exist as intended.
2. Confirm it COMPILED without errors (read the compile result / any error tool).
3. Spawn one instance in the level and read it back -> the components and any RotatingMovement/other
   behavior-component properties are present on the instance.
4. Report exactly what is functional via MCP and what you handed to the human for graph work —
   never imply graph logic exists when it does not.
