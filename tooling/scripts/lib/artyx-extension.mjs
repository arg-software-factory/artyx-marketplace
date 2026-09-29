/**
 * extensions["ai.artyx.desktop"].
 *
 * Agent Plugins gives this namespace no meaning, so everything here is our own
 * contract. The structural half lives in tooling/schemas/artyx/extension.schema.json;
 * this file adds the rules that tie a user setting back to something real.
 *
 * MCP configuration lives only in the portable mcp.json (spec 7.2.1), and it
 * must work, with its literal values, in any standard client. A user setting
 * therefore never templates a string. It is applied by exactly one rule:
 *
 * - stdio server: the saved value becomes the env var of the same name,
 *   replacing the literal default that mcp.json declares for it.
 * - streamable-http server: a `port` var replaces the port of the url.
 *
 * So every userVar must name an env key a stdio server declares, or be a
 * `port` var on a plugin with a streamable-http url that carries that port.
 * Anything else is a setting the desktop would ask for and then throw away.
 *
 * Native-asset plugins are the exception. Their external runtimes are not MCP
 * and still take `${VAR}` placeholders in their own transport.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import Ajv from 'ajv/dist/2020.js'

import { AXIS } from './report.mjs'

const ANY_PLACEHOLDER = /\$\{([^}]*)\}/g
const HOST_VARS = new Set(['PLUGIN_ROOT', 'PLUGIN_DATA'])
const RUNTIME_COMMANDS = new Set(['npx', 'uvx', 'bunx', 'pipx', 'dotnet'])

let compiledExtensionValidator = null

async function loadExtensionValidator(repoRoot) {
  if (compiledExtensionValidator) return compiledExtensionValidator
  const schemaPath = join(repoRoot, 'tooling', 'schemas', 'artyx', 'extension.schema.json')
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
  const ajv = new Ajv({ allErrors: true, strict: false })
  compiledExtensionValidator = ajv.compile(schema)
  return compiledExtensionValidator
}

/** Walk every process string an external native runtime can carry. */
function* runtimeTransportStrings(runtime) {
  const transport = runtime.transport
  if (typeof transport.command === 'string') yield ['command', transport.command]
  if (typeof transport.cwd === 'string') yield ['cwd', transport.cwd]
  for (const [index, arg] of (transport.args ?? []).entries()) yield [`args/${index}`, arg]
  for (const [key, value] of Object.entries(transport.env ?? {})) yield [`env/${key}`, value]
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
    return { assetAdapterCount: 0 }
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
    return { assetAdapterCount: 0 }
  }

  const userVars = extension.userVars ?? {}
  const portableServers = mcp?.mcpServers ?? {}
  const referenced = new Set()

  if (extension.pluginClass === 'conversational') {
    checkUserVarBindings({ target, userVars, portableServers, referenced, report })
    checkConnectionCheck({ target, extension, portableServers, report })
  }

  const runtimeIds = new Set()
  const runtimes = new Map()
  for (const [index, runtime] of (extension.nativeRuntimes ?? []).entries()) {
    const pointer = `plugin.json /extensions/ai.artyx.desktop/nativeRuntimes/${index}`
    if (runtimeIds.has(runtime.id)) {
      report.fatal(
        'artyx.runtime.duplicate-id',
        target,
        `${pointer}/id`,
        `Native runtime id "${runtime.id}" is declared more than once.`
      )
    }
    runtimeIds.add(runtime.id)
    runtimes.set(runtime.id, runtime)

    if (runtime.delivery === 'bundled') {
      if (extension.pluginClass !== 'native-asset') {
        report.fatal(
          'artyx.runtime.bundled-class',
          target,
          pointer,
          'Bundled runtimes are legal only for native-asset plugins.'
        )
      }
      continue
    }

    for (const [field, value] of runtimeTransportStrings(runtime)) {
      const matches = [...String(value).matchAll(ANY_PLACEHOLDER)]
      for (const match of matches) {
        const name = match[1]
        if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
          report.fatal(
            'artyx.runtime.placeholder.invalid',
            target,
            `${pointer}/transport/${field}`,
            `Placeholder "${match[0]}" is invalid. Use an uppercase declared userVar, ` +
              '${PLUGIN_ROOT}, or ${PLUGIN_DATA}.'
          )
          continue
        }
        if (HOST_VARS.has(name)) {
          if (field === 'command') {
            report.fatal(
              'artyx.runtime.command.host-var',
              target,
              `${pointer}/transport/${field}`,
              `${match[0]} is not expanded in a runtime command. Use a literal executable or a declared userVar.`
            )
          }
          continue
        }
        referenced.add(name)
        if (!userVars[name]) {
          report.fatal(
            'artyx.runtime.undeclared-var',
            target,
            `${pointer}/transport/${field}`,
            `\${${name}} is not declared in userVars.`
          )
        }
      }
    }

    if (!runtime.transport.command.includes('${') && /\s/.test(runtime.transport.command)) {
      report.fatal(
        'artyx.runtime.command.tokens',
        target,
        `${pointer}/transport/command`,
        'command is one executable token. Put arguments in transport.args; the host never invokes a shell.'
      )
    }
  }

  const adapterIds = new Set()
  for (const [index, adapter] of (extension.assetAdapters ?? []).entries()) {
    const pointer = `plugin.json /extensions/ai.artyx.desktop/assetAdapters/${index}`

    if (adapterIds.has(adapter.id)) {
      report.fatal(
        'artyx.adapter.duplicate-id',
        target,
        `${pointer}/id`,
        `Adapter id "${adapter.id}" is declared more than once. Adapter runtime identity is ` +
          'plugin-name:id, so ids must be unique inside a plugin.'
      )
    }
    adapterIds.add(adapter.id)

    if (!runtimes.has(adapter.runtime)) {
      report.fatal(
        'artyx.adapter.unknown-runtime',
        target,
        `${pointer}/runtime`,
        `Adapter "${adapter.id}" references unknown native runtime "${adapter.runtime}".`
      )
    }

    const hintedExtensions = new Set()
    for (const [acceptIndex, accept] of adapter.accepts.entries()) {
      for (const extensionName of accept.extensions) {
        if (hintedExtensions.has(extensionName)) {
          report.fatal(
            'artyx.adapter.duplicate-extension',
            target,
            `${pointer}/accepts/${acceptIndex}/extensions`,
            `Extension hint "${extensionName}" appears in more than one accepts entry for ` +
              `adapter "${adapter.id}". Put every applicable kind on one hint instead.`
          )
        }
        hintedExtensions.add(extensionName)
      }
    }

    const profileIds = new Set()
    for (const profile of adapter.profiles) {
      if (profileIds.has(profile.id)) {
        report.fatal(
          'artyx.adapter.duplicate-profile',
          target,
          `${pointer}/profiles`,
          `Profile "${profile.id}" is declared more than once.`
        )
      }
      profileIds.add(profile.id)
    }
  }

  for (const [name, spec] of Object.entries(userVars)) {
    const pointer = `plugin.json /extensions/ai.artyx.desktop/userVars/${name}`
    if (!referenced.has(name)) {
      report.fatal(
        'artyx.uservar.orphan',
        target,
        pointer,
        extension.pluginClass === 'native-asset'
          ? 'Declared but never used in an asset-adapter transport. The desktop would prompt ' +
              'the user for a value it then throws away.'
          : 'Declared but bound to nothing. A userVar must be an env key that a stdio server ' +
              'in mcp.json declares, or a "port" var on a plugin with a streamable-http server. ' +
              'The desktop would prompt the user for a value it then throws away.'
      )
    }
    if (spec.type === 'port' && !isPort(spec.default)) {
      report.fatal(
        'artyx.uservar.port-default',
        target,
        `${pointer}/default`,
        'A port var needs a "default" between 1 and 65535, so install is one click and the ' +
          'portable configuration stays the default case.'
      )
    }
    if (spec.type !== 'port' && name.endsWith('_PORT')) {
      report.fatal(
        'artyx.uservar.port-type',
        target,
        `${pointer}/type`,
        `"${name}" is a port. Declare it with "type": "port" so the desktop validates the ` +
          'range and can probe for it.'
      )
    }
  }

  // Advisory: a stdio server launched through a package runner depends on that
  // runner being on PATH, and the desktop preflights `requires` before spawn.
  const requires = new Set(extension.requires ?? [])
  for (const [serverName, portable] of Object.entries(portableServers)) {
    if (portable?.type !== 'stdio' || typeof portable.command !== 'string') continue
    const command = portable.command.split('/').pop()
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
  for (const [index, runtime] of (extension.nativeRuntimes ?? []).entries()) {
    if (runtime.delivery !== 'external') continue
    const command = runtime.transport.command
    if (command.includes('${')) continue
    const executable = command.replaceAll('\\', '/').split('/').pop()
    if (RUNTIME_COMMANDS.has(executable) && !requires.has(executable)) {
      report.warn(
        'artyx.requires.missing',
        target,
        'plugin.json /extensions/ai.artyx.desktop/requires',
        `Native runtime "${runtime.id}" launches through "${executable}". List it in ` +
          '"requires" so the desktop can fail preflight with a clear diagnostic.'
      )
    }
  }

  return { assetAdapterCount: extension.assetAdapters?.length ?? 0 }
}

