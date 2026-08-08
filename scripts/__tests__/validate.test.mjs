/**
 * Conformance tests for the validator.
 *
 * Each case builds a minimal package in a temp directory, applies exactly one
 * mutation, and asserts which finding code fires and at which severity. The
 * severity is the point: the specification's failure ladder says a failure
 * must never widen, so a bad skill must stay `entry` and a bad mcp.json must
 * stay `component`. A test that only asserted "it failed" would let the ladder
 * collapse without anyone noticing.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const VALIDATOR = join(REPO_ROOT, 'scripts', 'validate.mjs')

const PLUGIN_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
const MCP_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'

/** A real PNG header; the validator checks the magic bytes and the size. */
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64)
])

function basePlugin(name) {
  return {
    $schema: PLUGIN_SCHEMA,
    name,
    version: '1.0.0',
    description: 'A package used by the validator test suite.',
    author: { name: 'Artyx', url: 'https://artyx.ai' },
    license: 'MIT',
    extensions: {
      'ai.artyx.desktop': {
        schemaVersion: 1,
        interface: {
          displayName: 'Demo',
          tagline: 'A demo package.',
          category: 'Developer Tools',
          docsUrl: 'https://example.com/demo-mcp'
        }
      }
    }
  }
}

function baseMcp() {
  return {
    $schema: MCP_SCHEMA,
    mcpServers: {
      demo: { type: 'stdio', command: 'npx', args: ['-y', 'demo-mcp'] }
    }
  }
}

const baseSkill = ['---', 'name: demo', 'description: Demonstrates the test fixture.', '---', '', 'Do the thing.', ''].join('\n')

/**
 * @param {(files: {plugin: object, mcp: object|null, skill: string}) => void} mutate
 * @returns {Promise<{ok: boolean, findings: Array, code: number}>}
 */
