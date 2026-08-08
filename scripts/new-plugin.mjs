#!/usr/bin/env node
/**
 * Scaffold a new plugin package under plugins/<name>/.
 *
 * This script writes the files a plugin needs to pass the validator on the
 * parts a machine can decide, and leaves everything else as a TODO for a
 * human: the logo, the skill instructions, the companion setup steps, the
 * README prose, and the long-form plugin.json description. Run the validator
 * after scaffolding — it prints exactly what is left.
 *
 *   node scripts/new-plugin.mjs --name blender --display Blender \
 *     --tagline "Build and animate 3D scenes in a live Blender session." \
 *     --category Creativity --transport streamable-http \
 *     --url http://127.0.0.1:8000/ --user-var BLENDER_MCP_PORT=8000 \
 *     --skill blender-mcp
 *
 *   node scripts/new-plugin.mjs --name godot --display Godot \
 *     --tagline "Launch Godot, run projects, and read debug output." \
 *     --category "Developer Tools" --transport stdio \
 *     --command npx --arg -y --arg @coding-solo/godot-mcp \
 *     --user-var GODOT_PATH --skill godot-mcp
 *
 *   node scripts/new-plugin.mjs --interactive
 *   node scripts/new-plugin.mjs --name foo ... --dry-run
 *
 * ## The two overlay patterns this script wires automatically
 *
 * The portable mcp.json must be literal and working on its own — a client
 * expands no placeholder in "url", "command", or header values. Anything the
 * user configures lives in extensions["ai.artyx.desktop"].mcp instead, a
 * per-server patch. This script can only generate that patch correctly for
 * two shapes:
 *
 * 1. A "_PORT"-suffixed user var whose default is literally the port in
 *    --url (streamable-http or sse). mcp.json keeps the literal port; the
 *    overlay templates it as "${VAR}" in the url.
 * 2. Any user var on a stdio transport. It scaffolds into the overlay's
 *    "env". mcp.json's own env gets the literal default when one is given
 *    (nothing to merge otherwise — see the godot plugin, whose GODOT_PATH
 *    has no default and so no entry in the portable env at all).
 *
 * Anything else — a non-port var on an HTTP transport, more than one port
 * var, a var with --transport none — has no safe automatic mapping, so the
 * script refuses and tells you why instead of writing something that fails
 * `artyx.overlay.default-drift` or `artyx.uservar.orphan` on the first run.
 */

import { mkdir, writeFile, readFile, rm, lstat } from 'node:fs/promises'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'

const SELF_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SELF_DIR, '..')
const PLUGINS_DIR = join(REPO_ROOT, 'plugins')
const CATALOG_PATH = join(REPO_ROOT, '.agents', 'plugins', 'marketplace.json')

const PLUGIN_SCHEMA_URL = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
const MCP_SCHEMA_URL = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'

const NAME_PATTERN = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/
const SKILL_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const USER_VAR_NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/
const CATEGORIES = ['Creativity', 'Developer Tools']
const TRANSPORTS = ['streamable-http', 'stdio', 'none']
const RUNTIME_COMMANDS = new Set(['npx', 'uvx', 'bunx', 'pipx'])

class ScaffoldError extends Error {}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function usage() {
  return `Usage: node scripts/new-plugin.mjs --name <name> --display <name> \\
  --tagline <text> --category <Creativity|Developer Tools> \\
  --transport <streamable-http|stdio|none> \\
  [--url <url>] [--command <cmd>] [--arg <token>]... \\
  [--user-var NAME[=default]]... [--skill <slug>]... [--experimental] \\
  [--interactive] [--dry-run]

Run with --interactive to be prompted for anything missing.
Run with --dry-run to print the plan without writing anything.
`
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const options = {
    name: null,
    display: null,
    tagline: null,
    category: null,
    transport: null,
    url: null,
    command: null,
    args: [],
    userVarsRaw: [],
    skills: [],
    experimental: false,
    interactive: false,
    dryRun: false,
    help: false
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = () => argv[++i]
    switch (arg) {
      case '--name': options.name = next(); break
      case '--display': options.display = next(); break
      case '--tagline': options.tagline = next(); break
      case '--category': options.category = next(); break
      case '--transport': options.transport = next(); break
      case '--url': options.url = next(); break
      case '--command': options.command = next(); break
      case '--arg': options.args.push(next()); break
      case '--user-var': options.userVarsRaw.push(next()); break
      case '--skill': options.skills.push(next()); break
      case '--experimental': options.experimental = true; break
      case '--interactive': options.interactive = true; break
      case '--dry-run': options.dryRun = true; break
      case '--help':
      case '-h': options.help = true; break
      default:
        throw new ScaffoldError(`Unknown argument: ${arg}\n\n${usage()}`)
    }
  }
  return options
}

