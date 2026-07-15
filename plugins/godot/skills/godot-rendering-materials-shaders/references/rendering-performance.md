# Rendering performance

Find whether the workload is CPU, GPU, draw submission, fill rate, texture memory, or shader cost
before optimizing. Lights, shadows, transparent layers, and unique materials are common costs. Use
visibility ranges, occlusion, instancing, and texture budgets as measured changes, not universal
rules.

## Official sources

- 3D optimization: https://docs.godotengine.org/en/4.6/tutorials/performance/optimizing_3d_performance.html
- RenderingServer: https://docs.godotengine.org/en/4.6/classes/class_renderingserver.html
