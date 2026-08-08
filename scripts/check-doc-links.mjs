import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONCURRENCY = 12;
const REQUEST_TIMEOUT_MS = 20_000;
const TRAILING_PUNCTUATION = /[.,;:!?)}\]}>]+$/u;
const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/gu;
const USER_AGENT =
  'Mozilla/5.0 (compatible; artyx-marketplace-doc-link-checker/1.0; +https://github.com)';
const jsonOutput = process.argv.includes('--json');

async function findMarkdownFilesInDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return findMarkdownFilesInDirectory(entryPath);
      }
      return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : [];
    }),
  );

  return files.flat();
}

/**
 * A root is either a single markdown file (README.md, CONTRIBUTING.md) or a
 * directory walked recursively (plugins/, docs/). A missing root is not an
 * error — not every checkout has a docs/ directory yet.
 */
async function findMarkdownFiles(rootPath) {
  let stats;
  try {
    stats = await stat(rootPath);
  } catch {
    return [];
  }
  if (stats.isDirectory()) return findMarkdownFilesInDirectory(rootPath);
  return stats.isFile() && rootPath.endsWith('.md') ? [rootPath] : [];
}

function normalizeUrl(value) {
  const fragmentStart = value.indexOf('#');
  const withoutFragment = fragmentStart === -1 ? value : value.slice(0, fragmentStart);
  return withoutFragment.replace(TRAILING_PUNCTUATION, '');
}

function isSkippedUrl(value) {
  // A "${VAR}" placeholder means this is example text showing the overlay
  // pattern (see CONTRIBUTING.md), not a link — nothing this checker fetches
  // resolves a template.
  if (value.includes('${')) return true;
  // A git clone endpoint is not a web page. Forges routinely answer a browser
  // GET on one with 403 or 404 while `git clone` against it works fine, so
  // fetching it here reports a broken link that is not broken. These appear
  // inside install commands, never as documentation hyperlinks.
  if (value.startsWith('git+') || value.endsWith('.git')) return true;
  try {
    const { hostname } = new URL(value);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

async function collectUrls(roots) {
  const markdownFiles = (await Promise.all(roots.map(findMarkdownFiles))).flat();
  const urlSets = await Promise.all(
    markdownFiles.map(async (file) => {
      const contents = await readFile(file, 'utf8');
      const urls = contents.match(URL_PATTERN) ?? [];
      return urls.map(normalizeUrl).filter((url) => url && !isSkippedUrl(url));
    }),
  );

  return [...new Set(urlSets.flat())];
}

/** Trailing slashes and #fragments are not relocations; ignore them when diffing. */
function normalizeForCompare(value) {
  if (!value) return '';
  return value.split('#')[0].replace(/\/+$/u, '');
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

    if (response.status !== 200) {
      return { url, ok: false, reason: `HTTP ${response.status}` };
    }

    // Vendor docs answer a retired page with 200 + a redirect to a section index
    // or a "page not found" shell, so status alone cannot prove the topic still
    // exists. Report the landing URL when it differs so a silent relocation is
    // reviewable instead of invisible.
    const landed = normalizeForCompare(response.url);
    return landed && landed !== normalizeForCompare(url)
      ? { url, ok: true, redirectedTo: response.url }
      : { url, ok: true };
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

function printResults(checked, failures, redirects = []) {
  if (jsonOutput) {
    console.log(
      JSON.stringify({ checked, failed: failures.length, failures, redirects }, null, 2),
    );
    return;
  }

  for (const { url, reason } of failures) {
    console.log(`FAIL ${url} (${reason})`);
  }
  // Not a failure: a redirect still serves the reader. Surfaced so a page that
  // quietly became a section index gets a human look instead of passing silently.
  for (const { url, redirectedTo } of redirects) {
    console.log(`NOTE ${url}\n  -> redirects to ${redirectedTo}`);
  }
  console.log(
    `${checked} checked, ${failures.length} failed` +
      (redirects.length > 0 ? `, ${redirects.length} redirected` : ''),
  );
}

async function main() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDirectory, '..');
  const roots = [
    path.join(repoRoot, 'plugins'),
    path.join(repoRoot, 'README.md'),
    path.join(repoRoot, 'CONTRIBUTING.md'),
    path.join(repoRoot, 'docs'),
  ];
  const urls = await collectUrls(roots);
  const results = await checkUrls(urls);
  const failures = results.filter((result) => !result.ok);
  const redirects = results.filter((result) => result.ok && result.redirectedTo);

  printResults(urls.length, failures, redirects);
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
