/**
 * Severity model and printers.
 *
 * Two axes are kept apart on purpose.
 *
 * SPEC SEVERITY is what a conformant client does with a finding. It is the
 * specification's answer and we never bend it, because `--spec-report` is how
 * we demonstrate that this repository implements the standard exactly.
 *
 * PUBLISHING POLICY is what CI does with that finding. It is stricter: a
 * curated first-party marketplace must not ship a package that any conformant
 * client would silently ignore part of. So `ignored`, `component`, and `entry`
 * all fail the build even though the specification lets a client continue.
 *
 * Collapsing the two would mean either lying about the standard or shipping
 * half-loaded plugins. Keeping them separate costs one field.
 */

/** Ordered most to least severe. The order drives sorting and exit codes. */
export const SEVERITY = {
  /** Plugin rejected. No component of it may be discovered or executed. */
  FATAL: 'fatal',
  /** One component type is unusable. Other types still load. */
  COMPONENT: 'component',
  /** One skill or one server is skipped. Its siblings still load. */
  ENTRY: 'entry',
  /** The specification says to report this and keep going. */
  IGNORED: 'ignored',
  /** Advisory only. Never fails anything. */
  WARN: 'warn'
}

const SEVERITY_ORDER = [
  SEVERITY.FATAL,
  SEVERITY.COMPONENT,
  SEVERITY.ENTRY,
  SEVERITY.IGNORED,
  SEVERITY.WARN
]

/** Severities that fail CI under publishing policy. `warn` is the only one that never does. */
const BLOCKS_PUBLISH = new Set([
  SEVERITY.FATAL,
  SEVERITY.COMPONENT,
  SEVERITY.ENTRY,
  SEVERITY.IGNORED
])

/** Severities that a conformant client treats as "this plugin does not load". */
const BLOCKS_LOAD = new Set([SEVERITY.FATAL])

const LABEL = {
  [SEVERITY.FATAL]: 'FATAL',
  [SEVERITY.COMPONENT]: 'COMPONENT',
  [SEVERITY.ENTRY]: 'ENTRY',
  [SEVERITY.IGNORED]: 'IGNORED',
  [SEVERITY.WARN]: 'WARN'
}

/**
 * Which rulebook a finding comes from.
 *
 * `spec` means a conformant client would react to it. `artyx` means only this
 * marketplace cares — a missing logo.png or a missing storefront extension
 * breaks nothing for anyone else, so `--spec-report` must not count it. Without
 * this split, spec mode would report Artyx house rules as standard violations,
 * which is exactly the claim that mode exists to make honestly.
 */
export const AXIS = { SPEC: 'spec', ARTYX: 'artyx' }

export class Report {
  constructor() {
    /** @type {Array<{severity: string, axis: string, code: string, target: string, pointer: string, message: string}>} */
    this.findings = []
  }

  add(severity, code, target, pointer, message, axis = AXIS.SPEC) {
    this.findings.push({ severity, axis, code, target, pointer, message })
  }

  fatal(code, target, pointer, message, axis = AXIS.SPEC) {
    this.add(SEVERITY.FATAL, code, target, pointer, message, axis)
  }

  component(code, target, pointer, message, axis = AXIS.SPEC) {
    this.add(SEVERITY.COMPONENT, code, target, pointer, message, axis)
  }

  entry(code, target, pointer, message, axis = AXIS.SPEC) {
    this.add(SEVERITY.ENTRY, code, target, pointer, message, axis)
  }

  ignored(code, target, pointer, message, axis = AXIS.SPEC) {
    this.add(SEVERITY.IGNORED, code, target, pointer, message, axis)
  }

  warn(code, target, pointer, message, axis = AXIS.SPEC) {
    this.add(SEVERITY.WARN, code, target, pointer, message, axis)
  }

  /**
   * A view of this report whose findings all carry `axis`. Modules that only
   * ever emit house rules take one of these instead of tagging every call.
   */
  scoped(axis) {
    const bind =
      (severity) =>
      (code, target, pointer, message) =>
        this.add(severity, code, target, pointer, message, axis)
    return {
      fatal: bind(SEVERITY.FATAL),
      component: bind(SEVERITY.COMPONENT),
      entry: bind(SEVERITY.ENTRY),
      ignored: bind(SEVERITY.IGNORED),
      warn: bind(SEVERITY.WARN)
    }
  }

  /** True when a conformant client would refuse to load `target`. */
  isFatalFor(target) {
    return this.findings.some((f) => f.target === target && BLOCKS_LOAD.has(f.severity))
  }

  countsBySeverity() {
    const counts = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]))
    for (const finding of this.findings) counts[finding.severity] += 1
    return counts
  }

  /** Exit code under publishing policy: anything but a bare `warn` fails. */
  get publishFailures() {
    return this.findings.filter((f) => BLOCKS_PUBLISH.has(f.severity))
  }

  /**
   * Exit code under spec semantics: only a rejected plugin fails, and only
   * when the standard is what rejected it. House rules never appear here.
   */
  get specFailures() {
    return this.findings.filter((f) => f.axis === AXIS.SPEC && BLOCKS_LOAD.has(f.severity))
  }

  sorted() {
    return [...this.findings].sort((a, b) => {
      const bySeverity = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
      if (bySeverity !== 0) return bySeverity
      return a.target.localeCompare(b.target) || a.pointer.localeCompare(b.pointer)
    })
  }
}

/**
 * @param {Report} report
 * @param {{ mode: 'strict' | 'spec', targets: string[] }} options
 */
export function printText(report, options) {
  const lines = []
  for (const finding of report.sorted()) {
    const where = finding.pointer ? `${finding.target} ${finding.pointer}` : finding.target
    // Marking the house rules keeps the two rulebooks legible: an author can
    // see at a glance whether the standard rejected something or we did.
    const rulebook = finding.axis === AXIS.ARTYX ? ' [artyx]' : ''
    lines.push(
      `${LABEL[finding.severity].padEnd(9)} ${where}${rulebook}\n          ${finding.message}`
    )
  }

  const failures = options.mode === 'spec' ? report.specFailures : report.publishFailures
  const counts = report.countsBySeverity()
  const summary = SEVERITY_ORDER.filter((s) => counts[s] > 0)
    .map((s) => `${counts[s]} ${LABEL[s].toLowerCase()}`)
    .join(', ')

  if (lines.length > 0) lines.push('')
  lines.push(
    failures.length === 0
      ? `OK — ${options.targets.length} package(s) validated${summary ? ` (${summary})` : ''}`
      : `FAILED — ${failures.length} blocking finding(s) across ${options.targets.length} package(s)${summary ? ` (${summary})` : ''}`
  )

  if (options.mode === 'spec' && report.publishFailures.length > report.specFailures.length) {
    lines.push(
      'Note: spec mode. Findings a conformant client tolerates are reported but do not fail. ' +
        'Run without --spec-report to apply Artyx publishing policy.'
    )
  }

  return lines.join('\n')
}

/** @param {Report} report */
export function printJson(report, options) {
  const failures = options.mode === 'spec' ? report.specFailures : report.publishFailures
  return JSON.stringify(
    {
      mode: options.mode,
      targets: options.targets,
      ok: failures.length === 0,
      counts: report.countsBySeverity(),
      findings: report.sorted()
    },
    null,
    2
  )
}
