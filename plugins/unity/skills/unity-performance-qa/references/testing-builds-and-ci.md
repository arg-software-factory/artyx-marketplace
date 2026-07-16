# Tests, players, and CI quality gates

## Test placement

Use Edit Mode tests for deterministic domain rules, generators, data validation and editor-safe asset
checks. Use Play Mode tests for `MonoBehaviour` lifecycle, input-to-gameplay integration, physics and
scene behavior. Unity Test Framework 1.4.6 is Unity's NUnit integration; keep fixtures isolated and
clean up created objects/assets so one test does not determine another's outcome.

Test externally observable contracts: generated layout invariant, input command, damage result,
Addressables handle release, navigation reachability, or scene startup. Avoid broad sleeps/polls;
yield meaningful frames or explicit asynchronous operations. Platform-specific behavior requires a
target-player check—the Editor is not an emulator.

## Build gate

A release candidate should run: source compile; Edit/Play test suites; content/addressables build;
player build for each required Build Profile; launch smoke test; console/platform log scan; and a
baseline performance capture when the change touches runtime cost. Fail on compile errors, missing
scripts, broken serialized references, test failure, missing content, or a budget regression beyond
the agreed threshold.

Version package and engine changes intentionally. Cache dependencies in CI, but validate a clean
checkout/build periodically to expose undeclared local assets or package state. Archive reports,
player logs, test XML and profile summaries as evidence rather than trusting a green command alone.

## Official sources

- Unity Test Framework 1.4: [manual](https://docs.unity3d.com/Packages/com.unity.test-framework@1.4/manual/index.html)
- Unity Manual: [Test Runner](https://docs.unity3d.com/6000.0/Documentation/Manual/testing-editortestsrunner.html)
- Unity Manual: [Build Profiles](https://docs.unity3d.com/6000.0/Documentation/Manual/BuildSettings.html)
- Unity Manual: [Command line arguments](https://docs.unity3d.com/6000.0/Documentation/Manual/CommandLineArguments.html)
