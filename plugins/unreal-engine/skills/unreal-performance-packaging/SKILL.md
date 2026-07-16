---
name: unreal-performance-packaging
description: Measure, optimize, test, cook, package, and ship Unreal Engine 5.6+ projects. Use for Unreal Insights, CPU/GPU/memory bottlenecks, automation tests, configuration, cooking, packaging, staging, target-platform verification, or release regressions.
---

# Performance, QA, and packaging

Read [profiling-and-budgets.md](references/profiling-and-budgets.md) before optimization. Read
[testing-cooking-packaging.md](references/testing-cooking-packaging.md) before a build or release.
Performance work is evidence-driven: establish a repeatable scene, build configuration, hardware tier,
and frame-time budget before changing content or code.

## Ship loop

1. Capture baseline CPU, GPU, memory, loading, and hitch evidence in the intended build type.
2. Identify one dominant causal chain; change it; measure the same scenario again.
3. Run deterministic automation/smoke tests and manual high-risk flows in standalone or packaged form.
4. Cook/package the exact platform configuration, inspect warnings and staged outputs, then run it on
   representative hardware.
5. Record engine version, commit, command/configuration, test result, and performance delta.
