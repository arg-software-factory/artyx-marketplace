---
name: unreal-engine-mcp
description: Operate a connected Unreal Engine 5.8 editor through Epic's native MCP server using toolset discovery, serialized changes, and read-back verification.
---

# Unreal Engine MCP operator playbook

This skill is for **Epic's native Unreal MCP plugin in Unreal Engine 5.8**, which is Experimental. It is a live-editor connection, not a code generator and not a substitute for project review.

Official references:

- [Unreal MCP](https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor)
- [Coordinate system and spaces](https://dev.epicgames.com/documentation/unreal-engine/coordinate-system-and-spaces-in-unreal-engine)
- [Blueprints overview](https://dev.epicgames.com/documentation/unreal-engine/overview-of-blueprints-visual-scripting-in-unreal-engine)

## Connect safely

1. Confirm the editor is open, Unreal MCP is enabled, and the local endpoint is reachable. The documented default is `http://127.0.0.1:8000/mcp`.
2. Do not change binding, proxy the server, or share its URL. Native Unreal MCP has no authentication and is intended for loopback only.
3. If the endpoint differs from the default, use the config generated in the editor with `ModelContextProtocol.GenerateClientConfig <Client|All>`; do not guess a URL or port.
4. If the server does not connect, inspect Unreal's Output Log (`LogModelContextProtocol`) and correct the plugin/startup configuration before retrying.

## Discover before planning

Native Unreal MCP normally starts in **tool-search mode**. First use the discovery tools exposed by the connected server:

1. `list_toolsets` — learn the available capabilities.
2. `describe_toolset` for the smallest relevant toolset — read exact schemas, constraints, and side effects.
3. `call_tool` only with parameters verified from that schema.

Never infer a tool, an asset path, actor name, pin name, or property type from another MCP implementation. Toolsets can differ by engine version and enabled plugins. If the needed capability is absent, report it; do not force a low-level workaround or invoke arbitrary console commands.

## Operating contract

The server executes calls on the Unreal game thread **serially**. Issue no overlapping tool calls.

For every task:

1. **Inspect** the active level, selected actors, relevant assets, and existing implementation.
2. **Plan** the smallest reversible set of edits and state the expected result.
3. **Mutate one logical unit at a time** — for example, one actor, material instance, Blueprint, or graph change.
4. **Read back** the changed object or property after every write. A successful transport response is not proof that the editor state is correct.
5. **Verify the user-visible outcome** with a focused viewport/editor inspection and, when available, a targeted automation test.
6. **Report** objects changed, values verified, tests run, and anything intentionally not changed.

Use deterministic, project-conformant names. Before creating an asset or actor, search for an existing equivalent; never create duplicate `BP_*`, material, or level assets merely because a tool call is convenient.

## Scene and transform discipline

- Unreal is **left-handed** and **Z-up**: +X forward, +Y right, +Z up.
- Use the connected tool's documented unit and transform representation. Do not apply Blender or Unity conversion rules unless the project/tool schema explicitly requires one.
- Preserve the level's coordinate space, parent attachment, and pivot intent. Inspect before setting a transform and read it back after.
- Prefer edits in a sandbox or clearly designated work area when the project provides one. Do not touch gameplay-critical actors, world settings, or shared assets without explicit task scope.

## Blueprint and asset changes

Treat a Blueprint as a class asset with components, variables, and graph logic; inspect its existing parent and components before modifying it.

1. Locate the asset and inspect its current graph/components.
2. Make one coherent change using only the discovered tool schema.
3. Compile after graph or class changes, inspect compiler results, and fix errors before proceeding.
4. Save only after verification. When available, place or inspect a controlled instance to confirm the intended behavior.

Do not invent graph pin names, node identifiers, or `/Game/...` asset references. Retrieve the valid values through a read/discovery tool first.

## Recovery

- **No tools or stale schemas:** enable the required toolset, run `ModelContextProtocol.RefreshTools`, reconnect, and rediscover. New reflected C++ tool declarations require an editor restart.
- **Connection failure:** check the Output Log, confirm loopback host/port/path, then rerun the generated client configuration. Do not scan ports or change network exposure.
- **Unexpected result:** stop mutation, inspect the current editor state, compare it with the requested outcome, and make only a scoped corrective edit.
- **Two failed attempts:** stop and surface the exact tool response, editor log evidence, and the missing capability or constraint.

## Completion checklist

- [ ] Every tool was discovered and its current schema read before use.
- [ ] Calls were serialized; no batch or concurrent mutations were issued.
- [ ] Every write was read back and the visible result inspected.
- [ ] Blueprint/compiler diagnostics and targeted tests are clean when applicable.
- [ ] The final report identifies verified changes and unresolved limitations.
