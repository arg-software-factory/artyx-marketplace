# 2D performance

Measure before changing art. Reduce overdraw from large transparent sprites, avoid unique material
instances that break batching, and pack compatible textures where that improves draw submission.
Particles, lights, canvases, and shadows have target-dependent costs; test the worst camera view on
the lowest supported GPU. Use visibility/notifier nodes or scene streaming for content outside view.

## Official sources

- Performance section: https://docs.godotengine.org/en/4.6/tutorials/performance/index.html
- General optimization: https://docs.godotengine.org/en/4.6/tutorials/performance/general_optimization.html
