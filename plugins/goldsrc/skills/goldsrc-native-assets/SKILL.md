---
name: goldsrc-native-assets
description: Inspect, preview, retexture, restore, and compile authorized GoldSrc MDL v10 assets through Artyx native asset adapters.
---

# GoldSrc Native Assets

Use the native adapter for MDL v10 instead of treating the preview GLB as the
source of truth.

1. Import the complete MDL bundle and inspect the adapter diagnostics.
2. Choose exact restoration, texture replacement, or static-prop compilation.
3. Keep retail/decompiled assets and user-supplied compilers local.
4. Review the generated PNG and indexed BMP surfaces.
5. Export to staging, require structural validation, then commit the candidate.
6. Install manually and reversibly only after checking hashes and backups.

Read [fidelity-and-validation.md](references/fidelity-and-validation.md) before
choosing an export profile.