function parseUserVarSpec(raw) {
  const eq = raw.indexOf('=')
  const name = eq === -1 ? raw : raw.slice(0, eq)
  const value = eq === -1 ? undefined : raw.slice(eq + 1)
  return { name, default: value }
}

// ---------------------------------------------------------------------------
// Interactive prompts — fills in whatever a flag did not supply.
// ---------------------------------------------------------------------------

async function fillInteractive(options) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const ask = async (question, fallback) => {
    const suffix = fallback ? ` [${fallback}] ` : ' '
    const answer = (await rl.question(`${question}${suffix}`)).trim()
    return answer || fallback || ''
  }

  try {
    if (!options.name) options.name = await ask('Plugin name (matches the plugins/ directory):')
    if (!options.display) options.display = await ask('Display name (as the vendor writes it):')
    if (!options.tagline) options.tagline = await ask('Tagline for the storefront card:')
    if (!options.category) {
      options.category = await ask(`Category (${CATEGORIES.join(' | ')}):`, CATEGORIES[1])
    }
    if (!options.transport) {
      options.transport = await ask(`Transport (${TRANSPORTS.join(' | ')}):`, 'stdio')
    }
    if (options.transport === 'streamable-http' && !options.url) {
      options.url = await ask('MCP endpoint URL (e.g. http://127.0.0.1:8000/):')
    }
    if (options.transport === 'stdio' && !options.command) {
      options.command = await ask('Command to spawn (e.g. npx):')
      if (options.args.length === 0) {
        const line = await ask('Args, space-separated (blank for none):')
        if (line) options.args = line.split(/\s+/)
      }
    }
    if (options.skills.length === 0) {
      const line = await ask('Skill slugs, comma-separated (blank for none):')
      if (line) options.skills = line.split(',').map((s) => s.trim()).filter(Boolean)
    }
    if (options.transport !== 'none' && options.userVarsRaw.length === 0) {
      const line = await ask('User vars as NAME or NAME=default, comma-separated (blank for none):')
      if (line) options.userVarsRaw = line.split(',').map((s) => s.trim()).filter(Boolean)
    }
    if (!options.experimental) {
      const flag = await ask('Mark the integration as experimental? (y/N):', 'N')
      options.experimental = /^y/i.test(flag)
    }
  } finally {
    rl.close()
  }
}

// ---------------------------------------------------------------------------
// Validation — fail closed on anything the validator would reject anyway, so
// the author hears about it now instead of after a round trip through CI.
// ---------------------------------------------------------------------------

