#!/usr/bin/env node
/**
 * Standalone Blender MCP server (stdio, zero-dependency).
 *
 * This is a NORMAL MCP server from Artyx's point of view — Artyx connects to it
 * through the generic AI SDK stdio transport, exactly like it would connect to
 * `npx @modelcontextprotocol/server-filesystem` or `uvx blender-mcp`. Artyx has
 * no Blender-specific integration code; all Blender knowledge lives here.
 *
 * It speaks MCP JSON-RPC (newline-delimited) on stdin/stdout, and bridges each
 * tool call to the official Blender Lab MCP addon's raw execute-socket
 * (127.0.0.1:9876, null-byte-delimited `{type:"execute", code, strict_json:true}`).
 *
 * Env: BLENDER_MCP_HOST (default 127.0.0.1), BLENDER_MCP_PORT (default 9876).
 */
import net from 'node:net'
import { createInterface } from 'node:readline'

const HOST = process.env.BLENDER_MCP_HOST || '127.0.0.1'
const PORT = Number(process.env.BLENDER_MCP_PORT || 9876)
const PROTOCOL_VERSION = '2025-06-18'

// ── Blender execute-socket bridge ────────────────────────────────────────────
function runBlenderCode(code, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const payload = Buffer.concat([
      Buffer.from(JSON.stringify({ type: 'execute', code, strict_json: true }), 'utf-8'),
      Buffer.from([0])
    ])
    const socket = net.createConnection({ host: HOST, port: PORT })
    let buf = Buffer.alloc(0)
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      socket.destroy()
      reject(new Error(`Blender bridge timed out after ${timeoutMs}ms at ${HOST}:${PORT}`))
    }, timeoutMs)
    const done = (fn) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.destroy()
      fn()
    }
    socket.on('connect', () => socket.write(payload))
    socket.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk])
      const i = buf.indexOf(0)
      if (i < 0) return
      const raw = buf.subarray(0, i).toString('utf-8')
      done(() => {
        try {
          resolve(JSON.parse(raw))
        } catch (e) {
          reject(e)
        }
      })
    })
    socket.on('error', (e) => {
      const msg =
        e && (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || e.code === 'EHOSTUNREACH')
          ? `Blender is not reachable at ${HOST}:${PORT}. Open Blender and start the MCP bridge add-on.`
          : String(e && e.message ? e.message : e)
      done(() => reject(new Error(msg)))
    })
    socket.on('close', () =>
      done(() => reject(new Error('Blender bridge closed before responding')))
    )
  })
}

async function runBlenderResult(code, timeoutMs) {
  const resp = await runBlenderCode(code, timeoutMs)
  if (!resp || resp.status !== 'ok') {
    const m = resp && resp.message ? resp.message : 'Blender returned an invalid response.'
    throw new Error(m)
  }
  return resp.result
}

