/**
 * mcp.json against Agent Plugins 1.0.0, section 7.2.
 *
 * The schema carries the structure: three closed variants, required fields,
 * the reserved `env` key names, the `cwd` prefix. Everything below is the part
 * JSON Schema cannot say — `url` is only `minLength: 1` in the schema, and
 * `command` likewise, so every rule that makes them meaningful is hand-written
 * here.
 *
 * The failure boundaries are narrower than for plugin.json and must not be
 * widened. A broken mcp.json disables MCP for the plugin, and nothing more:
 * its skills still load. A broken server entry skips that server, and nothing
 * more: its siblings still load.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import Ajv from 'ajv/dist/2020.js'

import { MCP_SCHEMA_URL, SPEC_VERSION } from './spec-plugin.mjs'

/** The only two placeholders in the specification. Everything else stays literal. */
export const SPEC_PLACEHOLDERS = Object.freeze(['PLUGIN_ROOT', 'PLUGIN_DATA'])

const PLACEHOLDER_SCAN = /\$\{([^}]*)\}/g
const BARE_COMMAND = /^[A-Za-z0-9._+-]+$/
const HTTP_FIELD_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/
const SECRET_SHAPED_NAME = /AUTHORIZATION|TOKEN|KEY|SECRET|PASSWORD|BEARER|CREDENTIAL/i

let compiledMcpValidator = null

async function loadMcpValidator(repoRoot) {
  if (compiledMcpValidator) return compiledMcpValidator
  const schemaPath = join(repoRoot, 'schemas', SPEC_VERSION, 'mcp.schema.json')
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
  const ajv = new Ajv({ allErrors: true, strict: false })
  compiledMcpValidator = ajv.compile(schema)
  return compiledMcpValidator
}

function placeholderNames(value) {
  const names = []
  for (const match of String(value).matchAll(PLACEHOLDER_SCAN)) names.push(match[1])
  return names
}

/** A loopback host is the only place plain HTTP is allowed. */
function isLoopbackHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost') return true
  if (host === '::1') return true
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  return false
}

function checkUrl(url, { target, pointer, server, report }) {
  if (url.includes('${')) {
    report.entry(
      'mcp.server.url.placeholder',
      target,
      `${pointer}/url`,
      `Server "${server}": a client performs no expansion in "url", so ${placeholderNames(url)
        .map((n) => `\${${n}}`)
        .join(', ')} would be sent literally. Put the literal default here and ` +
        'the templated form in extensions["ai.artyx.desktop"].mcp.'
    )
    return
  }

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    report.entry(
      'mcp.server.url.invalid',
      target,
      `${pointer}/url`,
      `Server "${server}": "${url}" is not an absolute URL.`
    )
    return
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    report.entry(
      'mcp.server.url.scheme',
      target,
      `${pointer}/url`,
      `Server "${server}": scheme must be http or https, got "${parsed.protocol.replace(':', '')}".`
    )
    return
  }
  if (parsed.username || parsed.password) {
    report.entry(
      'mcp.server.url.userinfo',
      target,
      `${pointer}/url`,
      `Server "${server}": a URL must not carry user information.`
    )
  }
  if (parsed.hash) {
    report.entry(
      'mcp.server.url.fragment',
      target,
      `${pointer}/url`,
      `Server "${server}": a URL must not carry a fragment.`
    )
  }
  if (parsed.protocol === 'http:' && !isLoopbackHost(parsed.hostname)) {
    report.entry(
      'mcp.server.url.insecure',
      target,
      `${pointer}/url`,
      `Server "${server}": plain HTTP is only allowed when the host is exactly "localhost" ` +
        `or a loopback IP literal. "${parsed.hostname}" needs HTTPS.`
    )
  }
}