async function validate(mutate, { mode = 'strict' } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'artyx-mp-'))
  const name = 'demo'
  const pluginDir = join(root, 'plugins', name)
  try {
    const files = { plugin: basePlugin(name), mcp: baseMcp(), skill: baseSkill, extraFiles: {} }
    mutate(files)

    await mkdir(join(pluginDir, 'skills', 'demo'), { recursive: true })
    if (files.plugin !== null) {
      await writeFile(join(pluginDir, 'plugin.json'), JSON.stringify(files.plugin, null, 2))
    }
    if (files.mcp !== null) {
      await writeFile(join(pluginDir, 'mcp.json'), JSON.stringify(files.mcp, null, 2))
    }
    await writeFile(join(pluginDir, 'skills', 'demo', 'SKILL.md'), files.skill)
    await writeFile(join(pluginDir, 'logo.png'), PNG)
    for (const [rel, content] of Object.entries(files.extraFiles)) {
      await mkdir(dirname(join(pluginDir, rel)), { recursive: true })
      await writeFile(join(pluginDir, rel), content)
    }

    const args = [VALIDATOR, '--json', '--root', root, '--plugin', name]
    if (mode === 'spec') args.push('--spec-report')
    try {
      const { stdout } = await run(process.execPath, args)
      const parsed = JSON.parse(stdout)
      return { ...parsed, code: 0 }
    } catch (error) {
      const parsed = JSON.parse(error.stdout)
      return { ...parsed, code: error.code }
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

const codes = (result) => result.findings.map((f) => f.code)
const severityOf = (result, code) => result.findings.find((f) => f.code === code)?.severity

// ---------------------------------------------------------------------------
// The baseline must be clean, or every negative case below proves nothing.
// ---------------------------------------------------------------------------

test('a minimal well-formed package passes', async () => {
  const result = await validate(() => {})
  assert.equal(result.ok, true, `unexpected findings: ${JSON.stringify(result.findings, null, 2)}`)
  assert.equal(result.code, 0)
})

// ---------------------------------------------------------------------------
// The two non-fatal carve-outs. These are the rules a naive schema-only
// validator gets backwards, so they are asserted from both directions.
// ---------------------------------------------------------------------------

test('an unknown top-level field is reported and ignored, not fatal', async () => {
  const result = await validate((f) => {
    f.plugin.skills = './skills/'
  }, { mode: 'spec' })
  assert.equal(severityOf(result, 'plugin.field.unknown'), 'ignored')
  assert.equal(result.ok, true, 'the specification says the plugin still loads')
  assert.equal(result.code, 0)
})

test('an unknown top-level field still fails Artyx publishing policy', async () => {
  const result = await validate((f) => {
    f.plugin.skills = './skills/'
  })
  assert.equal(result.ok, false)
  assert.equal(result.code, 1)
})

test('a non-object extensions field is reported and ignored, not fatal', async () => {
  const result = await validate((f) => {
    f.plugin.extensions = []
  }, { mode: 'spec' })
  assert.equal(severityOf(result, 'plugin.extensions.not-object'), 'ignored')
  assert.equal(result.specFailures, undefined)
  assert.equal(result.code, 0)
})

test('a non-object value INSIDE extensions is fatal, unlike the outer field', async () => {
  const result = await validate((f) => {
    f.plugin.extensions = { 'com.example.client': 'not-an-object' }
  }, { mode: 'spec' })
  assert.ok(codes(result).includes('plugin.schema.violation'))
  assert.equal(result.ok, false)
})

// ---------------------------------------------------------------------------
// Fatal manifest violations.
// ---------------------------------------------------------------------------

test('a missing $schema is fatal', async () => {
  const result = await validate((f) => {
    delete f.plugin.$schema
  })
  assert.ok(codes(result).includes('plugin.schema.missing'))
  assert.equal(severityOf(result, 'plugin.schema.missing'), 'fatal')
})

test('an unrecognized $schema version is fatal', async () => {
  const result = await validate((f) => {
    f.plugin.$schema = 'https://agent-plugins.org/schemas/2.0.0/plugin.schema.json'
  })
  assert.ok(codes(result).includes('plugin.schema.unsupported'))
})

test('an unknown key inside author is fatal, unlike an unknown top-level key', async () => {
  const result = await validate((f) => {
    f.plugin.author.twitter = '@artyx'
  })
  assert.ok(codes(result).includes('plugin.schema.violation'))
  assert.equal(result.ok, false)
})

for (const bad of ['My-Plugin', '-start', 'has--double', 'too.many..dots', 'end-']) {
  test(`plugin name "${bad}" is rejected`, async () => {
    const result = await validate((f) => {
      f.plugin.name = bad
    })
    assert.equal(result.ok, false, `"${bad}" should not validate`)
  })
}

test('a dotted plugin name is accepted', async () => {
  // Periods are legal in a plugin name even though they are not in a skill name.
  const result = await validate((f) => {
    f.plugin.name = 'acme.tools'
  })
  const fatal = result.findings.filter((x) => x.severity === 'fatal' && x.code.startsWith('plugin.'))
  assert.deepEqual(fatal, [], JSON.stringify(fatal))
})

// ---------------------------------------------------------------------------
// Metadata the specification says a client MUST NOT reject.
// ---------------------------------------------------------------------------

test('a non-semver version warns but never rejects the plugin', async () => {
  const result = await validate((f) => {
    f.plugin.version = 'banana'
  }, { mode: 'spec' })
  assert.equal(severityOf(result, 'plugin.version.not-semver'), 'warn')
  assert.equal(result.ok, true, 'the specification forbids rejecting a plugin over this')
})

test('a homepage that is not a URL is accepted', async () => {
  const result = await validate((f) => {
    f.plugin.homepage = 'not a url'
  })
  assert.equal(result.ok, true, JSON.stringify(result.findings))
})

test('an unimplemented extension namespace is never validated', async () => {
  const result = await validate((f) => {
    f.plugin.extensions['com.example.client'] = { anything: [1, 2, { deeply: 'wrong' }] }
  })
  assert.equal(result.ok, true, 'a client ignores other namespaces without reading them')
})

// ---------------------------------------------------------------------------
// mcp.json. A failure here disables MCP but must never reject the plugin.
// ---------------------------------------------------------------------------

test('an unknown top-level key in mcp.json disables MCP without rejecting the plugin', async () => {
  const result = await validate((f) => {
    f.mcp.servers = {}
  }, { mode: 'spec' })
  assert.equal(severityOf(result, 'mcp.schema.violation'), 'component')
  assert.ok(!codes(result).some((c) => c.startsWith('plugin.')), 'the plugin itself stays valid')
})

test('an mcp.json targeting a different spec version than plugin.json disables MCP', async () => {
  const result = await validate((f) => {
    f.mcp.$schema = 'https://agent-plugins.org/schemas/2.0.0/mcp.schema.json'
  })
  assert.equal(severityOf(result, 'mcp.schema.mismatch'), 'component')
})

test('the legacy "http" transport token is rejected', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers.demo = { type: 'http', url: 'https://example.com/mcp' }
  })
  assert.ok(codes(result).includes('mcp.server.invalid'))
})

test('a server mixing variants is skipped but its siblings survive', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers.broken = { type: 'stdio', command: 'x', url: 'https://example.com' }
  })
  const finding = result.findings.find((x) => x.code === 'mcp.server.invalid')
  assert.equal(finding.severity, 'entry', 'one bad server must not disable the whole file')
  assert.ok(finding.pointer.includes('broken'))
  assert.ok(!result.findings.some((x) => x.pointer.includes('/demo')), 'sibling untouched')
})