function validateOptions(options) {
  const missing = []
  if (!options.name) missing.push('--name')
  if (!options.display) missing.push('--display')
  if (!options.tagline) missing.push('--tagline')
  if (!options.category) missing.push('--category')
  if (!options.transport) missing.push('--transport')
  if (missing.length > 0) {
    throw new ScaffoldError(
      `Missing required flag(s): ${missing.join(', ')}.\n` +
        `Pass them directly, or re-run with --interactive.\n\n${usage()}`
    )
  }

  if (!NAME_PATTERN.test(options.name)) {
    throw new ScaffoldError(
      `--name "${options.name}" is invalid: it must be lowercase letters, digits, "." and "-", ` +
        'with no leading/trailing/doubled "-" or "..", matching plugin.schema.json /name.'
    )
  }
  if (options.display.length < 1 || options.display.length > 40) {
    throw new ScaffoldError('--display must be 1-40 characters (extension.schema.json /interface/displayName).')
  }
  if (options.tagline.length < 1 || options.tagline.length > 100) {
    throw new ScaffoldError('--tagline must be 1-100 characters (extension.schema.json /interface/tagline).')
  }
  if (!CATEGORIES.includes(options.category)) {
    throw new ScaffoldError(`--category must be one of: ${CATEGORIES.join(', ')}.`)
  }
  if (!TRANSPORTS.includes(options.transport)) {
    throw new ScaffoldError(`--transport must be one of: ${TRANSPORTS.join(', ')}.`)
  }

  if (options.transport === 'streamable-http') {
    if (!options.url) throw new ScaffoldError('--transport streamable-http needs --url.')
    if (options.command || options.args.length > 0) {
      throw new ScaffoldError('--command/--arg are for --transport stdio, not streamable-http.')
    }
  } else if (options.transport === 'stdio') {
    if (!options.command) throw new ScaffoldError('--transport stdio needs --command.')
    if (options.url) throw new ScaffoldError('--url is for --transport streamable-http, not stdio.')
  } else if (options.transport === 'none') {
    if (options.url || options.command || options.args.length > 0) {
      throw new ScaffoldError('--transport none takes no --url, --command, or --arg.')
    }
    if (options.userVarsRaw.length > 0) {
      throw new ScaffoldError(
        '--transport none has no mcp.json for a --user-var to patch. Drop --user-var or pick a transport.'
      )
    }
  }

  for (const slug of options.skills) {
    if (!SKILL_SLUG_PATTERN.test(slug) || slug.length > 64) {
      throw new ScaffoldError(
        `--skill "${slug}" is invalid: 1-64 characters of a-z, 0-9 and hyphens, no leading, ` +
          'trailing, or doubled hyphen — it becomes both the directory and the SKILL.md name.'
      )
    }
  }

  const userVars = options.userVarsRaw.map(parseUserVarSpec)
  for (const { name } of userVars) {
    if (!USER_VAR_NAME_PATTERN.test(name) || name === 'PLUGIN_ROOT' || name === 'PLUGIN_DATA') {
      throw new ScaffoldError(
        `--user-var "${name}" is invalid: must match ^[A-Z][A-Z0-9_]*$ and must not be ` +
          'PLUGIN_ROOT or PLUGIN_DATA (extension.schema.json /userVars).'
      )
    }
  }
  const dupes = userVars.map((v) => v.name).filter((n, i, arr) => arr.indexOf(n) !== i)
  if (dupes.length > 0) throw new ScaffoldError(`--user-var repeats: ${[...new Set(dupes)].join(', ')}.`)

  return userVars
}

// ---------------------------------------------------------------------------
// Overlay planning — the part of the task that must get artyx.overlay.*
// right on the first run.
// ---------------------------------------------------------------------------

function humanizeVarName(name) {
  const KNOWN = { MCP: 'MCP', PORT: 'port', PATH: 'path', URL: 'URL' }
  return name
    .split('_')
    .filter(Boolean)
    .map((word, index) => {
      if (KNOWN[word]) return KNOWN[word]
      const lower = word.toLowerCase()
      return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower
    })
    .join(' ')
}

/**
 * @returns {{ userVars: object, overlayServer: object, portableEnv: object }}
 */
