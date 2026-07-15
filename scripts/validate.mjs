import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import matter from "gray-matter";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const execFileAsync = promisify(execFile);

const maxPluginFiles = 256;
const maxFileBytes = 20 * 1024 * 1024;
const maxRepoBytes = 20 * 1024 * 1024;
const maxPluginDepth = 12;
const blockedFileNames = new Set([".DS_Store", "Thumbs.db", "desktop.ini", ".archive.sha256"]);
const placeholderPattern = /\$\{([^}]+)\}/g;
const placeholderNamePattern = /^[A-Z0-9_]+$/;
const marketplacePath = ".agents/plugins/marketplace.json";

// App-provided placeholders are substituted by the desktop at install time (the packaged
// Electron binary, the immutable plugin cache dir, etc). They are NOT user-config vars and
// never trigger the needs-config dialog. Keep this set in sync with the desktop's classifier;
// any other ${...} in a config is a user var. ARTYX_PLUGIN_ROOT is treated exactly like the
// legacy ARTYX_BUNDLED it replaces.
const appProvidedPlaceholders = new Set(["ARTYX_ELECTRON", "ARTYX_BUNDLED", "ARTYX_PLUGIN_ROOT"]);
const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1"]);

const singlePlaceholderPattern = /^\$\{([^}]+)\}$/;

const isAppProvidedCommand = (command) => {
  const match = singlePlaceholderPattern.exec(command ?? "");
  return match ? appProvidedPlaceholders.has(match[1]) : false;
};

const readJsonFile = async (filePath) => JSON.parse(await fs.readFile(filePath, "utf8"));

const readJson = async (relativePath) => readJsonFile(path.join(rootDir, relativePath));

const relativePath = (filePath) => path.relative(rootDir, filePath);

const pathExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
};

const runGit = (args) => execFileAsync("git", args, { cwd: rootDir, maxBuffer: 10 * 1024 * 1024 });

const formatAjvErrors = (errors = []) =>
  errors.map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");

const assertUrl = (value, label) => {
  if (!value) {
    return;
  }

  try {
    new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL: ${value}`);
  }
};

const assertEqual = (actual, expected, label) => {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${expected}, got ${actual}`);
  }
};

const validateMarketplaceEntries = (plugins) => {
  const names = new Set();

  for (const entry of plugins) {
    if (names.has(entry.name)) {
      throw new Error(`marketplace.json plugins[] duplicate name: ${entry.name}`);
    }

    names.add(entry.name);
    assertEqual(entry.source?.source, "local", `${entry.name} source.source`);
    assertEqual(entry.source?.path, `./plugins/${entry.name}`, `${entry.name} source.path`);
  }
};

const loadSchemas = async () => {
  const [marketplaceSchema, pluginSchema, mcpSchema] = await Promise.all([
    readJson("schema/marketplace.schema.json"),
    readJson("schema/plugin.schema.json"),
    readJson("schema/mcp.schema.json")
  ]);

  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);

  return {
    validateMarketplace: ajv.compile(marketplaceSchema),
    validatePlugin: ajv.compile(pluginSchema),
    validateMcp: ajv.compile(mcpSchema)
  };
};

const validateSkill = async (skillPath) => {
  let raw;
  try {
    raw = await fs.readFile(skillPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`${relativePath(skillPath)} missing`);
    }

    throw error;
  }

  let parsed;
  try {
    parsed = matter(raw);
  } catch (error) {
    throw new Error(`${relativePath(skillPath)} has invalid frontmatter: ${error.message}`);
  }

  if (Object.prototype.hasOwnProperty.call(parsed.data, "enabled")) {
    throw new Error(`${relativePath(skillPath)} frontmatter must not include enabled`);
  }

  if (
    typeof parsed.data.name !== "string" ||
    parsed.data.name.trim() === "" ||
    typeof parsed.data.description !== "string" ||
    parsed.data.description.trim() === ""
  ) {
    throw new Error(`${path.relative(rootDir, skillPath)} missing frontmatter name/description`);
  }
};

const validateSkills = async (sourceDir) => {
  const skillsDir = path.join(sourceDir, "skills");

  let skillDirEntries;
  try {
    skillDirEntries = await fs.readdir(skillsDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return 0;
    }

    throw error;
  }

  for (const skillDirEntry of skillDirEntries) {
    if (!skillDirEntry.isDirectory()) {
      const looseSkillPath = path.join(skillsDir, skillDirEntry.name);
      throw new Error(`${relativePath(looseSkillPath)} must be a directory`);
    }

    await validateSkill(path.join(skillsDir, skillDirEntry.name, "SKILL.md"));
  }

  return skillDirEntries.length;
};

