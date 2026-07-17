import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/u;
const LITERAL_PORT_IN_URL = /:\d{2,5}(?:\/|$)/u;
const LOOPBACK_HOST = /(?:localhost|127\.0\.0\.1)/iu;
const DISALLOWED_PLACEHOLDERS = /\$\{ARTYX_(?:ELECTRON|PLUGIN_ROOT)\}/u;
const SERVER_CODE_ALLOWLIST = new Set();
const PLATFORM_KEYS = new Set(['darwin', 'win32', 'linux']);
const jsonOutput = process.argv.includes('--json');

/** @type {string[]} */
const failures = [];

function fail(message) {
  failures.push(message);
}

function isAllowlisted(pluginName) {
  return SERVER_CODE_ALLOWLIST.has(pluginName);
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listPluginDirs(pluginsRoot) {
  const entries = await readdir(pluginsRoot, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function findFiles(directory, predicate) {
  /** @type {string[]} */
  const matches = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      matches.push(...(await findFiles(entryPath, predicate)));
    } else if (predicate(entry.name, entryPath)) {
      matches.push(entryPath);
    }
  }

  return matches;
}

async function validatePluginJson(pluginName, manifest, pluginDir, pluginsRoot) {
  const prefix = `${pluginName}: plugin.json`;

  if (!manifest.name || typeof manifest.name !== 'string') {
    fail(`${prefix} missing required field "name"`);
  } else if (manifest.name !== pluginName) {
    fail(`${prefix} name "${manifest.name}" does not match directory "${pluginName}"`);
  }

  if (!manifest.version || typeof manifest.version !== 'string') {
    fail(`${prefix} missing required field "version"`);
  } else if (!SEMVER_PATTERN.test(manifest.version)) {
    fail(`${prefix} version "${manifest.version}" is not valid semver`);
  }

  if (!manifest.description || typeof manifest.description !== 'string') {
    fail(`${prefix} missing required field "description"`);
  }

  if (!manifest.license || typeof manifest.license !== 'string') {
    fail(`${prefix} missing required field "license"`);
  }

  if (!manifest.skills || typeof manifest.skills !== 'string') {
    fail(`${prefix} missing required field "skills"`);
  } else {
    const skillsPath = path.resolve(pluginDir, manifest.skills);
    if (!skillsPath.startsWith(pluginsRoot)) {
      fail(`${prefix} skills path escapes plugins root`);
    } else if (!(await pathExists(skillsPath))) {
      fail(`${prefix} skills path does not exist: ${manifest.skills}`);
    }
  }

  const iface = manifest.interface;
  if (!iface || typeof iface !== 'object') {
    fail(`${prefix} missing required object "interface"`);
    return iface?.category;
  }

  if (!iface.displayName || typeof iface.displayName !== 'string') {
    fail(`${prefix} missing interface.displayName`);
  }

  if (!iface.logo || typeof iface.logo !== 'string') {
    fail(`${prefix} missing interface.logo (every plugin must ship a logo, e.g. "./logo.png")`);
  } else {
    const logoPath = path.resolve(pluginDir, iface.logo);
    if (!logoPath.startsWith(pluginsRoot)) {
      fail(`${prefix} interface.logo path escapes plugins root`);
    } else if (!logoPath.toLowerCase().endsWith('.png')) {
      fail(`${prefix} interface.logo must be a .png file`);
    } else if (!(await pathExists(logoPath))) {
      fail(`${prefix} interface.logo file does not exist: ${iface.logo}`);
    }
  }

  if (!iface.category || typeof iface.category !== 'string') {
    fail(`${prefix} missing interface.category`);
    return undefined;
  }

  return iface.category;
}

function validateMcpServerShape(pluginName, serverName, config) {
  const prefix = `${pluginName}: .mcp.json server "${serverName}"`;

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    fail(`${prefix} must be an object`);
    return;
  }

  const isHttp = config.type === 'http' || typeof config.url === 'string';

  if (isHttp) {
    if (config.type !== 'http') {
      fail(`${prefix} http servers must set type:"http"`);
    }
    if (!config.url || typeof config.url !== 'string') {
      fail(`${prefix} missing url`);
    }
    if (config.headers !== undefined) {
      if (!config.headers || typeof config.headers !== 'object' || Array.isArray(config.headers)) {
        fail(`${prefix} headers must be an object when present`);
      }
    }
    if (config.command || config.args || config.env) {
      fail(`${prefix} http servers must not include stdio fields`);
    }
    return;
  }

  if (config.type !== undefined && config.type !== 'stdio') {
    fail(`${prefix} unknown transport type "${String(config.type)}"`);
  }

  validateStdioFields(prefix, config);

  const platform = config.platform;
  if (platform !== undefined) {
    if (!platform || typeof platform !== 'object' || Array.isArray(platform)) {
      fail(`${prefix} platform must be an object when present`);
    } else {
      for (const [osKey, override] of Object.entries(platform)) {
        if (!PLATFORM_KEYS.has(osKey)) {
          fail(`${prefix} unknown platform override "${osKey}" (expected darwin|win32|linux)`);
          continue;
        }
        if (!override || typeof override !== 'object' || Array.isArray(override)) {
          fail(`${prefix} platform.${osKey} must be an object`);
          continue;
        }
        validateStdioFields(`${prefix} platform.${osKey}`, override);
      }
    }
  }

  // A stdio server must resolve a command for at least one platform: either a
  // base command, or a command in every declared platform override.
  const hasBaseCommand = typeof config.command === 'string' && config.command.length > 0;
  const overrides = platform && typeof platform === 'object' ? Object.values(platform) : [];
  const everyOverrideHasCommand =
    overrides.length > 0 && overrides.every((o) => o && typeof o.command === 'string');
  if (!hasBaseCommand && !everyOverrideHasCommand) {
    fail(`${prefix} stdio servers require a command (base command, or one per platform override)`);
  }

  if (config.url) {
    fail(`${prefix} stdio servers must not include url`);
  }
}

