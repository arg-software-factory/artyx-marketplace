# C# edits, serialized contracts, and validation

## C# boundary

Use assembly definitions to express dependency direction: low-level/runtime assemblies must not
depend on presentation or editor assemblies; editor code belongs in an editor-only assembly. Keep
one public entry type per asset-facing script, make the file and `MonoBehaviour` class names match,
and expose only intentional inspector fields with `[SerializeField] private`.

Cache component dependencies in `Awake`; perform cross-object wiring at composition time, not through
repeated `Find*` calls in `Update`. `OnEnable`/`OnDisable` should subscribe/unsubscribe symmetrically.
Use `FixedUpdate` only for Rigidbody physics, and frame-rate independent values with `Time.deltaTime`
or `Time.fixedDeltaTime` as appropriate.

## Verification ladder

1. **Compile:** no Console errors after script, shader, asmdef, or package change.
2. **Serialize:** re-open/read each changed component and asset reference; verify no missing script.
3. **Edit-mode test:** validate pure rules, asset setup, and deterministic generation.
4. **Play-mode smoke:** enter once, exercise the user path, inspect runtime exceptions, exit.
5. **Build/device:** when platform behavior matters, build the target player and capture a platform
   log/profile; Editor success is not a shipping guarantee.

Avoid testing private implementation details. Test the observable contract at seams: input produces a
command, a factory produces owned objects, an Addressables lease is released, a navigation query
returns a reachable result.

## Official sources

- Unity Manual: [Script compilation](https://docs.unity3d.com/6000.0/Documentation/Manual/script-compilation.html)
- Unity Manual: [Assembly definitions](https://docs.unity3d.com/6000.0/Documentation/Manual/ScriptCompilationAssemblyDefinitionFiles.html)
- Unity Scripting API: [MonoBehaviour execution order](https://docs.unity3d.com/6000.0/Documentation/Manual/ExecutionOrder.html)
- Unity Test Framework 1.4: [manual](https://docs.unity3d.com/Packages/com.unity.test-framework@1.4/manual/index.html)
