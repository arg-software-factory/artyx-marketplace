---
name: unity-mcp
description: >-
  Operate a connected Unity Editor professionally through MCP: inspect first, make
  reversible edits, compile, test, and verify the saved result.
---

# Unity MCP Operator Playbook

You are controlling a live Unity 6 Editor through Unity's official MCP relay. It is a
local authoring interface, not a substitute for source control or a build pipeline. Use
only the tools advertised by the connected server; the relay can target a specific project
or editor instance, and tools can vary with Unity/package version.

## Session contract

1. Confirm the target Unity instance, project, Unity version, active scene, and whether the editor is in Play Mode.
2. Read the hierarchy, scene path, and Console before changing anything. Identify the rendering pipeline before creating materials or shaders.
3. State a small plan. Perform one concern per operation: create/find an object, add a component, set fields, then parent or save it.
4. Read the affected object, component, or asset back after each write. A successful tool response alone is not proof that Unity serialized the intended value.
5. Save the scene and report the changed assets, test result, and remaining Console errors.

Never delete, replace, reimport, or bulk-edit project assets without confirming the exact scope. When an editor tool exposes Undo, use it for discrete mutations; never assume it exists.

## Scene and asset work

- Use deterministic names (`Player`, `Enemy_01`, `UI_HealthBar`) and verify Unity did not suffix a duplicate.
- Unity uses meters, Y-up, and degrees in Inspector-facing Euler rotations. Do not infer gameplay scale: inspect existing units, layers, tags, input, physics settings, and prefabs first.
- Preserve existing cameras, lights, EventSystems, and render-pipeline assets unless the task explicitly changes them. For a new material, inspect the project's pipeline and verify the assigned shader after creation.
- Treat prefab instances carefully: identify whether an edit targets the instance, an override, or the source prefab before writing. Re-read the target afterward.
- Save authoring work in Edit Mode. Play Mode is for verification; do not rely on edits made there to persist after exit.

Unity's [scene workflow](https://docs.unity3d.com/Manual/scenes-working-with.html) is the source of truth for opening and saving scenes.

## C# workflow

1. Inspect the existing assembly definitions, namespaces, and nearby scripts before creating a new class.
2. Make the MonoBehaviour file name and class name match. Make external configuration explicit with `[SerializeField] private` fields of Unity-serializable types.
3. Write the smallest coherent edit. After every file change, wait for Unity to compile and read the Console. Fix compile errors before attaching or testing the component.
4. Attach the script only after compilation succeeds. Set fields through the tool schema, then read them back from the component.
5. Run a focused test or a short Play Mode check, collect Console output, exit Play Mode, and save in Edit Mode.

Unity serializes public fields and non-public fields marked `[SerializeField]`; it does not serialize C# properties or static fields. See Unity's official [SerializeField reference](https://docs.unity3d.com/ScriptReference/SerializeField.html) and [code-reloading guidance](https://docs.unity3d.com/Manual/code-reloading-editor.html).

## Verification standard

- **Hierarchy/component change:** read back the GameObject path, component list, and changed serialized values.
- **Visual change:** inspect the active camera or take a screenshot if the server provides one; report what is and is not visible.
- **Script change:** Console is clean of new compile errors, then run the narrowest relevant test.
- **Runtime change:** enter Play Mode only after compilation, capture runtime logs/errors, exit, and confirm the scene is saved.
- **Build request:** inspect target/platform settings first, run the smallest requested build, and report artifact path plus errors. Never claim a build passed because the MCP call returned.

Use Unity Test Framework's Edit Mode tests for editor/data behavior and Play Mode tests for runtime behavior when applicable. Unity documents both modes in its [Test Framework manual](https://docs.unity3d.com/Manual/com.unity.test-framework.html).

## Recovery

- If a write is rejected or has no effect, re-read the tool schema and object/component data before retrying. Serialized property paths can vary by Unity/package version.
- If tools stop responding after script edits, Unity may be compiling or reloading. Make one cheap read after it settles, then retry once.
- If the connection is absent, check **Edit → Project Settings → AI → Unity MCP Server**:
  Unity Bridge must be Running and the Artyx client must be accepted. Do not replace the
  relay or guess its path; use Unity's generated/official configuration.
- If the Console contains an error, fix the earliest relevant error before continuing; cascading errors make later observations unreliable.
- After two identical failures, stop mutating. Report the tool, arguments, exact error, current scene state, and the smallest safe next diagnostic.

## References

- [Unity MCP setup and relay configuration](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.9/manual/integration/unity-mcp-get-started.html)
- [Unity Package Manager](https://docs.unity3d.com/Manual/upm-ui.html)
- [Unity scene creation, loading, and saving](https://docs.unity3d.com/Manual/scenes-working-with.html)
- [Unity Test Framework](https://docs.unity3d.com/Manual/com.unity.test-framework.html)
