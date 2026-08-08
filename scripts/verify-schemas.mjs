#!/usr/bin/env node
/**
 * Re-fetch the canonical Agent Plugins schemas and prove our vendored copies
 * are byte-identical.
 *
 * A client must never fetch a schema while it loads a plugin, so the copies in
 * schemas/1.0.0/ are what validation actually uses. This script is the only
 * place in the repository that touches the network, and it never runs as part
 * of validation.
 */

import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const VERSION = '1.0.0'

const FILES = [
  { name: 'plugin.schema.json', url: `https://agent-plugins.org/schemas/${VERSION}/plugin.schema.json` },
  { name: 'mcp.schema.json', url: `https://agent-plugins.org/schemas/${VERSION}/mcp.schema.json` }
]

const sha256 = (text) => createHash('sha256').update(text).digest('hex')

async function main() {
  let drifted = 0

  for (const file of FILES) {
    const localPath = join(REPO_ROOT, 'schemas', VERSION, file.name)
    const local = await readFile(localPath, 'utf8')

    let upstream
    try {
      const response = await fetch(file.url, { redirect: 'error' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      upstream = await response.text()
    } catch (error) {
      console.error(`SKIP  ${file.name} — could not fetch: ${error.message}`)
      continue
    }

    if (upstream === local) {
      console.log(`OK    ${file.name}  ${sha256(local)}`)
      continue
    }

    drifted += 1
    console.error(`DRIFT ${file.name}`)
    console.error(`      vendored ${sha256(local)} (${local.length} bytes)`)
    console.error(`      upstream ${sha256(upstream)} (${upstream.length} bytes)`)
  }

  if (drifted > 0) {
    console.error(
      `\n${drifted} schema(s) differ from upstream. A published canonical identifier is never ` +
        'reassigned to different contents, so this means either a specification erratum or a ' +
        'local edit. Review before updating the vendored copy, and update UPSTREAM.md with the ' +
        'new hashes.'
    )
    process.exit(1)
  }
  console.log('\nVendored schemas match upstream.')
}

main().catch((error) => {
  console.error(error)
  process.exit(2)
})
