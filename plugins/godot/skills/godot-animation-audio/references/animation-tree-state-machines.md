# AnimationTree state machines

Use AnimationTree to choose/blend AnimationPlayer data at runtime. Define state-machine transitions
from gameplay state, not visual assumptions; set and inspect parameters deliberately. Use blend
spaces for continuous locomotion and constrain transitions to avoid oscillation. Treat root motion
as an ownership decision: either animation drives body displacement or code does, never both.

## Official sources

- Using AnimationTree: https://docs.godotengine.org/en/4.6/tutorials/animation/animation_tree.html
- AnimationNodeStateMachine: https://docs.godotengine.org/en/4.6/classes/class_animationnodestatemachine.html
