# Skeletons and retargeting

Validate rest pose, bone names, scale, and root motion at import before constructing an AnimationTree.
Retargeting maps structural chains, but cannot repair incompatible proportions or a bad source pose.
Keep a canonical locomotion root and test feet, rotation, and root displacement after every reimport.

## Official sources

- Skeleton3D: https://docs.godotengine.org/en/4.6/classes/class_skeleton3d.html
- Retargeting: https://docs.godotengine.org/en/4.6/tutorials/assets_pipeline/retargeting_3d_skeletons.html
