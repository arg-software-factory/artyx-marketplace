/**
 * Repository-level rules. None of this is Agent Plugins: the specification
 * says nothing about registries, distribution, or what a curated catalog
 * should contain. These are the rules that keep THIS repository coherent.
 */

import { readdir, readFile, lstat, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { createHash } from 'node:crypto'

import Ajv from 'ajv/dist/2020.js'
import { parse as parseYaml } from 'yaml'

import { AXIS } from './report.mjs'

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const MAX_LOGO_BYTES = 256 * 1024
const MAX_AGENT_BODY_BYTES = 12 * 1024

/**
 * A plugin is client configuration. It points at an official or third-party
 * MCP server or asset adapter; it never ships executable code. Bundled code would mean this repository
 * distributes executables straight into a user's machine through a git
 * checkout, with no review surface beyond a diff.
 */
const CODE_EXTENSIONS = new Set([
  '.js', '.cjs', '.mjs', '.ts', '.mts', '.cts',
  '.py', '.rb', '.sh', '.bash', '.zsh', '.ps1',
  '.bat', '.cmd', '.exe', '.dll', '.dylib', '.so'
])

const compiled = new Map()

async function loadValidator(repoRoot, name) {
  if (compiled.has(name)) return compiled.get(name)
  const schema = JSON.parse(await readFile(join(repoRoot, 'schemas', 'artyx', name), 'utf8'))
  const validator = new Ajv({ allErrors: true, strict: false }).compile(schema)
  compiled.set(name, validator)
  return validator
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
  if (error.keyword === 'const') return `${where}: must be ${JSON.stringify(error.params.allowedValue)}`
  if (error.keyword === 'pattern') return `${where}: does not match ${error.params.pattern}`
  return `${where}: ${error.message}`
}

async function walk(dir, base = '') {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isSymbolicLink()) {
      out.push({ rel, kind: 'symlink' })
    } else if (entry.isDirectory()) {
      out.push({ rel, kind: 'dir' })
      out.push(...(await walk(join(dir, entry.name), rel)))
    } else if (entry.isFile()) {
      out.push({ rel, kind: 'file' })
    } else {
      out.push({ rel, kind: 'other' })
    }
  }
  return out
}