// ── Tool catalog (Python snippets under the hood) ────────────────────────────
const TOOLS = [
  {
    name: 'get_scene_info',
    description:
      'Get the current Blender scene: name, Blender version, object count, and a list of ' +
      'objects (name, type, location). Read-only. May serve a cached snapshot; for ' +
      'authoritative live state, read via execute-python.',
    _meta: { 'artyx/readOnly': true },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: async () =>
      runBlenderResult(`
import bpy
result = {
  "blender_version": bpy.app.version_string,
  "scene_name": bpy.context.scene.name,
  "object_count": len(bpy.context.scene.objects),
  "objects": [
    {"name": o.name, "type": o.type, "location": [round(v,3) for v in o.location]}
    for o in list(bpy.context.scene.objects)[:200]
  ],
}
`)
  },
  {
    name: 'get_object_info',
    description:
      'Get detailed info for one object by name (type, location, rotation, scale, dimensions, vertex/polygon counts, materials). Read-only.',
    _meta: { 'artyx/readOnly': true },
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Exact object name.' } },
      required: ['name'],
      additionalProperties: false
    },
    run: async (args) =>
      runBlenderResult(`
import bpy
name = ${JSON.stringify(String(args.name ?? ''))}
obj = bpy.data.objects.get(name)
if obj is None:
    raise ValueError("Object not found: " + name)
mesh = obj.data if obj.type == 'MESH' else None
result = {
  "name": obj.name, "type": obj.type,
  "location": [round(v,3) for v in obj.location],
  "rotation_euler": [round(v,3) for v in obj.rotation_euler],
  "scale": [round(v,3) for v in obj.scale],
  "dimensions": [round(v,3) for v in obj.dimensions],
  "vertices": len(mesh.vertices) if mesh else None,
  "polygons": len(mesh.polygons) if mesh else None,
  "materials": [m.name for m in obj.data.materials] if getattr(obj.data, "materials", None) else [],
}
`)
  },
  {
    name: 'import_model',
    description:
      'Import a 3D model file into the live Blender scene. Supports .obj, .fbx, .glb, ' +
      '.gltf, .stl, .ply. Optional name renames imported root object(s) server-side and ' +
      'returns final names. WRITE operation — mutates the scene.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Absolute path to the model file on this machine.'
        },
        name: {
          type: 'string',
          description: 'Optional final root object name to apply after import.'
        }
      },
      required: ['file_path'],
      additionalProperties: false
    },
    run: async (args) =>
      runBlenderResult(
        `
import bpy, os
path = ${JSON.stringify(String(args.file_path ?? ''))}
requested_name = ${JSON.stringify(String(args.name ?? '').trim())}
if not os.path.isfile(path):
    raise FileNotFoundError("File not found: " + path)
ext = os.path.splitext(path)[1].lower()
before = set(o.name for o in bpy.context.scene.objects)
if ext == ".obj":
    bpy.ops.wm.obj_import(filepath=path)
elif ext == ".fbx":
    bpy.ops.import_scene.fbx(filepath=path)
elif ext in (".glb", ".gltf"):
    bpy.ops.import_scene.gltf(filepath=path)
elif ext == ".stl":
    bpy.ops.wm.stl_import(filepath=path)
elif ext == ".ply":
    bpy.ops.wm.ply_import(filepath=path)
else:
    raise ValueError("Unsupported extension: " + ext)
imported = [o for o in bpy.context.scene.objects if o.name not in before]
imported_names = set(o.name for o in imported)
roots = [o for o in imported if o.parent is None or o.parent.name not in imported_names]
if requested_name and imported:
    rename_targets = roots if roots else imported
    if len(rename_targets) == 1:
        rename_targets[0].name = requested_name
    else:
        for idx, obj in enumerate(rename_targets, start=1):
            obj.name = f"{requested_name}_{idx:02d}"
result = {
  "imported_objects": sorted(o.name for o in imported),
  "root_objects": sorted(o.name for o in (roots if roots else imported)),
  "scene_object_count": len(bpy.context.scene.objects),
}
`,
        60000
      )
  },
  {
    name: 'execute_python',
    description:
      'Run arbitrary Blender Python (bpy) code in the live scene. Your script MUST assign a ' +
      'JSON-serializable dict to a variable named `result` (e.g. result = {"objects": ' +
      '[o.name for o in bpy.context.scene.objects]}). Strings/lists are rejected. Blender ' +
      '5.x note: Action.fcurves moved to action.layers[].strips[].channelbags[].fcurves. ' +
      'Powerful WRITE/read tool — can create, edit, delete, or query anything.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description:
            'Python code. Assign the value you want returned to a variable named `result`.'
        }
      },
      required: ['code'],
      additionalProperties: false
    },
    run: async (args) => runBlenderResult(String(args.code ?? ''), 60000)
  }
]

const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]))

// ── MCP JSON-RPC (stdio, newline-delimited) ──────────────────────────────────
function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n')
}

function reply(id, result) {
  send({ jsonrpc: '2.0', id, result })
}

function replyError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } })
}

async function handle(msg) {
  const { id, method, params } = msg
  // Notifications (no id) never get a response.
  if (id === undefined || id === null) return

  switch (method) {
    case 'initialize':
      return reply(id, {
        protocolVersion:
          typeof params?.protocolVersion === 'string' ? params.protocolVersion : PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: 'artyx-blender', version: '1.0.0' },
        instructions:
          'Blender integration. Use get_scene_info / get_object_info to read the live scene, ' +
          'import_model to add a 3D file, and execute_python for anything else (assign to `result`).'
      })
    case 'ping':
      return reply(id, {})
    case 'tools/list':
      return reply(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
          ...(t._meta ? { _meta: t._meta } : {})
        }))
      })
    case 'tools/call': {
      const tool = TOOL_BY_NAME.get(params?.name)
      if (!tool) return replyError(id, -32602, `Unknown tool: ${params?.name}`)
      try {
        const value = await tool.run(params?.arguments ?? {})
        return reply(id, {
          content: [{ type: 'text', text: JSON.stringify(value) }],
          isError: false
        })
      } catch (e) {
        return reply(id, {
          content: [{ type: 'text', text: `Error: ${e && e.message ? e.message : String(e)}` }],
          isError: true
        })
      }
    }
    default:
      return replyError(id, -32601, `Method not found: ${method}`)
  }
}

const rl = createInterface({ input: process.stdin })
rl.on('line', (line) => {
  const trimmed = line.trim()
  if (!trimmed) return
  let msg
  try {
    msg = JSON.parse(trimmed)
  } catch {
    return
  }
  void handle(msg).catch((e) => {
    if (msg && msg.id != null) replyError(msg.id, -32603, String(e && e.message ? e.message : e))
  })
})
rl.on('close', () => process.exit(0))
