# Physics body selection

Use CharacterBody for code-directed characters, RigidBody for simulated objects, StaticBody for
fixed collision, and Area for detection. Give collision layers a semantic matrix and make masks
express which categories an object queries. Use primitive/convex shapes before concave mesh collision
and keep render and collision scales aligned.

## Official sources

- Physics introduction: https://docs.godotengine.org/en/4.6/tutorials/physics/physics_introduction.html
- Collision layers: https://docs.godotengine.org/en/4.6/tutorials/physics/physics_introduction.html#collision-layers-and-masks