export async function validatePluginAssets({ target, pluginRoot, report: reportRaw, manifest, extension }) {
  const report = reportRaw.scoped(AXIS.ARTYX)
  const entries = await walk(pluginRoot)
  const bundled = new Map()
  for (const runtime of extension?.nativeRuntimes ?? []) {
    if (runtime.delivery !== 'bundled') continue
    for (const artifact of runtime.artifacts) {
      bundled.set(artifact.path.replace(/^\.\//, ''), artifact)
    }
  }
  const officialPublisher = manifest?.author?.name === 'Artyx'

  for (const entry of entries) {
    if (entry.kind === 'symlink') {
      report.fatal(
        'plugin.symlink',
        target,
        entry.rel,
        'Symlinks are not allowed. A package must be exactly what the diff shows.'
      )
      continue
    }
    if (entry.kind === 'other') {
      report.fatal('plugin.special-file', target, entry.rel, 'Not a regular file or directory.')
      continue
    }
    if (entry.kind === 'dir' && entry.rel.split('/').pop() === 'server') {
      report.fatal(
        'plugin.bundled-server',
        target,
        entry.rel,
        'A plugin connects to an external MCP server or asset adapter; it never ships one. ' +
          'Point the manifest at an externally installed runtime instead.'
      )
      continue
    }
    if (entry.kind === 'file' && CODE_EXTENSIONS.has(extname(entry.rel).toLowerCase())) {
      const declaration = bundled.get(entry.rel)
      if (declaration && officialPublisher) continue
      report.fatal(
        'plugin.bundled-code',
        target,
        entry.rel,
        `Executable code (${extname(entry.rel)}) must not ship inside a plugin. Plugins are ` +
          'configuration and documentation only.'
      )
    }
  }

  for (const [rel, declaration] of bundled) {
    if (!officialPublisher) {
      report.fatal(
        'plugin.bundled-code.publisher',
        target,
        rel,
        'Bundled native runtimes are restricted to the Artyx official publisher.'
      )
      continue
    }
    let bytes
    try {
      bytes = await readFile(join(pluginRoot, rel))
    } catch {
      report.fatal('plugin.bundled-code.missing', target, rel, 'Declared bundled artifact is missing.')
      continue
    }
    const actual = createHash('sha256').update(bytes).digest('hex')
    if (actual !== declaration.sha256) {
      report.fatal(
        'plugin.bundled-code.hash',
        target,
        rel,
        `Bundled artifact SHA-256 is ${actual}, manifest declares ${declaration.sha256}.`
      )
    }
  }

  const logoPath = join(pluginRoot, 'logo.png')
  let logoStats
  try {
    logoStats = await lstat(logoPath)
  } catch {
    report.fatal(
      'plugin.logo.missing',
      target,
      'logo.png',
      'Every plugin needs a logo.png at its root. The path is a convention, not a manifest ' +
        'field, so there is nothing to keep in sync.'
    )
    return
  }
  if (!logoStats.isFile()) {
    report.fatal('plugin.logo.kind', target, 'logo.png', 'logo.png must be a regular file.')
    return
  }
  if (logoStats.size > MAX_LOGO_BYTES) {
    report.fatal(
      'plugin.logo.size',
      target,
      'logo.png',
      `${logoStats.size} bytes exceeds the ${MAX_LOGO_BYTES} byte limit. The desktop inlines ` +
        'it as a data URI.'
    )
  }
  const head = (await readFile(logoPath)).subarray(0, PNG_MAGIC.length)
  if (!head.equals(PNG_MAGIC)) {
    report.fatal('plugin.logo.format', target, 'logo.png', 'Not a PNG (magic bytes do not match).')
  }
}

export async function validateCatalog({ repoRoot, report: reportRaw, pluginDirs, manifestNames, agentDirs }) {
  const report = reportRaw.scoped(AXIS.ARTYX)
  const target = 'marketplace'
  const catalogPath = join(repoRoot, '.agents', 'plugins', 'marketplace.json')

  let catalog
  try {
    catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
  } catch (error) {
    report.fatal('catalog.invalid', target, '.agents/plugins/marketplace.json', error.message)
    return
  }

  const validate = await loadValidator(repoRoot, 'marketplace.schema.json')
  if (!validate(catalog)) {
    for (const error of validate.errors ?? []) {
      report.fatal(
        'catalog.violation',
        target,
        '.agents/plugins/marketplace.json',
        describeError(error)
      )
    }
    return
  }

  const listed = new Set()
  for (const entry of catalog.plugins) {
    if (listed.has(entry.name)) {
      report.fatal('catalog.duplicate', target, entry.name, 'Listed more than once.')
      continue
    }
    listed.add(entry.name)

    if (entry.source.path !== `./plugins/${entry.name}`) {
      report.fatal(
        'catalog.path-mismatch',
        target,
        entry.name,
        `source.path is "${entry.source.path}" but must be "./plugins/${entry.name}".`
      )
    }
    if (!pluginDirs.includes(entry.name)) {
      report.fatal('catalog.orphan-entry', target, entry.name, 'No such directory under plugins/.')
      continue
    }
    const manifestName = manifestNames.get(entry.name)
    if (manifestName !== undefined && manifestName !== entry.name) {
      report.fatal(
        'catalog.name-mismatch',
        target,
        entry.name,
        `The manifest declares name "${manifestName}". The catalog entry, the directory, and ` +
          'the manifest must all agree.'
      )
    }
  }

  for (const dir of pluginDirs) {
    if (!listed.has(dir)) {
      report.fatal(
        'catalog.unlisted-plugin',
        target,
        dir,
        'Exists under plugins/ but is not in the catalog, so the desktop never offers it.'
      )
    }
  }

  const listedAgents = new Set((catalog.agents ?? []).map((a) => a.name))
  for (const entry of catalog.agents ?? []) {
    if (entry.source.path !== `./agents/${entry.name}`) {
      report.fatal(
        'catalog.agent-path',
        target,
        entry.name,
        `source.path is "${entry.source.path}" but must be "./agents/${entry.name}".`
      )
    }
    if (!agentDirs.includes(entry.name)) {
      report.fatal('catalog.orphan-agent', target, entry.name, 'No such directory under agents/.')
    }
  }
  for (const dir of agentDirs) {
    if (!listedAgents.has(dir)) {
      report.fatal('catalog.unlisted-agent', target, dir, 'Exists under agents/ but is not listed.')
    }
  }
}

export async function validateAgentPreset({ repoRoot, agentsRoot, name, report: reportRaw }) {
  const report = reportRaw.scoped(AXIS.ARTYX)
  const target = `agent:${name}`
  const agentDir = join(agentsRoot, name)
  const mdPath = join(agentDir, 'agent.md')

  const dirStats = await lstat(agentDir)
  if (!dirStats.isDirectory()) {
    report.fatal('agent.dir.kind', target, name, 'Not a directory.')
    return
  }

  let raw
  try {
    const stats = await lstat(mdPath)
    if (!stats.isFile()) {
      report.fatal('agent.md.kind', target, 'agent.md', 'agent.md must be a regular file.')
      return
    }
    raw = await readFile(mdPath, 'utf8')
  } catch {
    report.fatal('agent.md.missing', target, 'agent.md', 'Every agent preset needs an agent.md.')
    return
  }

  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  if (lines[0]?.trim() !== '---') {
    report.fatal('agent.frontmatter.missing', target, 'agent.md', 'Missing the opening "---" fence.')
    return
  }
  const close = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  if (close < 0) {
    report.fatal('agent.frontmatter.missing', target, 'agent.md', 'Missing the closing "---" fence.')
    return
  }

  let parsed
  try {
    parsed = parseYaml(lines.slice(1, close).join('\n'))
  } catch (error) {
    report.fatal('agent.frontmatter.invalid', target, 'agent.md', `Invalid YAML — ${error.message}`)
    return
  }

  const validate = await loadValidator(repoRoot, 'agent.schema.json')
  if (!validate(parsed)) {
    for (const error of validate.errors ?? []) {
      report.fatal('agent.violation', target, 'agent.md', describeError(error))
    }
  }

  const body = lines.slice(close + 1).join('\n').trim()
  if (body.length === 0) {
    report.fatal('agent.body.empty', target, 'agent.md', 'No system prompt after the frontmatter.')
  } else if (Buffer.byteLength(body, 'utf8') > MAX_AGENT_BODY_BYTES) {
    report.warn(
      'agent.body.long',
      target,
      'agent.md',
      `${Buffer.byteLength(body, 'utf8')} bytes. Every run pays for this prompt; keep it tight.`
    )
  }

  const logoPath = join(agentDir, 'logo.png')
  try {
    const stats = await lstat(logoPath)
    if (!stats.isFile()) {
      report.fatal('agent.logo.kind', target, 'logo.png', 'logo.png must be a regular file.')
    } else if (stats.size > MAX_LOGO_BYTES) {
      report.fatal('agent.logo.size', target, 'logo.png', `${stats.size} bytes exceeds the limit.`)
    } else {
      const head = (await readFile(logoPath)).subarray(0, PNG_MAGIC.length)
      if (!head.equals(PNG_MAGIC)) {
        report.fatal('agent.logo.format', target, 'logo.png', 'Not a PNG.')
      }
    }
  } catch {
    // A logo is optional for an agent preset.
  }
}

export async function listDirectories(path) {
  try {
    const entries = await readdir(path, { withFileTypes: true })
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
  } catch {
    return []
  }
}

export async function pathExists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}
