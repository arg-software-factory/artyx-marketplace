---
name: Unity Project Verification & Performance
description: "Load before handing off any Unity work — the QA loop: read_console error filtering after each mutation, a single play-mode smoke test, run_tests, draw-call/batching + memory hygiene via manage_graphics and manage_profiler, texture import discipline, a scripted missing-reference scanner, and a pre-handoff checklist. Read-only diagnostics only — never destroys scene content."
---

# Project Verification & Performance

Reach for this at the END of a task — or after any risky mutation — to prove the work is actually
correct and shippable, not just "the tool returned success". Everything here is READ-ONLY
diagnostics: it inspects, counts, and profiles; it never deletes scene content (respect the base
`unity-mcp` anti-scene-wipe rule).

## 0. Enable groups

```python
manage_tools(action="activate", group="testing")     # run_tests, get_test_job
manage_tools(action="activate", group="profiling")   # manage_profiler
manage_tools(action="activate", group="scripting_ext")# execute_code (scanners, import settings)
# manage_graphics + read_console are core, already on
```

## 1. Console is your build gate — filter errors after EVERY mutation

A compile error freezes the whole tool surface; a null-ref at play means broken wiring. After any
script write, component add, or generation:

```python
read_console(action="get", types=["error"], format="detailed", include_stacktrace=True)
```
- `types=["error"]` alone first (fast signal); widen to `["error","warning"]` only for the final pass.
- `filter_text="NullReference"` to zero in on a specific failure class.
- Don't re-read a stable compile result more than once (base-skill budget rule).
- `read_console(action="clear")` at the START of a verification pass so you only see NEW messages.

## 2. Play-mode smoke test — exactly once

```python
manage_editor(action="play")
read_console(action="get", types=["error"])            # runtime null-refs, missing bindings
manage_editor(action="stop")
```
One `play`/`stop`. Authoring during play reverts on stop — never build in play mode. If the console
is clean and the scene didn't throw on wake, the smoke test passed.

## 3. Automated tests (run_tests + get_test_job — async)

```python
job = run_tests(mode="EditMode", include_failed_tests=True)   # or PlayMode
# poll — tests run async; get_test_job blocks up to wait_timeout
res = get_test_job(job_id=job["job_id"], wait_timeout=120, include_failed_tests=True)
# res.status: complete | running | failed ; inspect res.results for failures
```
Filter with `test_names`, `group_names` (regex), `category_names`, or `assembly_names` to run a
focused subset during iteration; run the full suite before handoff.

## 4. Draw-call / batching / memory hygiene

Two lenses. `manage_graphics` for rendering counters, `manage_profiler` for CPU/GPU/memory:

```python
manage_graphics(action="stats_get")          # draw calls, batches, tris, verts, set-pass calls
manage_graphics(action="stats_get_memory")   # render memory
manage_graphics(action="pipeline_get_info")  # BuiltIn vs URP vs HDRP + quality level

manage_profiler(action="ping")
manage_profiler(action="get_frame_timing")   # CPU/GPU ms per frame (needs a few play frames)
manage_profiler(action="get_counters", category="Render")
manage_profiler(action="get_counters", category="Memory", counters=["Total Used Memory","GC Used Memory"])
```
Red flags: draw calls ≫ batches (static/GPU batching off — set `BatchingStatic`, see
`scene-spawning-hierarchy` §4), thousands of set-pass calls (too many unique materials), GC memory
climbing across frames (per-frame allocations). `stats_list_counters` enumerates all counters.

## 5. Texture import discipline (biggest silent memory sink)

No dedicated tool for import settings — audit and fix via `execute_code` on the `TextureImporter`.

```python
execute_code(action="execute", code='''
int fixedCount = 0;
foreach (var guid in AssetDatabase.FindAssets("t:Texture2D", new[]{"Assets"})) {
  var path = AssetDatabase.GUIDToAssetPath(guid);
  var ti = AssetImporter.GetAtPath(path) as TextureImporter;
  if (ti == null) continue;
  bool dirty = false;
  if (ti.maxTextureSize > 2048) { ti.maxTextureSize = 2048; dirty = true; }   // cap oversized
  if (!ti.mipmapEnabled && ti.textureType == TextureImporterType.Default) { ti.mipmapEnabled = true; dirty = true; }
  if (ti.textureCompression == TextureImporterCompression.Uncompressed) { ti.textureCompression = TextureImporterCompression.Compressed; dirty = true; }
  if (dirty) { ti.SaveAndReimport(); fixedCount++; }
}
return $"normalized {fixedCount} textures";
''')
```
Audit-only (no reimport) first — report offenders before changing anything. UI sprites legitimately
disable mipmaps; don't force them on. Compression/format is platform-specific — respect existing
platform overrides.

## 6. Missing-reference scanner (scripted, read-only)

The most common invisible breakage: a "Missing (Mono Script)" component or a null serialized
reference. Scan the WHOLE scene without destroying anything:

```python
execute_code(action="execute", code='''
using System.Text; var sb = new StringBuilder(); int missing = 0, nullRefs = 0;
foreach (var go in UnityEngine.Object.FindObjectsByType<GameObject>(FindObjectsSortMode.None)) {
  foreach (var c in go.GetComponents<Component>()) {
    if (c == null) { missing++; sb.AppendLine($"MISSING SCRIPT on {go.name}"); continue; }
    var so = new SerializedObject(c); var p = so.GetIterator();
    while (p.NextVisible(true))
      if (p.propertyType == SerializedPropertyType.ObjectReference
          && p.objectReferenceValue == null && p.objectReferenceInstanceIDValue != 0) {
        nullRefs++; sb.AppendLine($"BROKEN REF {go.name}.{c.GetType().Name}.{p.propertyName}");
      }
  }
}
return $"missingScripts={missing} brokenRefs={nullRefs}\\n{sb}";
''')
```
`missingScripts=0 brokenRefs=0` is the pass bar. Note: `objectReferenceInstanceIDValue != 0`
distinguishes a *broken* link from an intentionally-empty optional field.

## Pitfalls

- Trusting a tool's `success:true` as "it works" — success means the call ran, not that the scene is
  correct. Always read back / smoke-test.
- Profiling from an empty/wrong scene — confirm the active scene and object count first
  (`manage_scene(action="get_active")`), or you profile nothing.
- Reading counters with no play frames — frame timing/rendering counters need the game running (capture during the §2 play window).
- Forcing mipmaps/compression on UI sprites or platform-tuned textures — regressions, not fixes.
- Re-reading a stable console repeatedly — wastes the step budget (base-skill rule).

## Pre-handoff checklist (all must pass)

1. `read_console(action="get", types=["error","warning"])` → no errors (warnings triaged).
2. Play-mode smoke test clean (§2), run once; `run_tests` all green (§3) if the project has tests.
3. Missing-reference scan → `missingScripts=0 brokenRefs=0` (§6).
4. `manage_graphics(action="stats_get")` sane (draw calls not pathological); `get_hierarchy` matches
   the intended result (read-back, not intent).
5. `manage_scene(action="save")` — persisted. Report the read-back state + stats, then STOP.
