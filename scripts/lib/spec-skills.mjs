/**
 * skills/ against Agent Plugins 1.0.0 section 7.1, which delegates the format
 * itself to the Agent Skills specification.
 *
 * Two rules do most of the work here. Discovery is exactly one level deep — a
 * SKILL.md nested any further is simply not a skill, and silently so. And a
 * skill's frontmatter `name` must equal its directory name, which is the rule
 * our own packages used to break by putting a human title there.
 *
 * An invalid skill is skipped on its own. It never takes its siblings or the
 * plugin down with it.
 */

import { readdir, readFile, lstat } from 'node:fs/promises'
import { join } from 'node:path'

import { parse as parseYaml } from 'yaml'

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FENCE = '---'

/** The complete field set defined by the Agent Skills specification. */
const KNOWN_FRONTMATTER = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools'
])

const MAX_BODY_LINES = 500

function splitFrontmatter(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  if (lines[0]?.trim() !== FENCE) return { error: 'missing the opening "---" fence' }
  const close = lines.findIndex((line, index) => index > 0 && line.trim() === FENCE)
  if (close < 0) return { error: 'missing the closing "---" fence' }
  return {
    frontmatter: lines.slice(1, close).join('\n'),
    body: lines.slice(close + 1).join('\n').trim()
  }
}

async function isRegularFile(path) {
  try {
    const stats = await lstat(path)
    return stats.isFile()
  } catch {
    return false
  }
}

/** @returns {boolean} whether the skill validated and would therefore load */
async function validateOneSkill({ target, skillsDir, dirName, report }) {
  const pointer = `skills/${dirName}/SKILL.md`
  const filePath = join(skillsDir, dirName, 'SKILL.md')

  const raw = await readFile(filePath, 'utf8')
  const split = splitFrontmatter(raw)
  if (split.error) {
    report.entry('skill.frontmatter.missing', target, pointer, `Skipped: ${split.error}.`)
    return false
  }

  let parsed
  try {
    parsed = parseYaml(split.frontmatter)
  } catch (error) {
    report.entry('skill.frontmatter.invalid', target, pointer, `Skipped: invalid YAML — ${error.message}`)
    return false
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    report.entry('skill.frontmatter.type', target, pointer, 'Skipped: frontmatter must be a YAML mapping.')
    return false
  }

  const name = parsed.name
  if (typeof name !== 'string' || name.length === 0) {
    report.entry('skill.name.missing', target, pointer, 'Skipped: "name" is required.')
    return false
  }
  if (name.length > 64 || !SKILL_NAME.test(name)) {
    report.entry(
      'skill.name.invalid',
      target,
      pointer,
      `Skipped: "${name}" must be 1-64 characters of a-z, 0-9 and hyphens, with no leading, ` +
        'trailing, or doubled hyphen.'
    )
    return false
  }
  if (name !== dirName) {
    report.entry(
      'skill.name.mismatch',
      target,
      pointer,
      `Skipped: "name" must equal the directory name. Found "${name}" in "${dirName}/". ` +
        'A skill name is an identifier, not a title — the storefront title lives in the manifest.'
    )
    return false
  }

  const description = parsed.description
  if (typeof description !== 'string' || description.trim().length === 0) {
    report.entry('skill.description.missing', target, pointer, 'Skipped: "description" is required.')
    return false
  }
  if (description.length > 1024) {
    report.entry(
      'skill.description.length',
      target,
      pointer,
      `Skipped: "description" is ${description.length} characters; the limit is 1024.`
    )
    return false
  }

  if (typeof parsed.compatibility === 'string' && parsed.compatibility.length > 500) {
    report.entry(
      'skill.compatibility.length',
      target,
      pointer,
      `Skipped: "compatibility" is ${parsed.compatibility.length} characters; the limit is 500.`
    )
    return false
  }

  if (parsed.metadata !== undefined) {
    const bad =
      !parsed.metadata ||
      typeof parsed.metadata !== 'object' ||
      Array.isArray(parsed.metadata) ||
      Object.values(parsed.metadata).some((v) => typeof v !== 'string')
    if (bad) {
      report.entry(
        'skill.metadata.type',
        target,
        pointer,
        'Skipped: "metadata" must map string keys to string values.'
      )
      return false
    }
  }

  for (const key of Object.keys(parsed)) {
    if (KNOWN_FRONTMATTER.has(key)) continue
    report.warn(
      'skill.frontmatter.unknown',
      target,
      pointer,
      `"${key}" is not an Agent Skills field. Clients ignore it. Arbitrary data belongs ` +
        'under "metadata".'
    )
  }

  if (split.body.length === 0) {
    report.entry('skill.body.empty', target, pointer, 'Skipped: no instructions after the frontmatter.')
    return false
  }
  const lineCount = split.body.split('\n').length
  if (lineCount > MAX_BODY_LINES) {
    report.warn(
      'skill.body.long',
      target,
      pointer,
      `${lineCount} lines. Keep SKILL.md under ${MAX_BODY_LINES} and push detail into ` +
        'references/, which loads only when needed.'
    )
  }

  return true
}

/** @returns {string[]} the skill directory names that validated and would load */
export async function validateSpecSkills({ target, pluginRoot, report }) {
  const skillsDir = join(pluginRoot, 'skills')

  let stats
  try {
    stats = await lstat(skillsDir)
  } catch {
    return [] // Absent is not an error.
  }

  if (!stats.isDirectory()) {
    report.component(
      'skills.location.wrong-kind',
      target,
      'skills',
      '"skills" exists but is not a directory, so the skills component is unusable. ' +
        'Other component types still load.'
    )
    return []
  }

  const children = await readdir(skillsDir, { withFileTypes: true })
  const discovered = []

  for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!child.isDirectory()) continue
    // Discovery is exactly one level deep. A SKILL.md deeper than this is not
    // a skill, and a client will never find it.
    if (!(await isRegularFile(join(skillsDir, child.name, 'SKILL.md')))) {
      report.warn(
        'skill.file.missing',
        target,
        `skills/${child.name}`,
        'No SKILL.md directly inside this directory, so it is not discovered as a skill. ' +
          'Clients do not search deeper.'
      )
      continue
    }
    // Only a skill that validates counts as a component. A discovered but
    // broken SKILL.md is skipped by a client, so a package whose every skill is
    // broken really does ship nothing.
    if (await validateOneSkill({ target, skillsDir, dirName: child.name, report })) {
      discovered.push(child.name)
    }
  }

  return discovered
}