function validateStdioFields(prefix, config) {
  if (config.command !== undefined && typeof config.command !== 'string') {
    fail(`${prefix} command must be a string when present`);
  }

  if (config.args !== undefined) {
    if (!Array.isArray(config.args) || config.args.some((arg) => typeof arg !== 'string')) {
      fail(`${prefix} args must be an array of strings when present`);
    }
  }

  if (config.env !== undefined) {
    if (!config.env || typeof config.env !== 'object' || Array.isArray(config.env)) {
      fail(`${prefix} env must be an object when present`);
    }
  }
}

function validateMcpLiterals(pluginName, rawText, config) {
  const prefix = `${pluginName}: .mcp.json`;
  const allowlisted = isAllowlisted(pluginName);

  if (!allowlisted && DISALLOWED_PLACEHOLDERS.test(rawText)) {
    fail(`${prefix} uses deprecated \${ARTYX_ELECTRON} or \${ARTYX_PLUGIN_ROOT}`);
  }

  if (typeof config.url === 'string') {
    if (LITERAL_PORT_IN_URL.test(config.url)) {
      fail(`${prefix} url contains a literal numeric port — use \${VAR} placeholders`);
    }
  }

  checkEnvLiterals(prefix, config.env);
  if (config.platform && typeof config.platform === 'object') {
    for (const [osKey, override] of Object.entries(config.platform)) {
      if (override && typeof override === 'object') {
        checkEnvLiterals(`${prefix} platform.${osKey}`, override.env);
      }
    }
  }
}

function checkEnvLiterals(prefix, env) {
  if (!env || typeof env !== 'object') return;
  for (const [key, value] of Object.entries(env)) {
    if (typeof value !== 'string') {
      fail(`${prefix} env.${key} must be a string`);
      continue;
    }
    if (LOOPBACK_HOST.test(value)) {
      fail(`${prefix} env.${key} contains a literal loopback host`);
    }
    if (/^\d{2,5}$/u.test(value)) {
      fail(`${prefix} env.${key} contains a literal numeric port`);
    }
  }
}

async function validateMcpJson(pluginName, pluginDir) {
  const mcpPath = path.join(pluginDir, '.mcp.json');
  if (!(await pathExists(mcpPath))) {
    return;
  }

  let parsed;
  let rawText;
  try {
    rawText = await readFile(mcpPath, 'utf8');
    parsed = JSON.parse(rawText);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    fail(`${pluginName}: invalid .mcp.json (${reason})`);
    return;
  }

  if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object') {
    fail(`${pluginName}: .mcp.json must contain mcpServers object`);
    return;
  }

  for (const [serverName, config] of Object.entries(parsed.mcpServers)) {
    validateMcpServerShape(pluginName, serverName, config);
    validateMcpLiterals(pluginName, rawText, config);
  }
}

