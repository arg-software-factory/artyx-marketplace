/**
 * plugin.json against Agent Plugins 1.0.0, section 5.
 *
 * The published schema and the specification text disagree in exactly two
 * places, and getting that disagreement right is the whole job of this file.
 *
 * The schema sets `additionalProperties: false`, so a validator flags an
 * unknown top-level field as an error. The specification says the opposite:
 * report it, ignore it, and keep loading. The same holds for a non-object
 * `extensions`. Every other violation really is fatal.
 *
 * We do not patch the vendored schema to paper over this. We run it as
 * published and then re-classify those two error shapes. Patching would make
 * the vendored copy a fork, and the whole point of vendoring is that
 * conformance stays a `diff` against upstream.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import Ajv from 'ajv/dist/2020.js'

import { SEVERITY } from './report.mjs'

export const PLUGIN_SCHEMA_URL = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
export const MCP_SCHEMA_URL = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'
export const SPEC_VERSION = '1.0.0'

/** The complete closed field set. It can never grow within 1.0.0. */
export const SPEC_TOP_LEVEL_FIELDS = Object.freeze([
  '$schema',
  'name',
  'version',
  'description',
  'author',
  'homepage',
  'repository',
  'license',
  'keywords',
  'extensions'
])

let compiledPluginValidator = null

export async function loadPluginValidator(repoRoot) {
  if (compiledPluginValidator) return compiledPluginValidator
  const schemaPath = join(repoRoot, 'schemas', SPEC_VERSION, 'plugin.schema.json')
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
  const ajv = new Ajv({ allErrors: true, strict: false })
  compiledPluginValidator = ajv.compile(schema)
  return compiledPluginValidator
}

/**
 * Decide whether one ajv error is one of the specification's two non-fatal
 * carve-outs.
 *
 * Note the asymmetry, which is easy to get backwards: a non-object
 * `extensions` is tolerated, but a non-object VALUE inside `extensions` is a
 * plain schema violation and therefore fatal. Only the outer field is carved
 * out.
 */
function classifyError(error) {
  if (error.instancePath === '' && error.keyword === 'additionalProperties') {
    return {
      severity: SEVERITY.IGNORED,
      code: 'plugin.field.unknown',
      message:
        `Unknown top-level field "${error.params.additionalProperty}". A conformant client ` +
        `reports and ignores it, so the plugin still loads, but the data is invisible. ` +
        `Client-specific data belongs under extensions["ai.artyx.desktop"].`
    }
  }
  if (error.instancePath === '/extensions' && error.keyword === 'type') {
    return {
      severity: SEVERITY.IGNORED,
      code: 'plugin.extensions.not-object',
      message: '"extensions" must be an object. A conformant client reports and ignores it.'
    }
  }
  return null
}

function describeError(error) {
  const where = error.instancePath || '/'
  if (error.keyword === 'additionalProperties') {
    return `${where}: unexpected field "${error.params.additionalProperty}"`
  }
  if (error.keyword === 'required') {
    return `${where}: missing required field "${error.params.missingProperty}"`
  }
  if (error.keyword === 'pattern') {
    return `${where}: does not match ${error.params.pattern}`
  }
  return `${where}: ${error.message}`
}

/**
 * @returns {{ manifest: object | null, extension: object | null }}
 *   `manifest` is null when the plugin must be rejected outright.
 */
export async function validateSpecPlugin({ repoRoot, target, raw, report }) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    report.fatal('plugin.json.invalid', target, 'plugin.json', `Not valid JSON: ${error.message}`)
    return { manifest: null, extension: null }
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    report.fatal('plugin.type.invalid', target, 'plugin.json', 'The manifest must be a JSON object.')
    return { manifest: null, extension: null }
  }

  // $schema selects the rules, so it is checked before the rules run. A client
  // must never fetch it — validation always uses the vendored copy.
  if (parsed.$schema === undefined) {
    report.fatal(
      'plugin.schema.missing',
      target,
      'plugin.json /$schema',
      `"$schema" is required and must be "${PLUGIN_SCHEMA_URL}". It declares which ` +
        'Agent Plugins version the package targets.'
    )
    return { manifest: null, extension: null }
  }
  if (parsed.$schema !== PLUGIN_SCHEMA_URL) {
    report.fatal(
      'plugin.schema.unsupported',
      target,
      'plugin.json /$schema',
      `Unsupported Agent Plugins version "${parsed.$schema}". This repository targets ` +
        `${SPEC_VERSION} only, so the value must be "${PLUGIN_SCHEMA_URL}".`
    )
    return { manifest: null, extension: null }
  }

  const validate = await loadPluginValidator(repoRoot)
  let fatalCount = 0
  if (!validate(parsed)) {
    for (const error of validate.errors ?? []) {
      const carveOut = classifyError(error)
      if (carveOut) {
        report.ignored(carveOut.code, target, 'plugin.json', carveOut.message)
        continue
      }
      fatalCount += 1
      report.fatal('plugin.schema.violation', target, 'plugin.json', describeError(error))
    }
  }

  if (fatalCount > 0) return { manifest: null, extension: null }

  // Rules the schema deliberately does not enforce, because the specification
  // says a client MUST NOT reject a plugin for them. They are Artyx publishing
  // policy, so they are warnings here and never fatal.
  if (parsed.version === undefined) {
    report.warn(
      'plugin.version.missing',
      target,
      'plugin.json /version',
      'No "version". The specification allows this, but Artyx keys its immutable ' +
        'per-version cache on it, so a published plugin needs one.'
    )
  } else if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(parsed.version)) {
    report.warn(
      'plugin.version.not-semver',
      target,
      'plugin.json /version',
      `"${parsed.version}" is not Semantic Versioning. A conformant client must accept it, ` +
        'but Artyx uses it as a filesystem path segment and to compare updates.'
    )
  }

  if (parsed.description === undefined) {
    report.warn(
      'plugin.description.missing',
      target,
      'plugin.json /description',
      'No "description". It is optional in the specification but it is what the ' +
        'storefront detail view shows.'
    )
  }

  const extension = readArtyxExtension(parsed)
  return { manifest: parsed, extension }
}

/** Namespaces a client does not implement are ignored without reading their contents. */
export function readArtyxExtension(manifest) {
  const extensions = manifest.extensions
  if (!extensions || typeof extensions !== 'object' || Array.isArray(extensions)) return null
  const value = extensions['ai.artyx.desktop']
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value
}
