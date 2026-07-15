# glTF asset import

Use glTF 2.0 as the default Godot interchange format. Keep the DCC source beside the exported
`.glb` or `.gltf`; configure import settings and reimport instead of editing generated imported data.
Verify units, axis orientation, pivots, material slots, UVs, skeleton rest pose, and animation names
before gameplay code depends on a node path.

Use an inherited scene or import script for durable engine-side changes. Do not hand-edit an imported
scene when the change must survive a reimport.

## Official sources

- 3D asset pipeline: https://docs.godotengine.org/en/4.6/tutorials/assets_pipeline/3d_asset_pipeline.html
- Importing 3D scenes: https://docs.godotengine.org/en/4.6/tutorials/assets_pipeline/importing_3d_scenes/index.html