function isPort(value) {
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,4}$/.test(value)) return false
  return Number(value) <= 65535
}

/** The explicit port of a url, or null when it has none or cannot be parsed. */
function urlPort(url) {
  try {
    const parsed = new URL(url)
    return parsed.port === '' ? null : parsed.port
  } catch {
    return null
  }
}

/**
 * D2: a saved value is applied by exactly one rule, so each var must match one.
 * The default must also equal the literal the portable file already carries;
 * otherwise a client that ignores our namespace runs a different configuration
 * from the one Artyx calls "default".
 */
function checkUserVarBindings({ target, userVars, portableServers, referenced, report }) {
  const stdio = Object.entries(portableServers).filter(([, server]) => server?.type === 'stdio')
  const http = Object.entries(portableServers).filter(
    ([, server]) => server?.type === 'streamable-http'
  )

  for (const [name, spec] of Object.entries(userVars)) {
    const pointer = `plugin.json /extensions/ai.artyx.desktop/userVars/${name}`
    const envBindings = stdio.filter(([, server]) =>
      Object.prototype.hasOwnProperty.call(server.env ?? {}, name)
    )

    if (envBindings.length > 0) {
      referenced.add(name)
      for (const [serverName, server] of envBindings) {
        const literal = server.env[name]
        if (spec.default !== undefined && String(spec.default) !== literal) {
          report.fatal(
            'artyx.uservar.default-drift',
            target,
            `${pointer}/default`,
            `The default is "${spec.default}" but mcp.json sets ${name}="${literal}" for ` +
              `server "${serverName}". They must be equal: the portable file is the default case.`
          )
        }
      }
      if (spec.default === undefined) {
        report.fatal(
          'artyx.uservar.default-missing',
          target,
          `${pointer}/default`,
          `mcp.json declares ${name}; repeat its literal value as "default" so install is one ` +
            'click and the settings form shows what is in effect.'
        )
      }
      continue
    }

    if (spec.type === 'port' && http.length > 0) {
      referenced.add(name)
      for (const [serverName, server] of http) {
        const port = urlPort(server.url)
        if (port === null) {
          report.fatal(
            'artyx.uservar.port-url',
            target,
            `${pointer}`,
            `Server "${serverName}" has no explicit port in its url, so there is nothing for ` +
              `${name} to replace. Write the port into mcp.json.`
          )
        } else if (spec.default !== undefined && String(spec.default) !== port) {
          report.fatal(
            'artyx.uservar.default-drift',
            target,
            `${pointer}/default`,
            `The default is "${spec.default}" but the url of server "${serverName}" uses port ` +
              `${port}. They must be equal: the portable file is the default case.`
          )
        }
      }
      continue
    }
  }
}

function checkConnectionCheck({ target, extension, portableServers, report }) {
  if (!extension.check) return
  if (Object.keys(portableServers).length === 0) {
    report.fatal(
      'artyx.check.no-server',
      target,
      'plugin.json /extensions/ai.artyx.desktop/check',
      '"check" names a tool to call after connecting, but this plugin has no MCP server.'
    )
  }
}
