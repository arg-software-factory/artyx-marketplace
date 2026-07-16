---
name: unreal-cinematics
description: Create Unreal Engine 5.6+ cinematics and final renders. Use for Level Sequences, Sequencer tracks, Cine Camera, Control Rig animation, camera cuts, shot organization, Movie Render Queue, Movie Render Graph, or render-quality validation.
---

# Cinematics and render delivery

Read [sequencer-and-cameras.md](references/sequencer-and-cameras.md) to construct shots. Read
[movie-render-delivery.md](references/movie-render-delivery.md) before rendering. If driving UE through
MCP, load `unreal-engine-mcp` first: native Sequencer/MRQ support is experimental and must be
discovered rather than assumed.

## Shot workflow

1. Lock display rate, resolution, color/exposure approach, handles, naming, and output destination.
2. Build a Level Sequence with explicit bindings, camera cuts, transforms/properties, animation, and
   shot/subsequence structure.
3. Preview camera cuts and timing transitions; validate focus, motion blur, and light changes in the
   Cinematic Viewport or a test render.
4. Render a representative range with the final preset before queueing a full delivery.
