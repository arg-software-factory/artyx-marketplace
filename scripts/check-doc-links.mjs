import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONCURRENCY = 12;
const REQUEST_TIMEOUT_MS = 20_000;
const TRAILING_PUNCTUATION = /[.,;:!?)}\]}>]+$/u;
const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/gu;
const USER_AGENT =
  'Mozilla/5.0 (compatible; artyx-marketplace-doc-link-checker/1.0; +https://github.com)';
const jsonOutput = process.argv.includes('--json');

async function findMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return findMarkdownFiles(entryPath);
      }
      return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : [];
    }),
  );

  return files.flat();
}

function normalizeUrl(value) {
  const fragmentStart = value.indexOf('#');
  const withoutFragment = fragmentStart === -1 ? value : value.slice(0, fragmentStart);
  return withoutFragment.replace(TRAILING_PUNCTUATION, '');
}

function isSkippedUrl(value) {
  try {
    const { hostname } = new URL(value);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

async function collectUrls(pluginDirectory) {
  const markdownFiles = await findMarkdownFiles(pluginDirectory);
  const urlSets = await Promise.all(
    markdownFiles.map(async (file) => {
      const contents = await readFile(file, 'utf8');
      const urls = contents.match(URL_PATTERN) ?? [];
      return urls.map(normalizeUrl).filter((url) => url && !isSkippedUrl(url));
    }),
  );

  return [...new Set(urlSets.flat())];
}

async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': USER_AGENT,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    // Undici keeps the socket checked out until the body is read or cancelled;
    // an unconsumed body stalls the connection pool and the run never finishes.
    await response.body?.cancel();

    return response.status === 200
      ? { url, ok: true }
      : { url, ok: false, reason: `HTTP ${response.status}` };
  } catch (error) {
    const reason = error instanceof Error ? error.message.replace(/\s+/gu, ' ') : String(error);
    return { url, ok: false, reason };
  }
}

async function checkUrls(urls) {
  const results = new Array(urls.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < urls.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await checkUrl(urls[currentIndex]);
    }
  }

  const workerCount = Math.min(CONCURRENCY, urls.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

function printResults(checked, failures) {
  if (jsonOutput) {
    console.log(JSON.stringify({ checked, failed: failures.length, failures }, null, 2));
    return;
  }

  for (const { url, reason } of failures) {
    console.log(`FAIL ${url} (${reason})`);
  }
  console.log(`${checked} checked, ${failures.length} failed`);
}

async function main() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const pluginDirectory = path.resolve(scriptDirectory, '..', 'plugins');
  const urls = await collectUrls(pluginDirectory);
  const results = await checkUrls(urls);
  const failures = results.filter((result) => !result.ok);

  printResults(urls.length, failures);
  process.exitCode = failures.length === 0 ? 0 : 1;
}

main().catch((error) => {
  const reason = error instanceof Error ? error.message : String(error);
  if (jsonOutput) {
    console.log(JSON.stringify({ checked: 0, failed: 1, failures: [{ reason }] }, null, 2));
  } else {
    console.error(`FAIL link-checker (${reason})`);
    console.log('0 checked, 1 failed');
  }
  process.exitCode = 1;
});