function checkHeaders(headers, { target, pointer, server, report }) {
  const seen = new Map()
  for (const [name, value] of Object.entries(headers)) {
    if (!HTTP_FIELD_NAME.test(name)) {
      report.entry(
        'mcp.server.headers.name',
        target,
        `${pointer}/headers/${name}`,
        `Server "${server}": "${name}" is not a valid HTTP header field name.`
      )
    }
    const lower = name.toLowerCase()
    if (seen.has(lower)) {
      report.entry(
        'mcp.server.headers.duplicate',
        target,
        `${pointer}/headers/${name}`,
        `Server "${server}": header names are case-insensitive, so "${name}" collides with ` +
          `"${seen.get(lower)}".`
      )
    }
    seen.set(lower, name)

    if (String(value).includes('${')) {
      report.entry(
        'mcp.server.headers.placeholder',
        target,
        `${pointer}/headers/${name}`,
        `Server "${server}": a client performs no expansion in header values, so this would ` +
          'be sent literally. Move it to extensions["ai.artyx.desktop"].mcp.'
      )
    }
    if (SECRET_SHAPED_NAME.test(name)) {
      report.entry(
        'mcp.server.headers.secret',
        target,
        `${pointer}/headers/${name}`,
        `Server "${server}": headers are visible package data and must never carry a ` +
          'credential. Declare a userVar and put the header in the Artyx overlay instead.'
      )
    }
  }
}

function checkCommand(command, { target, pointer, server, report }) {
  if (command.includes('${')) {
    report.entry(
      'mcp.server.command.placeholder',
      target,
      `${pointer}/command`,
      `Server "${server}": a client performs no expansion in "command". It would try to ` +
        'spawn the template text and fail with ENOENT.'
    )
    return
  }
  if (/\s/.test(command)) {
    report.entry(
      'mcp.server.command.tokens',
      target,
      `${pointer}/command`,
      `Server "${server}": "command" is one executable token, not a shell string. ` +
        'Move the rest into "args".'
    )
    return
  }
  if (command.startsWith('./')) {
    if (command.includes('..')) {
      report.entry(
        'mcp.server.command.escapes',
        target,
        `${pointer}/command`,
        `Server "${server}": a plugin-relative command must stay inside the plugin root.`
      )
    }
    return
  }
  if (!BARE_COMMAND.test(command)) {
    report.entry(
      'mcp.server.command.form',
      target,
      `${pointer}/command`,
      `Server "${server}": "command" must be a bare executable name or a "./"-relative path. ` +
        `"${command}" is neither — an absolute path is not portable.`
    )
  }
}

function checkExpandable(value, { target, pointer, server, report, field }) {
  for (const name of placeholderNames(value)) {
    if (SPEC_PLACEHOLDERS.includes(name)) continue
    report.entry(
      'mcp.server.placeholder.unknown',
      target,
      `${pointer}/${field}`,
      `Server "${server}": \${${name}} is not a specification placeholder, so it stays ` +
        `literal. Only ${SPEC_PLACEHOLDERS.map((p) => `\${${p}}`).join(' and ')} expand. ` +
        'A user-supplied value belongs in extensions["ai.artyx.desktop"].mcp.'
    )
  }
}

function checkStdioServer(server, name, ctx) {
  checkCommand(server.command, { ...ctx, server: name })

  for (const [index, arg] of (server.args ?? []).entries()) {
    checkExpandable(arg, { ...ctx, server: name, field: `args/${index}` })
  }

  for (const [key, value] of Object.entries(server.env ?? {})) {
    // The schema blocks the exact names; platform environment semantics are
    // case-insensitive on Windows, so a differently-cased spelling would also
    // collide with what the client injects.
    if (SPEC_PLACEHOLDERS.some((reserved) => reserved.toLowerCase() === key.toLowerCase())) {
      ctx.report.entry(
        'mcp.server.env.reserved',
        ctx.target,
        `${ctx.pointer}/env/${key}`,
        `Server "${name}": "${key}" collides with a reserved variable the client supplies. ` +
          'Environment names are case-insensitive on Windows.'
      )
    }
    if (SECRET_SHAPED_NAME.test(key)) {
      ctx.report.entry(
        'mcp.server.env.secret',
        ctx.target,
        `${ctx.pointer}/env/${key}`,
        `Server "${name}": env values are visible package data and must never carry a ` +
          'credential. Move it to the Artyx overlay with a declared userVar.'
      )
    }
    checkExpandable(value, { ...ctx, server: name, field: `env/${key}` })
  }

  if (server.cwd !== undefined) {
    if (server.cwd.includes('..')) {
      ctx.report.entry(
        'mcp.server.cwd.escapes',
        ctx.target,
        `${ctx.pointer}/cwd`,
        `Server "${name}": "cwd" must stay inside the plugin root or the plugin data directory.`
      )
    }
    checkExpandable(server.cwd, { ...ctx, server: name, field: 'cwd' })
  }
}