test('an empty mcpServers object is valid', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers = {}
    f.plugin.extensions['ai.artyx.desktop'].mcp = undefined
  }, { mode: 'spec' })
  assert.equal(result.ok, true)
  assert.equal(severityOf(result, 'mcp.servers.empty'), 'warn')
})

test('a missing mcp.json is not an error', async () => {
  const result = await validate((f) => {
    f.mcp = null
  })
  assert.equal(result.ok, true, JSON.stringify(result.findings))
})

// ---------------------------------------------------------------------------
// The rules JSON Schema cannot express.
// ---------------------------------------------------------------------------

test('a placeholder in a portable url is rejected', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers.demo = { type: 'streamable-http', url: 'http://127.0.0.1:${PORT}/' }
  })
  assert.ok(codes(result).includes('mcp.server.url.placeholder'))
})

test('plain http is allowed on loopback and rejected elsewhere', async () => {
  const loopback = await validate((f) => {
    f.mcp.mcpServers.demo = { type: 'streamable-http', url: 'http://127.0.0.1:8000/' }
  })
  assert.ok(!codes(loopback).includes('mcp.server.url.insecure'))

  const remote = await validate((f) => {
    f.mcp.mcpServers.demo = { type: 'streamable-http', url: 'http://example.com/mcp' }
  })
  assert.ok(codes(remote).includes('mcp.server.url.insecure'))
})

test('a url with user information or a fragment is rejected', async () => {
  const userinfo = await validate((f) => {
    f.mcp.mcpServers.demo = { type: 'streamable-http', url: 'https://u:p@example.com/mcp' }
  })
  assert.ok(codes(userinfo).includes('mcp.server.url.userinfo'))

  const fragment = await validate((f) => {
    f.mcp.mcpServers.demo = { type: 'streamable-http', url: 'https://example.com/mcp#frag' }
  })
  assert.ok(codes(fragment).includes('mcp.server.url.fragment'))
})

test('a credential in a portable header is rejected', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers.demo = {
      type: 'streamable-http',
      url: 'https://example.com/mcp',
      headers: { Authorization: 'Bearer abc123' }
    }
  })
  assert.ok(codes(result).includes('mcp.server.headers.secret'))
})

test('header names that collide case-insensitively are rejected', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers.demo = {
      type: 'streamable-http',
      url: 'https://example.com/mcp',
      headers: { 'X-Tenant': 'a', 'x-tenant': 'b' }
    }
  })
  assert.ok(codes(result).includes('mcp.server.headers.duplicate'))
})

test('a command with arguments baked in is rejected', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers.demo = { type: 'stdio', command: 'npx -y demo-mcp' }
  })
  assert.ok(codes(result).includes('mcp.server.command.tokens'))
})

test('an absolute command path is rejected', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers.demo = { type: 'stdio', command: '/usr/local/bin/demo' }
  })
  assert.ok(codes(result).includes('mcp.server.command.form'))
})

test('a placeholder in a command is rejected', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers.demo = { type: 'stdio', command: '${ARTYX_ELECTRON}' }
  })
  assert.ok(codes(result).includes('mcp.server.command.placeholder'))
})

test('a non-spec placeholder in args stays literal and is rejected', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers.demo = { type: 'stdio', command: 'npx', args: ['${LOCALAPPDATA}/x'] }
  })
  assert.ok(codes(result).includes('mcp.server.placeholder.unknown'))
})

test('the two specification placeholders are accepted in args, env, and cwd', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers.demo = {
      type: 'stdio',
      command: 'npx',
      args: ['--data', '${PLUGIN_DATA}/store'],
      env: { CONFIG: '${PLUGIN_ROOT}/config.json' },
      cwd: '${PLUGIN_ROOT}'
    }
  })
  assert.equal(result.ok, true, JSON.stringify(result.findings))
})

// ---------------------------------------------------------------------------
// Skills. A bad skill is skipped alone.
// ---------------------------------------------------------------------------

test('a skill whose name does not match its directory is skipped, not fatal', async () => {
  const result = await validate((f) => {
    f.skill = f.skill.replace('name: demo', 'name: demo-mcp')
  })
  assert.equal(severityOf(result, 'skill.name.mismatch'), 'entry')
})

test('a skill with a human title as its name is skipped', async () => {
  const result = await validate((f) => {
    f.skill = f.skill.replace('name: demo', 'name: Demo MCP')
  })
  assert.equal(severityOf(result, 'skill.name.invalid'), 'entry')
})

test('a skill missing its description is skipped', async () => {
  const result = await validate((f) => {
    f.skill = ['---', 'name: demo', '---', '', 'Body.', ''].join('\n')
  })
  assert.equal(severityOf(result, 'skill.description.missing'), 'entry')
})

