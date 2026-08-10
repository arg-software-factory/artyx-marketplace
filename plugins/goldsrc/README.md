# GoldSrc Studio Models

This package connects Artyx Desktop to a separately installed, local GoldSrc
MDL v10 adapter. It does not contain Valve assets, compilers, decompilers, or
runtime code.

There are two deliberately separate fidelity paths:

- exact archival restore, backed by the original content-addressed MDL bundle;
- semantic compilation through QC/SMD/indexed BMP and a user-supplied StudioMDL.

An edited GLB is never advertised as an exact inverse of MDL v10. Native export
is enabled only when a declared profile can preserve or intentionally rebuild
the required engine contract.

See the upstream [StudioMDL documentation](https://developer.valvesoftware.com/wiki/StudioMDL)
for the compiler/toolchain. Users are responsible for supplying authorized
assets and a compiler whose license permits their use.
