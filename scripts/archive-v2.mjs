import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { PassThrough } from "node:stream";

import archiver from "archiver";

const FIXED_DATE = new Date("1980-01-01T00:00:00.000Z");
const INCLUDED_ROOTS = ["skills", "agents", "assets"];
const INCLUDED_FILES = ["mcp.json", "README.md", "LICENSE"];

const isSafeArchivePath = (value) => {
  const normalized = value.replaceAll("\\", "/");
  return (
    normalized.length > 0 &&
    !normalized.startsWith("/") &&
    !normalized.split("/").includes("..") &&
    !/^[A-Za-z]:/.test(normalized)
  );
};

const collectDirectory = async (root, current = root) => {
  const entries = await fs.readdir(current, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = path.join(current, entry.name);
    const stat = await fs.lstat(absolutePath);
    if (stat.isSymbolicLink()) throw new Error(`Symlink not allowed: ${absolutePath}`);
    if (entry.isDirectory()) {
      files.push(...(await collectDirectory(root, absolutePath)));
    } else if (entry.isFile()) {
      files.push({
        name: path.relative(root, absolutePath).replaceAll("\\", "/"),
        data: await fs.readFile(absolutePath)
      });
    } else {
      throw new Error(`Special file not allowed: ${absolutePath}`);
    }
  }
  return files;
};

const vendorManifest = (manifest, host) => {
  const output = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description
  };
  if (manifest.publisher) {
    output.author = host === "codex" ? manifest.publisher : { name: manifest.publisher };
  }
  if (manifest.homepage) output.homepage = manifest.homepage;
  if (manifest.license) output.license = manifest.license;
  if (manifest.keywords) output.keywords = manifest.keywords;
  if (manifest.companion && host === "claude") output.companion = manifest.companion;
  return output;
};

const jsonBuffer = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");

export const buildPluginArchive = async (pluginDir) => {
  const manifestPath = path.join(pluginDir, ".artyx-plugin", "plugin.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const entries = [
    { name: ".artyx-plugin/plugin.json", data: await fs.readFile(manifestPath) },
    { name: ".claude-plugin/plugin.json", data: jsonBuffer(vendorManifest(manifest, "claude")) },
    { name: ".codex-plugin/plugin.json", data: jsonBuffer(vendorManifest(manifest, "codex")) },
    { name: ".cursor-plugin/plugin.json", data: jsonBuffer(vendorManifest(manifest, "cursor")) }
  ];

  for (const name of INCLUDED_FILES) {
    const filePath = path.join(pluginDir, name);
    const stat = await fs.lstat(filePath).catch(() => null);
    if (!stat) continue;
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`Invalid package file: ${filePath}`);
    entries.push({ name, data: await fs.readFile(filePath) });
    if (name === "mcp.json") entries.push({ name: ".mcp.json", data: await fs.readFile(filePath) });
  }
  for (const rootName of INCLUDED_ROOTS) {
    const root = path.join(pluginDir, rootName);
    for (const file of await collectDirectory(root)) {
      entries.push({ name: `${rootName}/${file.name}`, data: file.data });
    }
  }

  const names = new Set();
  for (const entry of entries) {
    if (!isSafeArchivePath(entry.name)) throw new Error(`Unsafe archive path: ${entry.name}`);
    if (names.has(entry.name)) throw new Error(`Duplicate archive path: ${entry.name}`);
    names.add(entry.name);
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  const output = new PassThrough();
  const chunks = [];
  output.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const completion = new Promise((resolve, reject) => {
    output.on("end", resolve);
    output.on("error", reject);
    archive.on("warning", reject);
    archive.on("error", reject);
  });
  archive.pipe(output);
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    archive.append(entry.data, { name: entry.name, date: FIXED_DATE, mode: 0o100644 });
  }
  await archive.finalize();
  await completion;
  const buffer = Buffer.concat(chunks);
  return {
    buffer,
    sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
    sizeBytes: buffer.byteLength,
    manifest
  };
};
