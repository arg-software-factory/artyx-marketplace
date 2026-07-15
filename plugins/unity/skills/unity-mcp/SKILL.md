---
name: unity-mcp
description: Safely drive a connected Unity Editor through MCP for inspection, scenes, GameObjects, assets, C# changes, play-mode checks, and recovery from editor or compilation failures.
---

# Unity Editor MCP workflow

This skill governs a **live, stateful Editor**. Read the connected server's advertised tools and
argument schemas first; MCPForUnity versions expose different names and tool groups. This skill
defines sequencing and evidence, never assumes a private tool exists.

## Safe loop

1. Inspect project info, current scene, hierarchy, console, pipeline, packages, and version.
2. State the intended delta and the exact asset/scene paths that may change.
3. Make one coherent mutation. Use an editor-side batch only when it is idempotent and has a named
   root that it alone owns.
4. Read the changed object/asset back. After C# or shader edits, wait for compilation and inspect
   errors before any dependent mutation.
5. Save explicitly, run one focused smoke test, then report observed state—not intended state.

## Load on demand

| Situation | Read |
|---|---|
| Scene loss, domain reload, scripts, undo, destructive actions | `references/live-editor-safety.md` |
| Serialized properties, C# compilation, tests, diagnosis | `references/scripts-and-validation.md` |

Use `unity-performance-qa` for measurement and `unity-scenes-content` for authored content choices.

## Stop conditions

Stop and ask for direction when the target scene is ambiguous, a migration affects serialized assets,
the bridge exposes no safe readback, or two identical tool failures occur. Never repeatedly enter Play
Mode, reload scenes to “try again,” or delete unowned roots to clean up.

Official server integration varies; inspect its repository and tool schemas before calls. Unity API
baseline: <https://docs.unity3d.com/6000.0/Documentation/ScriptReference/>.