function planOverlay({ transport, serverName, url, userVars: userVarSpecs }) {
  const userVars = {}
  const overlayServer = {}
  const portableEnv = {}

  if (userVarSpecs.length === 0) return { userVars, overlayServer, portableEnv }

  if (transport === 'streamable-http') {
    const portVars = userVarSpecs.filter((v) => v.name.endsWith('_PORT'))
    const others = userVarSpecs.filter((v) => !v.name.endsWith('_PORT'))
    if (others.length > 0) {
      throw new ScaffoldError(
        `--user-var ${others.map((v) => v.name).join(', ')}: only a "_PORT"-suffixed var can be ` +
          'auto-wired into a streamable-http overlay, because that is the one place this script ' +
          'knows how to template the portable url. Scaffold without it and add ' +
          'extensions["ai.artyx.desktop"].mcp by hand.'
      )
    }
    if (portVars.length > 1) {
      throw new ScaffoldError(
        'Only one "_PORT" user var is supported with streamable-http — there is only one --url ' +
          'to template.'
      )
    }
    const [portVar] = portVars
    if (!portVar.default || !/^\d{2,5}$/.test(portVar.default)) {
      throw new ScaffoldError(
        `--user-var ${portVar.name} ends in "_PORT" and needs a numeric default, e.g. ` +
          `--user-var ${portVar.name}=8000 (artyx.uservar.port-default).`
      )
    }
    const portRegex = new RegExp(`:${escapeRegExp(portVar.default)}(?=[/:?#]|$)`)
    if (!portRegex.test(url)) {
      throw new ScaffoldError(
        `--user-var ${portVar.name}=${portVar.default}: "${portVar.default}" is not the port in ` +
          `--url "${url}". Make --url end in ":${portVar.default}" (optionally followed by a ` +
          'path), or change the default to match.'
      )
    }
    overlayServer.url = url.replace(portRegex, `:\${${portVar.name}}`)
    userVars[portVar.name] = {
      label: humanizeVarName(portVar.name),
      description: `Port where the ${serverName} server is listening. Defaults to ${portVar.default}.`,
      default: portVar.default
    }
    return { userVars, overlayServer, portableEnv }
  }

  // transport === 'stdio': every declared var scaffolds into the overlay's
  // env, per the godot plugin. A default becomes the portable file's literal
  // value; without one, the portable env simply has no key for it.
  const env = {}
  for (const spec of userVarSpecs) {
    if (spec.name.endsWith('_PORT') && spec.default && !/^\d{2,5}$/.test(spec.default)) {
      throw new ScaffoldError(
        `--user-var ${spec.name} ends in "_PORT" and needs a numeric default (artyx.uservar.port-default).`
      )
    }
    env[spec.name] = `\${${spec.name}}`
    userVars[spec.name] = {
      label: humanizeVarName(spec.name),
      description: spec.default
        ? `Value for ${spec.name}, passed to the ${serverName} server as an environment ` +
          `variable. Defaults to "${spec.default}".`
        : `Value for ${spec.name}, passed to the ${serverName} server as an environment ` +
          'variable. TODO: describe where this value comes from.',
      ...(spec.default ? { default: spec.default } : {})
    }
    if (spec.default) portableEnv[spec.name] = spec.default
  }
  overlayServer.env = env
  return { userVars, overlayServer, portableEnv }
}

// ---------------------------------------------------------------------------
// File content builders
// ---------------------------------------------------------------------------

function buildPluginManifest({ name, display, tagline, category, experimental, requires, userVars, overlayServer, serverName }) {
  const extension = {
    schemaVersion: 1,
    interface: {
      displayName: display,
      tagline,
      category,
      capabilities: ['Interactive', 'Write'],
      ...(experimental ? { experimental: true } : {})
    },
    compatibility: { artyx: '>=0.8.0' }
  }
  if (requires.length > 0) extension.requires = requires
  if (Object.keys(userVars).length > 0) extension.userVars = userVars
  if (Object.keys(overlayServer).length > 0) extension.mcp = { [serverName]: overlayServer }

  return {
    $schema: PLUGIN_SCHEMA_URL,
    name,
    version: '0.1.0',
    author: { name: 'Artyx', url: 'https://artyx.ai' },
    repository: 'https://github.com/arg-software-factory/artyx-marketplace',
    license: 'MIT',
    extensions: { 'ai.artyx.desktop': extension }
    // No top-level "description" yet — see the printed checklist. Leaving it
    // out surfaces plugin.description.missing so it is not forgotten.
  }
}

function buildMcpManifest({ serverName, transport, url, command, args, portableEnv }) {
  if (transport === 'none') return null
  const server = { type: transport }
  if (transport === 'streamable-http') {
    server.url = url
  } else if (transport === 'stdio') {
    server.command = command
    if (args.length > 0) server.args = args
    if (Object.keys(portableEnv).length > 0) server.env = portableEnv
  }
  return { $schema: MCP_SCHEMA_URL, mcpServers: { [serverName]: server } }
}