test('a SKILL.md nested deeper than one level is not discovered', async () => {
  const result = await validate((f) => {
    f.extraFiles['skills/group/nested/SKILL.md'] = baseSkill.replace('name: demo', 'name: nested')
  })
  assert.ok(codes(result).includes('skill.file.missing'), 'discovery is exactly one level deep')
})

// ---------------------------------------------------------------------------
// The Artyx storefront face.
// ---------------------------------------------------------------------------

test('a plugin without an install docs URL is fatal', async () => {
  const result = await validate((f) => {
    delete f.plugin.extensions['ai.artyx.desktop'].interface.docsUrl
  })
  assert.ok(codes(result).includes('artyx.extension.violation'))
  assert.equal(result.ok, false)
})

test('an install docs URL that is not https is fatal', async () => {
  const result = await validate((f) => {
    f.plugin.extensions['ai.artyx.desktop'].interface.docsUrl = 'http://example.com/docs'
  })
  assert.ok(codes(result).includes('artyx.extension.violation'))
})

test('setup prose in the manifest is rejected, docsUrl is the only channel', async () => {
  const result = await validate((f) => {
    f.plugin.extensions['ai.artyx.desktop'].companion = {
      title: 'Finish setup',
      steps: ['Install the thing.']
    }
  })
  assert.ok(codes(result).includes('artyx.extension.violation'))
})

// ---------------------------------------------------------------------------
// The Artyx overlay.
// ---------------------------------------------------------------------------

test('an overlay naming a server that does not exist is fatal', async () => {
  const result = await validate((f) => {
    f.plugin.extensions['ai.artyx.desktop'].mcp = { typo: { env: { A: '${A}' } } }
    f.plugin.extensions['ai.artyx.desktop'].userVars = {
      A: { label: 'A', description: 'A value.' }
    }
  })
  assert.ok(codes(result).includes('artyx.overlay.unknown-server'))
})

test('an overlay placeholder with no declared userVar is fatal', async () => {
  const result = await validate((f) => {
    f.plugin.extensions['ai.artyx.desktop'].mcp = { demo: { env: { TOKEN: '${MY_TOKEN}' } } }
  })
  assert.ok(codes(result).includes('artyx.overlay.undeclared-var'))
})

test('a declared userVar nothing references is fatal', async () => {
  const result = await validate((f) => {
    f.plugin.extensions['ai.artyx.desktop'].userVars = {
      UNUSED: { label: 'Unused', description: 'Never referenced.' }
    }
  })
  assert.ok(codes(result).includes('artyx.uservar.orphan'))
})

test('the portable file must equal the overlay with defaults applied', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers.demo = { type: 'streamable-http', url: 'http://127.0.0.1:9999/' }
    const ext = f.plugin.extensions['ai.artyx.desktop']
    ext.mcp = { demo: { url: 'http://127.0.0.1:${DEMO_PORT}/' } }
    ext.userVars = {
      DEMO_PORT: { label: 'Port', description: 'The port.', default: '8000' }
    }
  })
  assert.ok(
    codes(result).includes('artyx.overlay.default-drift'),
    'a 9999 literal against an 8000 default must be caught'
  )
})

test('a port userVar without a numeric default is fatal', async () => {
  const result = await validate((f) => {
    f.mcp.mcpServers.demo = { type: 'streamable-http', url: 'http://127.0.0.1:8000/' }
    const ext = f.plugin.extensions['ai.artyx.desktop']
    ext.mcp = { demo: { url: 'http://127.0.0.1:${DEMO_PORT}/' } }
    ext.userVars = { DEMO_PORT: { label: 'Port', description: 'The port.' } }
  })
  assert.ok(codes(result).includes('artyx.uservar.port-default'))
})

// ---------------------------------------------------------------------------
// Repository rules.
// ---------------------------------------------------------------------------

test('bundled executable code is rejected', async () => {
  const result = await validate((f) => {
    f.extraFiles['server/launcher.mjs'] = 'export default 1\n'
  })
  const found = result.findings.filter((x) =>
    ['plugin.bundled-server', 'plugin.bundled-code'].includes(x.code)
  )
  assert.ok(found.length > 0, 'a plugin must never ship a server')
})

test('the pre-1.0.0 layout is rejected outright', async () => {
  const dotfile = await validate((f) => {
    f.extraFiles['.mcp.json'] = '{}'
  })
  assert.ok(codes(dotfile).includes('plugin.mcp.dotfile'))
})

test('a package with neither a skill nor a server is rejected', async () => {
  const result = await validate((f) => {
    f.mcp = null
    f.skill = 'not a skill file'
  })
  assert.ok(codes(result).includes('plugin.no-components'))
})
