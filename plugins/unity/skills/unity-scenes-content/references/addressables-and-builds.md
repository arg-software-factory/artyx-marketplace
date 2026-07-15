# Addressables 2.7 and build content

## Runtime asset contract

Addressables 2.7.6 organizes assets through groups, addresses, labels and a catalog. Address strings
and labels are public runtime contracts: centralize them, avoid constructing ad-hoc string paths, and
choose labels for queries rather than as a substitute for ownership. Groups encode build/load paths,
bundling, cache behavior and update policy; inspect group settings before moving content.

Every `LoadAssetAsync`, scene load, instantiate, or download handle has an explicit owner and release
point. Retaining a handle retains resources; releasing too early invalidates use. Pair instantiation
with the Addressables release API appropriate to how it was created. Test error callbacks and offline
behavior, not only a warm Editor cache.

## Delivery and Build Profiles

Build Addressables content before the player when catalogs/bundles are part of the release. Remote
content requires versioned hosting, cache/update policy, integrity/failure telemetry, and a rollback
plan. A Build Profile controls target/platform build settings; inspect scene list and profile options
instead of relying on whichever Editor target was last selected.

Validate a clean player/install, cache-hit run, catalog update run, missing remote response, and
unload/release memory recovery. A feature is not content-complete merely because it works in Editor.

## Official sources

- Addressables 2.7: [manual](https://docs.unity3d.com/Packages/com.unity.addressables@2.7/manual/index.html)
- Addressables 2.7: [loading assets](https://docs.unity3d.com/Packages/com.unity.addressables@2.7/manual/LoadingAssets.html)
- Unity Manual: [Build Profiles](https://docs.unity3d.com/6000.0/Documentation/Manual/BuildSettings.html)
- Unity Manual: [AssetBundles](https://docs.unity3d.com/6000.0/Documentation/Manual/AssetBundlesIntro.html)