async function validateNoBundledServerCode(pluginName, pluginDir) {
  if (isAllowlisted(pluginName)) {
    return;
  }

  const serverDir = path.join(pluginDir, 'server');
  if (await pathExists(serverDir)) {
    fail(`${pluginName}: forbidden server/ directory (plugins must not bundle MCP server code)`);
  }

  const mjsFiles = await findFiles(pluginDir, (name) => name.endsWith('.mjs'));
  for (const file of mjsFiles) {
    fail(`${pluginName}: forbidden bundled server file ${path.relative(pluginDir, file)}`);
  }
}

async function validatePlugin(pluginName, pluginsRoot, marketplaceByName) {
  const pluginDir = path.join(pluginsRoot, pluginName);
  const manifestPath = path.join(pluginDir, '.artyx-plugin', 'plugin.json');

  if (!(await pathExists(manifestPath))) {
    fail(`${pluginName}: missing .artyx-plugin/plugin.json`);
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    fail(`${pluginName}: invalid plugin.json (${reason})`);
    return;
  }

  const category = await validatePluginJson(pluginName, manifest, pluginDir, pluginsRoot);
  await validateMcpJson(pluginName, pluginDir);
  await validateNoBundledServerCode(pluginName, pluginDir);

  const marketplaceEntry = marketplaceByName.get(pluginName);
  if (!marketplaceEntry) {
    fail(`${pluginName}: plugin folder exists but has no marketplace.json entry`);
    return;
  }

  const expectedPath = `./plugins/${pluginName}`;
  if (marketplaceEntry.source?.path !== expectedPath) {
    fail(
      `${pluginName}: marketplace path mismatch (got ${marketplaceEntry.source?.path ?? 'none'}, expected ${expectedPath})`,
    );
  }

  if (category && marketplaceEntry.category !== category) {
    fail(
      `${pluginName}: marketplace category "${marketplaceEntry.category}" does not match interface.category "${category}"`,
    );
  }
}

async function validateMarketplace(marketplace, pluginNames) {
  const pluginSet = new Set(pluginNames);
  /** @type {Map<string, object>} */
  const byName = new Map();

  for (const entry of marketplace.plugins ?? []) {
    if (!entry?.name) {
      fail('marketplace.json: plugin entry missing name');
      continue;
    }

    if (byName.has(entry.name)) {
      fail(`marketplace.json: duplicate plugin name "${entry.name}"`);
    }
    byName.set(entry.name, entry);

    const folderName = entry.source?.path?.replace(/^\.\/plugins\//u, '');
    if (!folderName || !pluginSet.has(folderName)) {
      fail(`marketplace.json: entry "${entry.name}" points to missing folder ${entry.source?.path}`);
    }

    if (entry.name !== folderName) {
      fail(
        `marketplace.json: entry name "${entry.name}" does not match folder "${folderName}"`,
      );
    }
  }

  for (const pluginName of pluginNames) {
    if (!byName.has(pluginName)) {
      fail(`${pluginName}: folder exists but has no marketplace.json entry`);
    }
  }

  return byName;
}

function printResults() {
  if (jsonOutput) {
    console.log(JSON.stringify({ failed: failures.length, failures }, null, 2));
    return;
  }

  for (const message of failures) {
    console.log(`FAIL ${message}`);
  }
  console.log(`${failures.length === 0 ? 'OK' : `${failures.length} failed`} — plugin validation`);
}

async function main() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDirectory, '..');
  const pluginsRoot = path.join(repoRoot, 'plugins');
  const marketplacePath = path.join(repoRoot, '.agents', 'plugins', 'marketplace.json');

  let marketplace;
  try {
    marketplace = JSON.parse(await readFile(marketplacePath, 'utf8'));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    fail(`marketplace.json unreadable (${reason})`);
    printResults();
    process.exitCode = 1;
    return;
  }

  const pluginNames = await listPluginDirs(pluginsRoot);
  const marketplaceByName = await validateMarketplace(marketplace, pluginNames);

  for (const pluginName of pluginNames.sort()) {
    await validatePlugin(pluginName, pluginsRoot, marketplaceByName);
  }

  printResults();
  process.exitCode = failures.length === 0 ? 0 : 1;
}

main().catch((error) => {
  const reason = error instanceof Error ? error.message : String(error);
  if (jsonOutput) {
    console.log(JSON.stringify({ failed: 1, failures: [reason] }, null, 2));
  } else {
    console.error(`FAIL validator (${reason})`);
  }
  process.exitCode = 1;
});
