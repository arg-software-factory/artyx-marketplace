# CS:GO Weapon Builder Expert

Installable Artyx agent preset for designing CS2/CS:GO weapon finishes on a **user-provided** weapon model.

## Flow

1. **Ideation** — theme, finish style, palette, references  
2. **Weapon model** — user must import their GLB/FBX/OBJ (hard gate)  
3. **Analysis** — paintable zones and style fit  
4. **Directions** — pick one concept  
5. **Ortho prototypes** — left/right extract + cheap paint-over iterations until explicit approval  
6. **Apply + retexture** — Meshy v5 on the real mesh (paid step)

## Requirements

- **Desktop:** Artyx `>=0.7.2` (`minArtyxVersion` in `agent.md`)
- **Models:** `anthropic/claude-sonnet-5` (agent), `google/gemini-3.1-flash-lite-image` (paint-overs)
- **Cost:** `$0.45` per `retexture_object` submission (Meshy v5); orthographic prototyping is cheap/read-only until retexture

Tools and models must exist in the target desktop build; older clients ignore this marketplace entry.