function describeError(error) {
  const where = error.instancePath || '/'
  if (error.keyword === 'additionalProperties') {
    return `${where}: unexpected field "${error.params.additionalProperty}"`
  }
  if (error.keyword === 'required') {
    return `${where}: missing required field "${error.params.missingProperty}"`
  }
  if (error.keyword === 'oneOf') {
    return (
      `${where}: matches none of the three server variants. A server needs "type" set to ` +
      '"stdio", "streamable-http", or "sse", and only the fields that variant defines.'
    )
  }
  return `${where}: ${error.message}`
}

/**
 * @returns {object | null} the parsed file, or null when MCP is disabled for this plugin.
 */
export async function validateSpecMcp({ repoRoot, target, raw, report }) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    report.component(
      'mcp.json.invalid',
      target,
      'mcp.json',
      `Not valid JSON, so MCP is disabled for this plugin: ${error.message}`
    )
    return null
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    report.component('mcp.type.invalid', target, 'mcp.json', 'The file must be a JSON object.')
    return null
  }

  if (parsed.$schema !== MCP_SCHEMA_URL) {
    report.component(
      'mcp.schema.mismatch',
      target,
      'mcp.json /$schema',
      `"$schema" must be "${MCP_SCHEMA_URL}" and must name the same Agent Plugins version as ` +
        `plugin.json. Got ${parsed.$schema === undefined ? 'nothing' : `"${parsed.$schema}"`}.`
    )
    return null
  }

  const validate = await loadMcpValidator(repoRoot)
  if (!validate(parsed)) {
    // A top-level violation disables MCP for the whole plugin; a violation
    // inside one server skips only that server.
    const perServer = new Map()
    let topLevelBroken = false
    for (const error of validate.errors ?? []) {
      const match = /^\/mcpServers\/([^/]+)/.exec(error.instancePath)
      if (match) {
        if (!perServer.has(match[1])) perServer.set(match[1], [])
        perServer.get(match[1]).push(error)
        continue
      }
      topLevelBroken = true
      report.component('mcp.schema.violation', target, 'mcp.json', describeError(error))
    }
    if (topLevelBroken) return null
    for (const [name, errors] of perServer) {
      // oneOf fans out into one error per branch plus the summary; the summary
      // is the readable one.
      const summary = errors.find((e) => e.keyword === 'oneOf') ?? errors[0]
      report.entry(
        'mcp.server.invalid',
        target,
        `mcp.json /mcpServers/${name}`,
        `Server "${name}" is skipped. ${describeError(summary)}`
      )
    }
  }

  const servers = parsed.mcpServers ?? {}
  if (Object.keys(servers).length === 0) {
    report.warn(
      'mcp.servers.empty',
      target,
      'mcp.json /mcpServers',
      'No servers. This is valid, but the file then has no effect — delete it instead.'
    )
  }

  for (const [name, server] of Object.entries(servers)) {
    if (!server || typeof server !== 'object' || Array.isArray(server)) continue
    const ctx = { target, pointer: `mcp.json /mcpServers/${name}`, report }
    if (server.type === 'stdio') {
      if (typeof server.command === 'string') checkStdioServer(server, name, ctx)
    } else if (server.type === 'streamable-http' || server.type === 'sse') {
      if (typeof server.url === 'string') {
        checkUrl(server.url, { ...ctx, server: name })
      }
      if (server.headers && typeof server.headers === 'object') {
        checkHeaders(server.headers, { ...ctx, server: name })
      }
      if (server.type === 'sse') {
        report.warn(
          'mcp.server.sse-legacy',
          target,
          `${ctx.pointer}/type`,
          `Server "${name}" uses the deprecated HTTP+SSE transport. Support for it is ` +
            'optional in a conformant client. Prefer "streamable-http".'
        )
      }
    }
  }

  return parsed
}
