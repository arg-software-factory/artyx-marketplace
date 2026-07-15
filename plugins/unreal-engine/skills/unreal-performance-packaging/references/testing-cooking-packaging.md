# Automation, cook, package, and artifact verification

Write automation tests at the narrowest layer that proves the contract: unit/functional tests for
deterministic logic, editor/asset validation for content rules, and end-to-end smoke tests for map
load, input, save/load, transitions, networking, and critical rendering paths. Keep tests independent
of editor selection state, wall-clock timing, and implicit asset load order. Capture logs and artifacts
on failure so a packaged-only issue is diagnosable.

Cooking converts project content for a target platform; packaging stages executable, cooked content,
config, and prerequisites into a distributable artifact. Select the exact target platform,
configuration, maps/content inclusion rules, signing requirements, and distribution settings. Treat
cook warnings about missing references, shader failures, redirects, or platform incompatibility as
release risks, not background noise.

Verify the staged artifact on a clean machine/account or equivalent environment: startup, save path,
first-run dependencies, input, map transitions, DLC/optional chunks, crash reporting, and performance
should be tested outside the editor. Retain build log, config, commit, cook report, and version IDs.

## Official sources

- <https://dev.epicgames.com/documentation/en-us/unreal-engine/automation-test-framework-in-unreal-engine>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/packaging-your-project>
- <https://dev.epicgames.com/documentation/en-us/unreal-engine/cooking-content-in-unreal-engine>
