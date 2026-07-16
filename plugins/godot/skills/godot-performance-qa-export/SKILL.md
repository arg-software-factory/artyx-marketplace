---
name: godot-performance-qa-export
description: Profile, validate, and export Godot 4.6+ projects. Use for debugger monitors, CPU/GPU bottleneck analysis, rendering metrics, headless smoke tests, import validation, export presets/templates, and desktop/mobile/web release checks.
---

# Performance, QA, and export

Measure a reproducible scenario on target hardware before choosing an optimization. Distinguish
editor overhead from an exported build. A clean editor run is not a release check: validate the
export preset, templates, resource filtering, and startup scene.

| Need | Read |
| --- | --- |
| Profiler, monitors, rendering metrics | [profiling](references/profiling-monitors.md) |
| Bottleneck-first optimization | [optimization playbook](references/optimization-playbook.md) |
| CLI/headless smoke runs and error gates | [headless QA](references/headless-qa.md) |
| Presets, templates, filters, platform checks | [export matrix](references/export-platform-matrix.md) |

For bridge-driven checks, follow the run/stop discipline in `godot-mcp`; report actual logs and
measurements rather than assumed quality.
