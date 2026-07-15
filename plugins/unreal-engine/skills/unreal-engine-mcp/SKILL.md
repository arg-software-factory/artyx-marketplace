---
name: Unreal Engine MCP
description: Load this before driving a connected Unreal Editor over UE 5.8's NATIVE in-editor MCP server — actors, levels, materials, lighting, verification. The native server hides its real tools behind a list_toolsets -> describe_toolset -> call_tool discovery layer; this skill's discovery-first, inspect -> mutate-small -> verify discipline is what makes a build actually stick.
---

# Driving Unreal Engine through the NATIVE MCP server (UE 5.8+)

You are operating a LIVE Unreal Editor session through Epic's own experimental MCP
plugin (`ModelContextProtocol`, friendly name "Unreal MCP"), shipped inside UE 5.8.
It runs an MCP server *inside the editor process*; Artyx connects to it as a plain
HTTP client. This is NOT the old chongdashu TCP bridge (port 55557) — that is dead.
The native server is HTTP + Server-Sent Events on `http://127.0.0.1:8000/mcp`, loopback
only, no auth, experimental (incomplete surfaces, data formats may change).

## 1. Connection model & the failure checklist

You do not launch anything — a human already has the editor open. If your UE tools are
missing or every call errors, walk this in order and ask the human to fix the first gap:

1. **Plugin enabled** — Edit > Plugins > search "Unreal MCP" > Enabled (this auto-enables
   the "Toolset Registry" plugin, which is where the actual tools live).
2. **Editor restarted** after enabling (Live Coding does not register new tools; a restart
   is required).
3. **Server started** — Edit > Editor Preferences > General > Model Context Protocol >
   *Auto Start Server* ON (default is OFF), or the human runs `ModelContextProtocol.StartServer 8000`
   in the editor console. Confirm port 8000 and URL path `/mcp`.
4. **A project & level are open** — an empty editor with no loaded map has almost nothing to act on.
5. **Client wired** — the human generates the client config with
   `ModelContextProtocol.GenerateClientConfig ClaudeCode` (also supports Cursor, VSCode, Gemini, Codex, All).

If a human adds custom toolsets mid-session, they run `ModelContextProtocol.RefreshTools`
(or restart). Never assume a tool exists because it "should."

## 2. Discovery is not optional — it is step one every session

By default the server runs in **Tool Search mode** (`Enable Tool Search` = true). In this mode
`tools/list` returns only THREE meta-tools, not the real surface:

- `list_toolsets` — returns the available toolset names + descriptions.
- `describe_toolset` — returns the schemas (tool names + exact argument signatures) for one named toolset.
- `call_tool` — dispatches one toolset's tool with arguments and returns the result on the same turn.

**So your real tools are reached via `call_tool`, and you learn their names/args from
`describe_toolset`.** Documented shipping toolsets (Epic): `SceneTools`, `ActorTools`,
`MaterialInstanceTools`, `ObjectTools` — all authored in Python under
`Engine/Plugins/Experimental/ToolsetRegistry/Content/Python/toolset_registry/toolsets/`.
Community sessions also report `MaterialTools` and `AssetTools`. **Epic does NOT publish the
per-tool function names or parameters** — the only source of truth is what `describe_toolset`
returns from THIS editor. Ritual:

```
1. call list_toolsets                      -> pick the toolset(s) your task needs
2. call describe_toolset {name: "ActorTools"}  -> read EXACT tool names + arg schemas
3. call call_tool {... shape exactly as describe_toolset showed ...}
```

The exact argument keys of `call_tool` itself (e.g. how the toolset/tool/args are nested)
are whatever `describe_toolset` and the meta-tool schema show — read them, do not guess.
If the human turned Tool Search OFF, every tool is advertised directly (often `mcp_`-prefixed)
— then TRUST THE TOOL LIST. Either way: **never invent a tool or argument name.** When this
skill teaches a pattern whose exact tool name is unverified, it says "discover the tool via
describe_toolset; it will look like X."

## 3. The loop (stricter than Blender — the native server is young)

1. **Inspect first** — before mutating, read current level state via the read tool you found
   under SceneTools/ActorTools (a list-actors / scene-info shape). UE levels are never empty
   (floor, PlayerStart, SkyLight, fog...).
2. **One logical change per call.** Do not batch unrelated spawns; a partial failure inside a
   batch is hard to unwind.
3. **Verify EVERY write with a read.** Spawn -> read the actor back by name -> confirm the
   transform/property actually took. Experimental tools accept a call and silently no-op more
   than mature DCC servers do; the read-back is the only truth.
4. **Name deterministically** (`SM_Crate_03`, `BP_Spinner`, `Light_Key`). UE auto-suffixes
   duplicate labels — read back the FINAL label after spawn and use exactly that for later edits.
5. **Report what you read, not what you intended.**

## 4. Coordinate system & units (UE facts, independent of MCP)

- Units are **centimeters**. Blender/Godot/Unity author in meters — multiply by 100 when porting
  dimensions (a 2 m crate is `200`).
- **Z is up**, X forward, Y right, **left-handed**. Rotations in degrees: Roll=X, Pitch=Y, Yaw=Z.
- Ground is usually Z=0; spawn an actor with Z >= half its height or it clips through the floor.
- Transforms are location / rotation / scale triples — pass them in whatever field shape
  `describe_toolset` specifies (often float lists `[x,y,z]`).

## 5. The Python / console power lever (discovery-gated — do NOT assume)

The shipping toolsets are AUTHORED in Python, but Epic's documented surface does not confirm a
built-in "run arbitrary Python" tool. (The third-party VibeUE server exposes `execute_python_code`;
the native shipping toolsets as documented do not.) So: at session start, scan `list_toolsets` /
`describe_toolset` for any tool that runs Python or console commands. IF one is present, it is your
`bpy`-equivalent escape hatch — drive the full `unreal` Editor Scripting API through it (the same
API the toolsets are built on) for anything the narrow shipped tools cannot do. If NO such tool
exists in this session, stay inside the discovered toolset tools and hand off genuinely unreachable
work to the human. Never fabricate a python-exec tool to "make the recipe work."

## 6. Failure recovery

- A result that echoes your input with no id/label/confirmation is a SUSPECT no-op — verify by
  reading the actor/scene.
- `describe_toolset` returned a different arg name than you expected -> the doc drifted; obey the
  live schema, not this skill.
- Asset-not-found -> the asset path notation is wrong; engine primitives live at
  `/Engine/BasicShapes/*.{Cube,Sphere,Cylinder,Cone,Plane}`; project assets at `/Game/...`.
- Two identical failures -> STOP; re-run `describe_toolset` for that toolset, then `web_search`
  the exact error with "Unreal MCP ModelContextProtocol 5.8" before retrying.
- Connection drops mid-task (editor recompiling, entering PIE, or the server was stopped) ->
  do not retry blindly; tell the human to confirm the server is still running (StartServer / Auto
  Start) rather than spamming calls.

## 7. End-of-task verification ritual

Finish with a REAL read, never a claim: list the level's actors and read back each hero actor's
transform/properties via the discovered read tool, and report the actual names + values you got.
For anything you handed off to the human (unreachable surface), say so explicitly instead of
implying it is done.
