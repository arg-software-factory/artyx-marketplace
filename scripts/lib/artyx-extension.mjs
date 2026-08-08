/**
 * extensions["ai.artyx.desktop"].
 *
 * Agent Plugins gives this namespace no meaning, so everything here is our own
 * contract. The structural half lives in schemas/artyx/extension.schema.json;
 * this file adds the rules that tie the overlay back to the portable mcp.json.
 *
 * The overlay exists for one reason. The specification forbids expanding
 * placeholders in `url`, `command`, and header values, and forbids putting a
 * credential in `headers` or `env`. So the portable file ships literal,
 * working defaults, and anything the user configures lives here.
 *
 * The invariant that keeps the two honest: substituting every declared default
 * into the overlay must reproduce the portable file exactly. If it does not,
 * the two files disagree about what "default" means, and a client that ignores
 * our namespace behaves differently from Artyx for no stated reason.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import Ajv from 'ajv/dist/2020.js'

import { AXIS } from './report.mjs'

const PLACEHOLDER = /\$\{([A-Z][A-Z0-9_]*)\}/g
const RUNTIME_COMMANDS = new Set(['npx', 'uvx', 'bunx', 'pipx'])

let compiledExtensionValidator = null

async function loadExtensionValidator(repoRoot) {
  if (compiledExtensionValidator) return compiledExtensionValidator
  const schemaPath = join(repoRoot, 'schemas', 'artyx', 'extension.schema.json')
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
  const ajv = new Ajv({ allErrors: true, strict: false })
  compiledExtensionValidator = ajv.compile(schema)
  return compiledExtensionValidator
}

function varsIn(value) {
  return [...String(value).matchAll(PLACEHOLDER)].map((m) => m[1])
}

/** Walk every string an overlay server can carry, yielding [pointer, value]. */
function* overlayStrings(server) {
  if (typeof server.url === 'string') yield ['url', server.url]
  if (typeof server.command === 'string') yield ['command', server.command]
  if (typeof server.cwd === 'string') yield ['cwd', server.cwd]
  for (const [index, arg] of (server.args ?? []).entries()) yield [`args/${index}`, arg]
  for (const [key, value] of Object.entries(server.headers ?? {})) yield [`headers/${key}`, value]
  for (const [key, value] of Object.entries(server.env ?? {})) yield [`env/${key}`, value]
}

/**
 * Apply an overlay onto a portable server entry.
 *
 * `env` and `headers` merge key by key so an overlay can add one header
 * without restating the rest. Every other field replaces wholesale. The
 * portable `type` always wins: the overlay may not change a server's
 * transport, or Artyx and a conformant client would silently do different
 * things with the same package.
 */
export function mergeOverlay(portableServer, overlay) {
  if (!overlay) return { ...portableServer }
  const merged = { ...portableServer }
  for (const [key, value] of Object.entries(overlay)) {
    if (key === 'env' || key === 'headers') {
      merged[key] = { ...(portableServer[key] ?? {}), ...value }
    } else {
      merged[key] = value
    }
  }
  merged.type = portableServer.type
  return merged
}

/** Substitute declared defaults. Names without a default are left alone. */
function substituteDefaults(value, userVars) {
  return String(value).replace(PLACEHOLDER, (match, name) => {
    const spec = userVars?.[name]
    return typeof spec?.default === 'string' ? spec.default : match
  })
}

function describeError(error) {
  const where = error.instancePath || '/'
  if (error.keyword === 'additionalProperties') {
    return `${where}: unexpected field "${error.params.additionalProperty}"`
  }
  if (error.keyword === 'required') {
    return `${where}: missing required field "${error.params.missingProperty}"`
  }
  if (error.keyword === 'enum') {
    return `${where}: must be one of ${JSON.stringify(error.params.allowedValues)}`
  }
  if (error.keyword === 'pattern') return `${where}: does not match ${error.params.pattern}`
  return `${where}: ${error.message}`
}