function titleCaseSlug(slug) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function buildSkillFile(slug) {
  return [
    '---',
    `name: ${slug}`,
    'description: "TODO: describe what this skill does and exactly when an agent should reach for it."',
    '---',
    '',
    `# ${titleCaseSlug(slug)}`,
    '',
    'TODO: write the instructions for this skill. Keep this file under 500',
    'lines; push detail into references/, which loads only when a step needs it.',
    ''
  ].join('\n')
}

function buildPluginReadme({ display, transport }) {
  const lines = [`# ${display}`, '']
  if (transport !== 'none') {
    lines.push(
      'TODO: describe the setup a user performs outside Artyx to run the ' +
        `${display} MCP server. Mirror the same steps in plugin.json under `,
      '`extensions["ai.artyx.desktop"].companion`.',
      ''
    )
  }
  lines.push(
    '## Before this plugin ships',
    '',
    '- [ ] Add a real `logo.png` at the package root.',
    '- [ ] Write the top-level `description` in `plugin.json`.',
    '- [ ] Write the skill body under `skills/` (replace every TODO).',
    ...(transport !== 'none'
      ? ['- [ ] Add `extensions["ai.artyx.desktop"].companion` setup steps.']
      : []),
    '- [ ] Rewrite this README with real setup and troubleshooting notes.',
    ''
  )
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Catalog append — JSON.parse -> JSON.stringify(obj, null, 2), then restore
// the two compact one-liners the file already uses for "source" and
// "policy". Plain JSON.stringify would re-wrap those onto separate lines for
// every existing entry too, turning a one-entry append into a whole-file
// diff — the opposite of what a "clean one-hunk diff" is supposed to mean.
// ---------------------------------------------------------------------------

function compactCatalogJson(text) {
  return text
    .replace(
      /"source": \{\n\s+"source": ("[^"]*"),\n\s+"path": ("[^"]*")\n\s+\}/g,
      '"source": { "source": $1, "path": $2 }'
    )
    .replace(
      /"policy": \{\n\s+"installation": ("[^"]*"),\n\s+"authentication": ("[^"]*")\n\s+\}/g,
      '"policy": { "installation": $1, "authentication": $2 }'
    )
}

async function appendCatalogEntry(name) {
  const raw = await readFile(CATALOG_PATH, 'utf8')
  const catalog = JSON.parse(raw)
  catalog.plugins.push({
    name,
    source: { source: 'local', path: `./plugins/${name}` },
    policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }
  })
  const out = compactCatalogJson(JSON.stringify(catalog, null, 2)) + '\n'
  await writeFile(CATALOG_PATH, out)
  return { before: raw, after: out }
}

// ---------------------------------------------------------------------------
// Plan assembly
// ---------------------------------------------------------------------------

function buildPlan(options, userVarSpecs) {
  const serverName = options.name
  const requires = []
  if (options.transport === 'stdio') {
    const token = options.command.split('/').pop()
    if (RUNTIME_COMMANDS.has(token)) requires.push(token)
  }

  const { userVars, overlayServer, portableEnv } = planOverlay({
    transport: options.transport,
    serverName,
    url: options.url,
    userVars: userVarSpecs
  })

  const pluginManifest = buildPluginManifest({
    name: options.name,
    display: options.display,
    tagline: options.tagline,
    category: options.category,
    experimental: options.experimental,
    requires,
    userVars,
    overlayServer,
    serverName
  })

  const mcpManifest = buildMcpManifest({
    serverName,
    transport: options.transport,
    url: options.url,
    command: options.command,
    args: options.args,
    portableEnv
  })

  const skillFiles = new Map(options.skills.map((slug) => [slug, buildSkillFile(slug)]))
  const readme = buildPluginReadme({ display: options.display, transport: options.transport })

  return { pluginManifest, mcpManifest, skillFiles, readme }
}

// ---------------------------------------------------------------------------
// Dry run
// ---------------------------------------------------------------------------

