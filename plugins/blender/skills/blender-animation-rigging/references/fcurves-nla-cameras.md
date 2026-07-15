# Curves, NLA, and cinematics

## F-curves

Block with stepped keys; choose interpolation based on motion intent: constant for holds, linear for deliberate constant velocity, Bézier for organic acceleration. Shape handles to communicate anticipation, overshoot, settle, and weight. Do not blanket-smooth every channel: contacts and mechanical timing need intentional discontinuities. Use drivers for stable relationships such as wheel rotation or follow-through, not as opaque replacements for animation.

## NLA

Push only approved actions into NLA tracks. Define strip timing, extrapolation, blend mode, influence, and root-motion behavior explicitly. Use NLA to sequence and layer clips, not to conceal unresolved curves. Verify the evaluated result at strip boundaries and during blends; check that active actions have not been unintentionally cleared after a pushdown.

## Cameras

Frame the shot before polishing motion. Lens choice changes perspective: moving camera position creates parallax; changing focal length does not. Lock camera targets/constraints only after testing their axes. Use timeline markers with assigned cameras for editorial switching. Set render frame range, resolution, output path, and motion blur before final render.

## Official sources

- [F-Curves](https://docs.blender.org/manual/en/4.5/editors/graph_editor/fcurves/index.html)
- [NLA Editor](https://docs.blender.org/manual/en/4.5/editors/nla/index.html)
- [Cameras](https://docs.blender.org/manual/en/4.5/render/cameras.html)
