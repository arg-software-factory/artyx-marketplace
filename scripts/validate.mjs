import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import matter from "gray-matter";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const readJsonFile = async (filePath) => JSON.parse(await fs.readFile(filePath, "utf8"));

const readJson = async (relativePath) => readJsonFile(path.join(rootDir, relativePath));

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

const loadSchemas = async () => {
  const [marketplaceSchema, pluginSchema, mcpSchema, marketplaceV2Schema, pluginV2Schema] = await Promise.all([
    readJson("schema/marketplace.schema.json"),
    readJson("schema/plugin.schema.json"),
    readJson("schema/mcp.schema.json"),
    readJson("schema/marketplace-v2.schema.json"),
    readJson("schema/plugin-v2.schema.json")
  ]);

  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);

  return {
    validateMarketplace: ajv.compile(marketplaceSchema),
    validatePlugin: ajv.compile(pluginSchema),
    validateMcp: ajv.compile(mcpSchema),
    validateMarketplaceV2: ajv.compile(marketplaceV2Schema),
    validatePluginV2: ajv.compile(pluginV2Schema)
  };
};

const validateSkill = async (skillPath) => {
  const raw = await fs.readFile(skillPath, "utf8");
  const parsed = matter(raw);

  if (!parsed.data.name || !parsed.data.description) {
    throw new Error(`${path.relative(rootDir, skillPath)} missing frontmatter name/description`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parsed.data.name)) {
    throw new Error(`${path.relative(rootDir, skillPath)} has an invalid skill name`);
  }
};

const assertSafeTree = async (treeRoot, current = treeRoot, state = { files: 0, bytes: 0 }) => {
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = path.join(current, entry.name);
    const stat = await fs.lstat(filePath);
    if (stat.isSymbolicLink()) throw new Error(`${path.relative(rootDir, filePath)} is a symlink`);
    if (entry.isDirectory()) {
      await assertSafeTree(treeRoot, filePath, state);
    } else if (entry.isFile()) {
      state.files += 1;
      state.bytes += stat.size;
      if (state.files > 256 || state.bytes > 24 * 1024 * 1024 || stat.size > 4 * 1024 * 1024) {
        throw new Error(`${path.relative(rootDir, treeRoot)} exceeds package safety limits`);
      }
    } else {
      throw new Error(`${path.relative(rootDir, filePath)} is a special file`);
    }
  }
};

const validateSkills = async (sourceDir) => {
  const skillsDir = path.join(sourceDir, "skills");

  let skillDirEntries;
  try {
    skillDirEntries = await fs.readdir(skillsDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }

    throw error;
  }

  for (const skillDirEntry of skillDirEntries) {
    if (!skillDirEntry.isDirectory()) {
      throw new Error(`${path.relative(rootDir, path.join(skillsDir, skillDirEntry.name))} must be a directory`);
    }

    const skillDir = path.join(skillsDir, skillDirEntry.name);
    await assertSafeTree(skillDir);
    await validateSkill(path.join(skillDir, "SKILL.md"));
  }
};

const validateMcpConfig = async (sourceDir, validateMcp) => {
  const mcpPath = path.join(sourceDir, ".mcp.json");

  try {
    await fs.access(mcpPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }

    throw error;
  }

  const mcpConfig = await readJsonFile(mcpPath);

  if (!validateMcp(mcpConfig)) {
    throw new Error(`.mcp.json invalid: ${formatAjvErrors(validateMcp.errors)}`);
  }
};

const SECRET_KEY = /token|key|secret|password|bearer|credential|authorization/i;

const assertNoLiteralSecrets = (value, trail = "mcp") => {
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string" && SECRET_KEY.test(key) && !item.includes("${")) {
      throw new Error(`${trail}.${key} contains a literal secret`);
    }
    if (item && typeof item === "object") assertNoLiteralSecrets(item, `${trail}.${key}`);
  }
};

const validateNativePlugin = async (entry, validators) => {
  const sourceDir = path.join(rootDir, "plugins", entry.name);
  const manifest = await readJsonFile(path.join(sourceDir, ".artyx-plugin", "plugin.json"));
  if (!validators.validatePluginV2(manifest)) {
    throw new Error(`native plugin.json invalid: ${formatAjvErrors(validators.validatePluginV2.errors)}`);
  }
  assertEqual(manifest.name, entry.name, "v2 name");
  assertEqual(manifest.version, entry.version, "v2 version");
  for (const componentPath of Object.values(manifest.components ?? {})) {
    const target = path.resolve(sourceDir, componentPath);
    if (!target.startsWith(`${sourceDir}${path.sep}`)) throw new Error("component path escapes plugin");
    await fs.access(target);
  }
  const mcpPath = path.join(sourceDir, manifest.components?.mcp ?? "mcp.json");
  const mcp = await readJsonFile(mcpPath).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (mcp && !validators.validateMcp(mcp)) {
    throw new Error(`native mcp.json invalid: ${formatAjvErrors(validators.validateMcp.errors)}`);
  }
  if (mcp) assertNoLiteralSecrets(mcp);
  await validateSkills(sourceDir);
  await assertSafeTree(sourceDir);
};

const validatePluginEntry = async (entry, validators) => {
  const sourceDir = path.join(rootDir, entry.source);
  const stats = await fs.stat(sourceDir);

  if (!stats.isDirectory()) {
    throw new Error(`${entry.source} is not a directory`);
  }

  const manifest = await readJsonFile(path.join(sourceDir, ".claude-plugin", "plugin.json"));

  if (!validators.validatePlugin(manifest)) {
    throw new Error(`plugin.json invalid: ${formatAjvErrors(validators.validatePlugin.errors)}`);
  }

  assertEqual(manifest.name, entry.name, "name");
  assertUrl(manifest.companion?.docsUrl, `${entry.name} companion.docsUrl`);
  assertUrl(manifest.companion?.downloadUrl, `${entry.name} companion.downloadUrl`);

  await validateMcpConfig(sourceDir, validators.validateMcp);
  await validateSkills(sourceDir);
};

const main = async () => {
  const validators = await loadSchemas();
  const marketplace = await readJson("marketplace.json");
  const marketplaceV2 = await readJson("marketplace.v2.json");

  if (!validators.validateMarketplace(marketplace)) {
    throw new Error(
      `marketplace.json invalid: ${formatAjvErrors(validators.validateMarketplace.errors)}`
    );
  }
  if (!validators.validateMarketplaceV2(marketplaceV2)) {
    throw new Error(
      `marketplace.v2.json invalid: ${formatAjvErrors(validators.validateMarketplaceV2.errors)}`
    );
  }
  const duplicateIds = marketplaceV2.plugins
    .map((entry) => entry.name)
    .filter((name, index, all) => all.indexOf(name) !== index);
  if (duplicateIds.length > 0) throw new Error(`duplicate v2 plugin ids: ${duplicateIds.join(", ")}`);

  let failed = false;

  for (const entry of marketplace.plugins) {
    try {
      await validatePluginEntry(entry, validators);
      console.log(`✓ ${entry.name}`);
    } catch (error) {
      failed = true;
      console.error(`✗ ${entry.name}: ${error.message}`);
    }
  }

  for (const entry of marketplaceV2.plugins) {
    try {
      await validateNativePlugin(entry, validators);
      console.log(`✓ v2/${entry.name}`);
    } catch (error) {
      failed = true;
      console.error(`✗ v2/${entry.name}: ${error.message}`);
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
