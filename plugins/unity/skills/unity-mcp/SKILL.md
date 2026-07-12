---
name: Unity MCP
description: Drive a connected Unity MCP server — GameObjects, components, C# scripts, scenes, and play-mode testing with inspect-mutate-verify discipline.
---

# Driving Unity through MCP

You are operating a LIVE Unity Editor session. Unity MCP servers (e.g. CoplayDev/unity-mcp with its MCPForUnity bridge) expose dozens of focused tools; use the exact names/schemas from your tool list (`mcp_` prefix) — this document teaches the strategy, not the tool names.

## 1. Typical tool surface

- **Scene/hierarchy** — open/save scenes, list hierarchy, create/find/modify/delete GameObjects.
- **Components** — add/remove components, get/set serialized properties.
- **Assets** — create/list materials, prefabs, folders; instantiate prefabs.
- **Scripts (C#)** — create/read/edit script files; the editor recompiles on save.
- **Editor control** — enter/exit Play Mode, run tests, read console logs, take screenshots.

READ each tool's schema before first use — property paths and argument shapes vary. Component properties use serialized names (`m_Mass`, or dotted paths like `material.color`) on some servers and friendly names on others; when a set-call claims success, ALWAYS read the property back.

## 2. The loop

1. **Inspect** — get the scene hierarchy before touching anything; note existing cameras/lights.
2. **One concern per call** — create the GameObject; then add components; then set properties; then parent it. Batched mega-calls fail opaquely.
3. **Verify each write with a read** — especially transform values and component properties (silently-clamped/ignored values are common).
4. **Console is your stderr** — after script edits or play-mode actions, read the Unity console for compile errors BEFORE proceeding. A compile error freezes the whole editor tool surface until fixed.
5. **Name deterministically** — `Player`, `Enemy_01`, `UI_HealthBar`; read back final names (Unity appends `(1)` on duplicates).

## 3. Coordinates, units, conventions

- Meters, **Y is up**, left-handed, rotations in degrees (Quaternion under the hood — set eulerAngles).
- New GameObjects spawn at origin; a "floor" is usually a scaled Plane (default Plane = 10×10m at scale 1) or a scaled Cube.
- 2D projects: Z is depth/layering; sprites face -Z camera.

## 4. C# script workflow

1. Create the script asset with the EXACT class name = file name (Unity requirement for MonoBehaviours).
2. Wait/recompile: after any script write, read the console; fix compile errors before attaching.
3. Attach the component to its GameObject, then set serialized fields.
4. Test in Play Mode: enter play, read console for runtime logs/exceptions, exit play. **State changes made DURING Play Mode are reverted on exit** — never do authoring work in play mode.

Script idioms that avoid common breakage: cache `GetComponent` in `Awake`; use `[SerializeField] private` fields for anything you'll set from MCP; guard `Update` logic with null checks; prefer `Time.deltaTime`-scaled motion.

## 5. Scene building recipe

(a) Verify a camera + directional light exist (default scene has both; an empty one doesn't), (b) ground plane, (c) hero objects with materials (URP: use the `Universal Render Pipeline/Lit` shader; built-in: `Standard` — query the project's pipeline first if the server exposes it, or create one material and read back its shader), (d) light intensity ~1 for directional, point lights 2–5 with sensible range, (e) position the camera to frame the composition (e.g. pos (0, 3, -8), rot (15, 0, 0)), (f) save the scene, (g) report the final hierarchy.

## 6. Failure recovery

- `Component not found` → wrong serialized name; fetch the component's property list if the server has such a tool, else read the object's full info.
- Script tool succeeded but behavior unchanged → console has a compile error; read it.
- Play-mode tools hang → domain reload in progress; wait one call (a cheap read), then retry once.
- Two identical failures → STOP, re-read the tool schema, `web_search` the exact error with "unity mcp" before retrying.
