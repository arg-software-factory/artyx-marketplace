import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const SCAFFOLDER = join(REPO_ROOT, 'tooling', 'scripts', 'new-plugin.mjs')
const FIXTURE = 'tooling/scripts/__tests__/fixtures/rage-asset-adapter.json'

function baseArgs() {
  return [
    SCAFFOLDER,
    '--name', 'adapter-scaffold-test',
    '--display', 'Adapter Test',
    '--tagline', 'Exercise the asset adapter scaffolder.',
    '--category', 'Developer Tools',
    '--docs', 'https://example.com/adapter-docs',
    '--transport', 'none',
    '--dry-run'
  ]
}

test('the scaffolder embeds an external adapter as extension schema v3', async () => {
  const { stdout } = await run(process.execPath, [
    ...baseArgs(),
    '--asset-adapter', FIXTURE,
    '--user-var', 'RAGE_ADAPTER_ASSEMBLY',
    '--user-var', 'GTA_V_PATH',
    '--skill', 'rage-assets'
  ], { cwd: REPO_ROOT })

  assert.match(stdout, /"schemaVersion": 3/)
  assert.match(stdout, /"pluginClass": "native-asset"/)
  assert.match(stdout, /"nativeRuntimes": \[/)
  assert.match(stdout, /"assetAdapters": \[/)
  assert.match(stdout, /"protocol": "artyx\.asset-adapter\/2"/)
  assert.match(stdout, /"requires": \[\s*"dotnet"\s*\]/)
  assert.doesNotMatch(stdout, /adapter-scaffold-test\/mcp\.json/)
  assert.match(stdout, /Nothing was written/)
})

test('transport none still rejects orphan userVars without an adapter', async () => {
  await assert.rejects(
    run(process.execPath, [...baseArgs(), '--user-var', 'ORPHAN_PATH'], { cwd: REPO_ROOT }),
    (error) => {
      assert.equal(error.code, 2)
      assert.match(error.stderr, /accepts --user-var only when --asset-adapter/)
      return true
    }
  )
})
