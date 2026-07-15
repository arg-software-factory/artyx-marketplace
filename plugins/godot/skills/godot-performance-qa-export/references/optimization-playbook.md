# Optimization playbook

Fix the measured limiting subsystem first. Reduce algorithmic work and allocations before lowering
visual quality. For rendering, test draw count, overdraw, lights, shadows, texture residency, and
shader complexity independently. For gameplay, profile hot loops, physics shapes, node churn, and
pathfinding. Preserve a before/after capture and revert changes that do not improve the target case.

## Official sources

- 3D optimization: https://docs.godotengine.org/en/4.6/tutorials/performance/optimizing_3d_performance.html
