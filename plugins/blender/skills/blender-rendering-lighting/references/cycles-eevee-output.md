# Engine, sampling, and delivery

## Select an engine

Use Cycles when the deliverable needs path-traced global illumination, physically demanding transmission/volumes, or final-frame fidelity. Use Eevee for rapid iteration, realtime-oriented work, and stylized approaches that fit its feature set. Do not assume a Cycles node/material feature has identical Eevee behavior; render a representative frame in the chosen engine.

## Sampling and noise

Profile before increasing samples. In Cycles, enable adaptive sampling and denoising where appropriate, but inspect fine detail, glossy reflections, volume, motion, and DOF for denoiser artifacts. Reduce noise by improving light/material setup, clamping only with an understood artifact tradeoff, and controlling difficult caustic/specular paths. Use reduced resolution/samples for previews and document final settings separately.

## Output and compositing

Set output resolution, pixel aspect, frame range, file format, bit depth, color mode, and image-sequence path explicitly. Prefer image sequences for long animation renders; they recover from interruptions. Enable only passes needed by compositing, name them clearly, and verify premultiplication/alpha on the consumer side. Keep compositor changes versioned in the `.blend` and test a frame with final transforms.

## Official sources

- [Cycles rendering](https://docs.blender.org/manual/en/4.5/render/cycles/index.html)
- [Eevee](https://docs.blender.org/manual/en/4.5/render/eevee/index.html)
- [Output properties](https://docs.blender.org/manual/en/4.5/render/output/properties/index.html)
