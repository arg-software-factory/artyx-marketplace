import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildPluginArchive } from "./archive-v2.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(rootDir, "marketplace.v2.json");
const writeCatalog = process.argv.includes("--write-catalog");
const checkOnly = process.argv.includes("--check");

const main = async () => {
  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  const outputDir = path.join(rootDir, "dist", "v2");
  if (!checkOnly) await fs.mkdir(outputDir, { recursive: true });
  let changed = false;

  for (const entry of catalog.plugins) {
    const pluginDir = path.join(rootDir, "plugins", entry.name);
    const first = await buildPluginArchive(pluginDir);
    const second = await buildPluginArchive(pluginDir);
    if (first.sha256 !== second.sha256 || first.sizeBytes !== second.sizeBytes) {
      throw new Error(`${entry.name}: archive build is not deterministic`);
    }
    if (first.manifest.name !== entry.name || first.manifest.version !== entry.version) {
      throw new Error(`${entry.name}: catalog identity does not match native manifest`);
    }
    if (entry.archive.sha256 !== first.sha256 || entry.archive.sizeBytes !== first.sizeBytes) {
      if (!writeCatalog) {
        throw new Error(
          `${entry.name}: catalog digest/size is stale; run npm run catalog:v2`
        );
      }
      entry.archive.sha256 = first.sha256;
      entry.archive.sizeBytes = first.sizeBytes;
      changed = true;
    }
    if (!checkOnly) {
      await fs.writeFile(
        path.join(outputDir, `${entry.name}-${entry.version}.zip`),
        first.buffer
      );
    }
    console.log(`✓ ${entry.name} ${first.sizeBytes} bytes ${first.sha256.slice(0, 12)}`);
  }

  if (writeCatalog && changed) {
    await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    console.log("Updated marketplace.v2.json");
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
