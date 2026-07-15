# 2D performance

Measure before changing art. Reduce overdraw from large transparent sprites, avoid unique material
instances that break batching, and pack compatible textures where that improves draw submission.
Particles, lights, canvases, and shadows have target-dependent costs; test the worst camera view on
the lowest supported GPU. Use visibility/notifier nodes or scene streaming for content outside view.

## Official sources

- 2D rendering optimization: https://docs.godotengine.org/en/4.6/tutorials/performance/optimizing_2d_performance.html
- General optimization: https://docs.godotengine.org/en/4.6/tutorials/performance/general_optimization.html
