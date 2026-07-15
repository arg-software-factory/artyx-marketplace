# AnimationPlayer data

Store authored clips in AnimationLibrary resources and use AnimationPlayer to play named clips.
Keep property tracks scoped to the scene that owns the property. Prefer signal/state logic to method
call tracks for critical gameplay: call tracks are ordering-sensitive during seeks, loops, and
editor previews. Keep events idempotent if they can replay.

## Official sources

- Animation introduction: https://docs.godotengine.org/en/4.6/tutorials/animation/introduction.html
- AnimationPlayer: https://docs.godotengine.org/en/4.6/classes/class_animationplayer.html
