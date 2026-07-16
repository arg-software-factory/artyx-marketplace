# Input, UI, and physics boundaries

## Input System 1.14

For Unity 6, prefer the installed Input System package (`com.unity.inputsystem`, documented here at
1.14) over adding parallel legacy-input code. Model player intent as named Action Maps and Actions;
bind devices separately from gameplay logic. Enable/disable action maps with the owning lifecycle,
and route callback values into a state/command layer rather than letting callbacks mutate unrelated
objects. Treat rebinding, devices lost/regained, and UI/gameplay map handoff as first-class flows.

## UI

Choose UI Toolkit or uGUI according to the existing project; avoid two competing event/focus systems
in the same surface without a deliberate bridge. UI presents state and sends commands. It should not
be the sole owner of game rules. Bind/unbind UI listeners with panel/view lifetime, validate keyboard
and gamepad navigation, and test at target resolution/safe areas.

## Physics and time

Use Rigidbody motion through the physics API in fixed time; do not set the same transform directly in
`Update`. Decide whether collision response, trigger detection, or a kinematic controller owns
movement. Configure collision layers as a matrix before adding per-object exceptions. Raycasts and
overlaps need explicit layer masks and trigger-query policy. Scale all visual/frame-loop motion by
`deltaTime`; use unscaled time only for behavior intentionally independent of pause/time scale.

## Official sources

- Input System 1.14: [manual](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/manual/index.html)
- Unity Manual: [UI systems](https://docs.unity3d.com/6000.0/Documentation/Manual/UIElements.html)
- Unity Manual: [Physics](https://docs.unity3d.com/6000.0/Documentation/Manual/PhysicsSection.html)
- Unity Scripting API: [Time](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Time.html)
