# MultiMesh and chunks

Use MultiMesh for dense repeated decoration and chunk it by world region. Each chunk owns instance
buffers, bounds, seed, and unload lifecycle. Keep interactive items separate from decorative
instances. Update only affected chunks; rebuilding a whole world for one edit causes frame spikes.

## Official sources

- MultiMesh: https://docs.godotengine.org/en/4.6/classes/class_multimesh.html
