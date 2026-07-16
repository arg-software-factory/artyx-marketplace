# Navigation 2D and 3D

NavigationRegion contributes walkable data to a map; NavigationAgent requests paths and performs
avoidance; NavigationLink bridges deliberate gaps. Wait for map synchronization before relying on a
new path after changing regions or obstacles. Move the character yourself from the next path point;
the agent does not own the body.

Use navigation layers to separate agent classes and validate obstacle updates under movement, not
only in the editor.

## Official sources

- Navigation overview: https://docs.godotengine.org/en/4.6/tutorials/navigation/index.html
- Using NavigationAgents: https://docs.godotengine.org/en/4.6/tutorials/navigation/navigation_using_navigationagents.html
