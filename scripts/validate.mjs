import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import matter from "gray-matter";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const readJson = async (relativePath) => {
  const raw = await fs.readFile(path.join(rootDir, relativePath), "utf8");
  return JSON.parse(raw);
};

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
  const [marketplaceSchema, pluginSchema] = await Promise.all([
    readJson("schema/marketplace.schema.json"),
    readJson("schema/artyx-plugin.schema.json")
  ]);

  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);

  return {
    validateMarketplace: ajv.compile(marketplaceSchema),
    validatePlugin: ajv.compile(pluginSchema)
  };
};

const validateSkill = async (pluginSource, skillDir) => {
  const skillPath = path.join(rootDir, pluginSource, skillDir, "SKILL.md");
  const raw = await fs.readFile(skillPath, "utf8");
  const parsed = matter(raw);

  if (!parsed.data.name || !parsed.data.description) {
    throw new Error(`${path.relative(rootDir, skillPath)} missing frontmatter name/description`);
  }
};

const validatePluginEntry = async (entry, validatePlugin) => {
  const sourceDir = path.join(rootDir, entry.source);
  const stats = await fs.stat(sourceDir);

  if (!stats.isDirectory()) {
    throw new Error(`${entry.source} is not a directory`);
  }

  const manifest = await readJson(path.join(entry.source, "artyx-plugin.json"));

  if (!validatePlugin(manifest)) {
    throw new Error(formatAjvErrors(validatePlugin.errors));
  }

  assertEqual(manifest.id, entry.id, "id");
  assertEqual(manifest.mcp.transport, entry.transport, "transport");
  assertEqual(manifest.mcp.auth, entry.auth, "auth");
  assertEqual(manifest.category, entry.category, "category");
  assertEqual(manifest.icon, entry.icon, "icon");
  assertEqual(manifest.version, entry.version, "version");

  for (const skillDir of manifest.skills ?? []) {
    await validateSkill(entry.source, skillDir);
  }

  assertUrl(manifest.companion?.docsUrl, `${entry.id} companion.docsUrl`);
  assertUrl(manifest.companion?.downloadUrl, `${entry.id} companion.downloadUrl`);
};

const main = async () => {
  const { validateMarketplace, validatePlugin } = await loadSchemas();
  const marketplace = await readJson("marketplace.json");

  if (!validateMarketplace(marketplace)) {
    throw new Error(`marketplace.json invalid: ${formatAjvErrors(validateMarketplace.errors)}`);
  }

  let failed = false;

  for (const entry of marketplace.plugins) {
    try {
      await validatePluginEntry(entry, validatePlugin);
      console.log(`✓ ${entry.id}`);
    } catch (error) {
      failed = true;
      console.error(`✗ ${entry.id}: ${error.message}`);
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
