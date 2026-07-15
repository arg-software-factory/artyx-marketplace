# 3D physics integration

Keep physics shapes simple, convex when possible, and sized at the same scale as visible meshes.
Use CharacterBody3D for controlled avatars, StaticBody3D for immovable world collision, and
RigidBody3D when the simulation owns motion. Apply gameplay velocity in the physics tick and
separate visual mesh offsets from collision origins.

## Official sources

- Physics introduction: https://docs.godotengine.org/en/4.6/tutorials/physics/physics_introduction.html
- CharacterBody3D: https://docs.godotengine.org/en/4.6/classes/class_characterbody3d.html
