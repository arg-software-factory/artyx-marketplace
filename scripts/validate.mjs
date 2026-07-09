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
  const raw = await fs.readFile(skillPath, "utf8");
  const parsed = matter(raw);

  if (!parsed.data.name || !parsed.data.description) {
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
      return;
    }

    throw error;
  }

  for (const skillDirEntry of skillDirEntries) {
    if (!skillDirEntry.isDirectory()) {
      continue;
    }

    await validateSkill(path.join(skillsDir, skillDirEntry.name, "SKILL.md"));
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

  if (!validators.validateMarketplace(marketplace)) {
    throw new Error(
      `marketplace.json invalid: ${formatAjvErrors(validators.validateMarketplace.errors)}`
    );
  }

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

  if (failed) {
    process.exit(1);
  }

  console.log(`All ${marketplace.plugins.length} plugins valid`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
