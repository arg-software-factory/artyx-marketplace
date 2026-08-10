#!/usr/bin/env node
/**
 * Validate every package in this repository against Agent Plugins 1.0.0 and
 * against Artyx's own rules.
 *
 *   node scripts/validate.mjs                  # publishing policy (what CI runs)
 *   node scripts/validate.mjs --spec-report    # exactly what the standard says
 *   node scripts/validate.mjs --plugin blender # one package
 *   node scripts/validate.mjs --json           # machine-readable
 *   node scripts/validate.mjs --root ./tests/fixtures/x   # validate elsewhere
 *
 * Default mode is stricter than the specification, on purpose. A conformant
 * client tolerates an unknown top-level field and a skipped server; a curated
 * first-party marketplace should never ship either. `--spec-report` drops back
 * to the standard's own severities and is how we show conformance.
 */

import { readFile } from 'node:fs/promises'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Report, printText, printJson, AXIS } from './lib/report.mjs'
import { validateSpecPlugin } from './lib/spec-plugin.mjs'
import { validateSpecMcp } from './lib/spec-mcp.mjs'
import { validateSpecSkills } from './lib/spec-skills.mjs'
import { validateArtyxExtension } from './lib/artyx-extension.mjs'
import {
  validatePluginAssets,
  validateCatalog,
  validateAgentPreset,
  listDirectories,
  pathExists
} from './lib/artyx-repo.mjs'

const SELF_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SELF_DIR, '..')

function parseArgs(argv) {
  const options = { json: false, mode: 'strict', plugin: null, root: REPO_ROOT }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--json') options.json = true
    else if (arg === '--spec-report') options.mode = 'spec'
    else if (arg === '--plugin') options.plugin = argv[++index]
    else if (arg === '--root') options.root = resolve(argv[++index])
    else if (arg === '--help' || arg === '-h') options.help = true
    else {
      console.error(`Unknown argument: ${arg}`)
      process.exit(2)
    }
  }
  return options
}

async function validateOnePlugin({ repoRoot, contentRoot, name, report, manifestNames }) {
  const pluginRoot = join(contentRoot, 'plugins', name)
  const target = name

  let raw
  try {
    raw = await readFile(join(pluginRoot, 'plugin.json'), 'utf8')
  } catch {
    report.fatal(
      'plugin.manifest.missing',
      target,
      'plugin.json',
      'No plugin.json at the package root. The location is fixed by the specification — a ' +
        'manifest anywhere else is invisible to every client.'
    )
    return
  }

  const { manifest, extension } = await validateSpecPlugin({ repoRoot, target, raw, report })

  // The specification is explicit: a rejected plugin has no components
  // discovered or executed. Reporting skill problems for a plugin that cannot
  // load would misrepresent what a client does.
  if (!manifest) {
    report.warn(
      'plugin.discovery.skipped',
      target,
      '',
      'Component discovery skipped: a rejected manifest means no skills and no MCP servers ' +
        'are loaded. Fix plugin.json, then run again.'
    )
    return
  }

  manifestNames.set(name, manifest.name)

  let mcp = null
  if (await pathExists(join(pluginRoot, 'mcp.json'))) {
    const mcpRaw = await readFile(join(pluginRoot, 'mcp.json'), 'utf8')
    mcp = await validateSpecMcp({ repoRoot, target, raw: mcpRaw, report })
  }

  if (await pathExists(join(pluginRoot, '.mcp.json'))) {
    report.fatal(
      'plugin.mcp.dotfile',
      target,
      '.mcp.json',
      'The MCP configuration path is "mcp.json" at the package root. A dot-prefixed file is ' +
        'never discovered.'
      ,
      AXIS.ARTYX
    )
  }
  if (await pathExists(join(pluginRoot, '.artyx-plugin'))) {
    report.fatal(
      'plugin.legacy-layout',
      target,
      '.artyx-plugin/',
      'The pre-1.0.0 manifest directory. Delete it — the manifest lives at plugin.json.'
      ,
      AXIS.ARTYX
    )
  }

  const skills = await validateSpecSkills({ target, pluginRoot, report })
  const artyx = await validateArtyxExtension({ repoRoot, target, extension, mcp, report })
  if (skills.length === 0 && !mcp && artyx.assetAdapterCount === 0) {
    report.fatal(
      'plugin.no-components',
      target,
      '',
      'No discoverable skill, MCP server, or asset adapter. The package does nothing.'
      ,
      AXIS.ARTYX
    )
  }

  await validatePluginAssets({ target, pluginRoot, report, manifest, extension })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(await readFile(fileURLToPath(import.meta.url), 'utf8').then((s) => s.split('*/')[0]))
    return
  }

  const contentRoot = options.root
  const report = new Report()
  const manifestNames = new Map()

  const allPlugins = await listDirectories(join(contentRoot, 'plugins'))
  const plugins = options.plugin ? allPlugins.filter((p) => p === options.plugin) : allPlugins

  if (options.plugin && plugins.length === 0) {
    console.error(`No plugin named "${options.plugin}" under ${join(contentRoot, 'plugins')}`)
    process.exit(2)
  }

  for (const name of plugins) {
    await validateOnePlugin({
      repoRoot: REPO_ROOT,
      contentRoot,
      name,
      report,
      manifestNames
    })
  }

  const agents = await listDirectories(join(contentRoot, 'agents'))
  for (const name of agents) {
    await validateAgentPreset({
      repoRoot: REPO_ROOT,
      agentsRoot: join(contentRoot, 'agents'),
      name,
      report
    })
  }

  // Whole-repository checks only make sense over the whole repository.
  if (!options.plugin) {
    await validateCatalog({
      repoRoot: contentRoot,
      report,
      pluginDirs: allPlugins,
      manifestNames,
      agentDirs: agents
    })
  }

  const targets = [...plugins, ...agents.map((a) => `agent:${a}`)]
  const printer = options.json ? printJson : printText
  console.log(printer(report, { mode: options.mode, targets }))

  const failures = options.mode === 'spec' ? report.specFailures : report.publishFailures
  process.exit(failures.length === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(2)
})