function printDryRun(options, plan) {
  const pluginDir = `plugins/${options.name}`
  const paths = [`${pluginDir}/plugin.json`]
  if (plan.mcpManifest) paths.push(`${pluginDir}/mcp.json`)
  for (const slug of plan.skillFiles.keys()) paths.push(`${pluginDir}/skills/${slug}/SKILL.md`)
  paths.push(`${pluginDir}/README.md`)
  paths.push('.agents/plugins/marketplace.json (append one entry)')

  console.log(`Would create ${pluginDir}/ with:\n`)
  for (const path of paths) console.log(`  ${path}`)
  console.log()

  const section = (title, body) => console.log(`--- ${title} ---\n${body}\n`)
  section(`${pluginDir}/plugin.json`, JSON.stringify(plan.pluginManifest, null, 2))
  if (plan.mcpManifest) section(`${pluginDir}/mcp.json`, JSON.stringify(plan.mcpManifest, null, 2))
  for (const [slug, body] of plan.skillFiles) section(`${pluginDir}/skills/${slug}/SKILL.md`, body)
  section(`${pluginDir}/README.md`, plan.readme)
  console.log('Nothing was written (--dry-run). No catalog entry was appended.')
}

// ---------------------------------------------------------------------------
// Write + report
// ---------------------------------------------------------------------------

async function pluginDirExists(name) {
  try {
    await lstat(join(PLUGINS_DIR, name))
    return true
  } catch {
    return false
  }
}

async function writePlan(options, plan) {
  const pluginDir = join(PLUGINS_DIR, options.name)
  await mkdir(pluginDir, { recursive: true })
  await writeFile(join(pluginDir, 'plugin.json'), JSON.stringify(plan.pluginManifest, null, 2) + '\n')
  if (plan.mcpManifest) {
    await writeFile(join(pluginDir, 'mcp.json'), JSON.stringify(plan.mcpManifest, null, 2) + '\n')
  }
  for (const [slug, body] of plan.skillFiles) {
    const skillDir = join(pluginDir, 'skills', slug)
    await mkdir(skillDir, { recursive: true })
    await writeFile(join(skillDir, 'SKILL.md'), body)
  }
  await writeFile(join(pluginDir, 'README.md'), plan.readme)
}

function printChecklist(options) {
  console.log(`\nWrote plugins/${options.name}/. This script cannot generate:\n`)
  console.log('  - a real logo.png (256x256 or larger, <=256KB, at the package root)')
  console.log('  - the skill body/bodies under skills/ (every SKILL.md TODO)')
  console.log('  - plugin.json /extensions/ai.artyx.desktop/companion (setup steps in the other app)')
  console.log('  - plugin.json /description (the storefront detail-view prose)')
  console.log('  - this plugin\'s README.md prose')
  console.log('\nRunning the validator now so the rest of the list is exact:\n')
}

async function runValidator(name) {
  const result = spawnSync(process.execPath, [join(REPO_ROOT, 'scripts', 'validate.mjs'), '--plugin', name], {
    cwd: REPO_ROOT,
    stdio: 'inherit'
  })
  return result.status
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(usage())
    return
  }

  if (options.interactive) await fillInteractive(options)

  const userVarSpecs = validateOptions(options)

  if (await pluginDirExists(options.name)) {
    throw new ScaffoldError(
      `plugins/${options.name} already exists. Remove it first, or pick a different --name.`
    )
  }

  const plan = buildPlan(options, userVarSpecs)

  if (options.dryRun) {
    printDryRun(options, plan)
    return
  }

  await writePlan(options, plan)
  await appendCatalogEntry(options.name)
  printChecklist(options)
  const validatorStatus = await runValidator(options.name)
  console.log(
    `\nvalidator exit code: ${validatorStatus}. A nonzero code here is expected right after ` +
      'scaffolding — work through the checklist above, then re-run ' +
      `"node scripts/validate.mjs --plugin ${options.name}" until it is 0.`
  )
}

main().catch((error) => {
  if (error instanceof ScaffoldError) {
    console.error(`error: ${error.message}`)
    process.exit(2)
  }
  console.error(error)
  process.exit(1)
})