export async function validateArtyxExtension({ repoRoot, target, extension, mcp, report: reportRaw }) {
  // Nothing in this file is an Agent Plugins rule, so none of it may count
  // toward spec conformance.
  const report = reportRaw.scoped(AXIS.ARTYX)
  if (!extension) {
    report.fatal(
      'artyx.extension.missing',
      target,
      'plugin.json /extensions',
      'No extensions["ai.artyx.desktop"]. Every plugin in this marketplace needs one — it ' +
        'carries the storefront name, tagline, and category the desktop renders.'
    )
    return
  }

  const validate = await loadExtensionValidator(repoRoot)
  if (!validate(extension)) {
    for (const error of validate.errors ?? []) {
      report.fatal(
        'artyx.extension.violation',
        target,
        'plugin.json /extensions/ai.artyx.desktop',
        describeError(error)
      )
    }
    return
  }

  const userVars = extension.userVars ?? {}
  const overlay = extension.mcp ?? {}
  const portableServers = mcp?.mcpServers ?? {}
  const referenced = new Set()

  for (const [serverName, serverOverlay] of Object.entries(overlay)) {
    const pointer = `plugin.json /extensions/ai.artyx.desktop/mcp/${serverName}`

    // The overlay is a patch, never a new server. Without this, a typo in a
    // server name would silently produce configuration that never applies.
    const portable = portableServers[serverName]
    if (!portable) {
      report.fatal(
        'artyx.overlay.unknown-server',
        target,
        pointer,
        `No server named "${serverName}" in mcp.json. The overlay patches the portable ` +
          `file; it cannot introduce a server. Known servers: ${
            Object.keys(portableServers).join(', ') || 'none'
          }.`
      )
      continue
    }

    for (const [field, value] of overlayStrings(serverOverlay)) {
      for (const name of varsIn(value)) {
        referenced.add(name)
        if (!userVars[name]) {
          report.fatal(
            'artyx.overlay.undeclared-var',
            target,
            `${pointer}/${field}`,
            `\${${name}} is not declared in userVars, so the desktop would never prompt for ` +
              'it and the placeholder would reach the transport unresolved.'
          )
        }
      }

      // The portable file must be exactly what the overlay produces with every
      // default applied. Only checked when all referenced names have one.
      const names = varsIn(value)
      if (names.length === 0) continue
      if (!names.every((n) => typeof userVars[n]?.default === 'string')) continue

      const resolved = substituteDefaults(value, userVars)
      const portableValue = field.includes('/')
        ? portable[field.split('/')[0]]?.[field.split('/').slice(1).join('/')]
        : portable[field]

      if (portableValue !== undefined && resolved !== portableValue) {
        report.fatal(
          'artyx.overlay.default-drift',
          target,
          `${pointer}/${field}`,
          `With defaults applied the overlay yields "${resolved}" but mcp.json says ` +
            `"${portableValue}". The portable file must be exactly the default case, or a ` +
            'client that ignores our namespace behaves differently for no stated reason.'
        )
      }
    }
  }

  for (const [name, spec] of Object.entries(userVars)) {
    if (!referenced.has(name)) {
      report.fatal(
        'artyx.uservar.orphan',
        target,
        `plugin.json /extensions/ai.artyx.desktop/userVars/${name}`,
        `Declared but never used in the mcp overlay. The desktop would prompt the user for a ` +
          'value it then throws away.'
      )
    }
    if (name.endsWith('_PORT') && !/^\d{2,5}$/.test(spec.default ?? '')) {
      report.fatal(
        'artyx.uservar.port-default',
        target,
        `plugin.json /extensions/ai.artyx.desktop/userVars/${name}`,
        'A port variable needs a numeric "default" so the install dialog is pre-filled and ' +
          'the portable mcp.json has a literal port to match.'
      )
    }
  }

  // Advisory: a stdio server launched through a package runner depends on that
  // runner being on PATH, and the desktop preflights `requires` before spawn.
  const requires = new Set(extension.requires ?? [])
  for (const [serverName, portable] of Object.entries(portableServers)) {
    const merged = mergeOverlay(portable, overlay[serverName])
    if (merged.type !== 'stdio' || typeof merged.command !== 'string') continue
    const command = merged.command.split('/').pop()
    if (RUNTIME_COMMANDS.has(command) && !requires.has(command)) {
      report.warn(
        'artyx.requires.missing',
        target,
        'plugin.json /extensions/ai.artyx.desktop/requires',
        `Server "${serverName}" launches through "${command}". List it in "requires" so the ` +
          'desktop can check for it before spawning and give a clear error instead of ENOENT.'
      )
    }
  }
}