const validatePlaceholders = (raw, filePath) => {
  for (const match of raw.matchAll(placeholderPattern)) {
    if (!placeholderNamePattern.test(match[1])) {
      throw new Error(`${relativePath(filePath)} placeholder must be uppercase: ${match[0]}`);
    }
  }
};

const hasCompanionSteps = (manifest) =>
  Array.isArray(manifest.artyx?.companion?.steps) && manifest.artyx.companion.steps.length > 0;

const validateMcpConfig = async (sourceDir, manifest, validateMcp) => {
  if (!manifest.mcpServers) {
    return false;
  }

  const mcpPath = path.resolve(sourceDir, manifest.mcpServers);
  if (!mcpPath.startsWith(`${sourceDir}${path.sep}`)) {
    throw new Error(`${relativePath(sourceDir)} mcpServers escapes the plugin package`);
  }

  if (!(await pathExists(mcpPath))) {
    return false;
  }

  const raw = await fs.readFile(mcpPath, "utf8");
  validatePlaceholders(raw, mcpPath);

  let mcpConfig;
  try {
    mcpConfig = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${relativePath(mcpPath)} invalid JSON: ${error.message}`);
  }

  if (!validateMcp(mcpConfig)) {
    throw new Error(`${relativePath(mcpPath)} invalid: ${formatAjvErrors(validateMcp.errors)}`);
  }

  for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers)) {
    const serverLabel = `${relativePath(mcpPath)} server ${serverName}`;

    if (typeof serverConfig.url === "string") {
      let parsedUrl;
      try {
        parsedUrl = new URL(serverConfig.url);
      } catch {
        throw new Error(`${serverLabel} has invalid url: ${serverConfig.url}`);
      }

      if (parsedUrl.protocol === "http:") {
        if (!loopbackHosts.has(parsedUrl.hostname)) {
          throw new Error(
            `${serverLabel} uses plain http for non-loopback host ${parsedUrl.hostname} (https required): ${serverConfig.url}`
          );
        }
      } else if (parsedUrl.protocol !== "https:") {
        throw new Error(
          `${serverLabel} url must use https (or http for loopback only): ${serverConfig.url}`
        );
      }
    }

    if (
      typeof serverConfig.command === "string" &&
      !isAppProvidedCommand(serverConfig.command) &&
      !hasCompanionSteps(manifest)
    ) {
      throw new Error(
        `${serverLabel} uses ${serverConfig.command} without companion steps`
      );
    }
  }

  return true;
};

const validateTreeItem = (filePath, stats, depth) => {
  if (stats.isSymbolicLink()) {
    throw new Error(`${relativePath(filePath)} must not be a symlink`);
  }

  if (blockedFileNames.has(path.basename(filePath))) {
    throw new Error(`${relativePath(filePath)} is not allowed`);
  }

  if (depth > maxPluginDepth) {
    throw new Error(`${relativePath(filePath)} exceeds max depth ${maxPluginDepth}`);
  }

  if (stats.isFile() && stats.size > maxFileBytes) {
    throw new Error(`${relativePath(filePath)} exceeds max file size`);
  }
};

const walkPluginDir = async (directoryPath, visitor, depth = 0) => {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const filePath = path.join(directoryPath, entry.name);
    const stats = await fs.lstat(filePath);
    const itemDepth = depth + 1;

    await visitor(filePath, stats, itemDepth);

    if (stats.isDirectory()) {
      await walkPluginDir(filePath, visitor, itemDepth);
    }
  }
};

const validateRepositoryLimits = async () => {
  const pluginsDir = path.join(rootDir, "plugins");
  const pluginStats = new Map();
  let totalBytes = (await fs.stat(path.join(rootDir, marketplacePath))).size;
  const entries = await fs.readdir(pluginsDir, { withFileTypes: true });

  for (const entry of entries) {
    const pluginPath = path.join(pluginsDir, entry.name);
    const stats = await fs.lstat(pluginPath);

    if (stats.isSymbolicLink()) {
      throw new Error(`${relativePath(pluginPath)} must not be a symlink`);
    }

    if (blockedFileNames.has(path.basename(pluginPath))) {
      throw new Error(`${relativePath(pluginPath)} is not allowed`);
    }

    if (stats.isFile()) {
      if (stats.size > maxFileBytes) {
        throw new Error(`${relativePath(pluginPath)} exceeds max file size`);
      }

      totalBytes += stats.size;
      continue;
    }

    if (!stats.isDirectory()) {
      continue;
    }

    let fileCount = 0;

    await walkPluginDir(pluginPath, (filePath, itemStats, depth) => {
      validateTreeItem(filePath, itemStats, depth);

      if (itemStats.isFile()) {
        fileCount += 1;
        totalBytes += itemStats.size;

        if (fileCount > maxPluginFiles) {
          throw new Error(`${relativePath(pluginPath)} exceeds ${maxPluginFiles} files`);
        }
      }
    });

    pluginStats.set(entry.name, { fileCount });
  }

  if (totalBytes > maxRepoBytes) {
    throw new Error("plugins/ plus marketplace index exceeds max repository payload size");
  }

  return pluginStats;
};

const hasGitRef = async (refName) => {
  try {
    await runGit(["rev-parse", "--verify", refName]);
    return true;
  } catch {
    return false;
  }
};

const hasGitObject = async (objectName) => {
  try {
    await runGit(["cat-file", "-e", objectName]);
    return true;
  } catch {
    return false;
  }
};

const hasPluginDiff = async (pluginName) => {
  try {
    await runGit(["diff", "--quiet", "origin/main", "--", `plugins/${pluginName}`]);
    return false;
  } catch (error) {
    if (error.code === 1) {
      return true;
    }

    throw error;
  }
};

const validateVersionBump = async (pluginName, currentVersion, gitContext) => {
  if (!gitContext.hasOriginMain) {
    return;
  }

  const manifestRefs = [
    `origin/main:plugins/${pluginName}/.artyx-plugin/plugin.json`,
    `origin/main:plugins/${pluginName}/.claude-plugin/plugin.json`
  ];
  let manifestRef;

  for (const candidateRef of manifestRefs) {
    if (await hasGitObject(candidateRef)) {
      manifestRef = candidateRef;
      break;
    }
  }

  if (!manifestRef || !(await hasPluginDiff(pluginName))) {
    return;
  }

  const { stdout } = await runGit(["show", manifestRef]);
  const previousManifest = JSON.parse(stdout);

  if (previousManifest.version === currentVersion) {
    throw new Error(`content changed without version bump: ${pluginName}`);
  }
};

const validatePluginEntry = async (entry, validators, gitContext) => {
  const expectedSource = `./plugins/${entry.name}`;
  assertEqual(entry.source?.source, "local", `${entry.name} source.source`);
  assertEqual(entry.source?.path, expectedSource, `${entry.name} source.path`);

  const sourceDir = path.join(rootDir, entry.source.path);
  let stats;
  try {
    stats = await fs.stat(sourceDir);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`${entry.source.path} does not exist`);
    }

    throw error;
  }

  if (!stats.isDirectory()) {
    throw new Error(`${entry.source.path} is not a directory`);
  }

  const manifestPath = path.join(sourceDir, ".artyx-plugin", "plugin.json");
  if (!(await pathExists(manifestPath))) throw new Error(`${relativePath(manifestPath)} missing`);

  const manifest = await readJsonFile(manifestPath);

  if (!validators.validatePlugin(manifest)) {
    throw new Error(
      `${relativePath(manifestPath)} invalid: ${formatAjvErrors(validators.validatePlugin.errors)}`
    );
  }

  assertEqual(manifest.name, path.basename(sourceDir), "manifest.name");
  assertEqual(manifest.name, entry.name, "manifest.name");
  assertEqual(manifest.interface.category, entry.category, `${entry.name} category`);
  assertUrl(manifest.artyx?.companion?.docsUrl, `${entry.name} companion.docsUrl`);
  assertUrl(manifest.artyx?.companion?.downloadUrl, `${entry.name} companion.downloadUrl`);

  const hasMcp = await validateMcpConfig(sourceDir, manifest, validators.validateMcp);
  const skillCount = await validateSkills(sourceDir);
  await validateVersionBump(entry.name, manifest.version, gitContext);

  return { hasMcp, skillCount };
};

const main = async () => {
  const validators = await loadSchemas();
  const marketplace = await readJson(marketplacePath);

  if (!validators.validateMarketplace(marketplace)) {
    throw new Error(
      `${marketplacePath} invalid: ${formatAjvErrors(validators.validateMarketplace.errors)}`
    );
  }

  console.log("[ok] marketplace schema");
  validateMarketplaceEntries(marketplace.plugins);
  console.log("[ok] marketplace entries");
  await validateRepositoryLimits();
  console.log("[ok] repository limits");

  const gitContext = {
    hasOriginMain: await hasGitRef("origin/main")
  };

  let failed = false;

  for (const entry of marketplace.plugins) {
    try {
      const result = await validatePluginEntry(entry, validators, gitContext);
      const mcpLabel = result.hasMcp ? "mcp" : "no-mcp";
      console.log(
        `[ok] ${entry.name}: manifest, source, ${mcpLabel}, skills:${result.skillCount}, version`
      );
    } catch (error) {
      failed = true;
      console.error(`[fail] ${entry.name}: ${error.message}`);
    }
  }

  if (failed) {
    process.exit(1);
  }

  console.log(`All ${marketplace.plugins.length} plugins valid`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
