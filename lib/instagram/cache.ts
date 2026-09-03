import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

// Raw Instagram data cached per-username on disk, so a repeated analysis of
// the same lead never re-hits Apify unless the caller explicitly asks for a
// refresh. File-based on purpose: this MVP has no database, and the dev/prod
// server is a single long-lived Node process, so a cache directory next to
// the project works and survives across requests.

export interface InstagramCacheEntry {
  fetchedAt: string;
  profile: Record<string, unknown> | null;
  posts: Record<string, unknown>[];
}

const CACHE_DIR = path.join(process.cwd(), ".cache", "instagram");

function cacheFilePath(username: string): string {
  return path.join(CACHE_DIR, `${username.toLowerCase()}.json`);
}

export async function readInstagramCache(username: string): Promise<InstagramCacheEntry | null> {
  try {
    const raw = await readFile(cacheFilePath(username), "utf8");
    return JSON.parse(raw) as InstagramCacheEntry;
  } catch {
    return null;
  }
}

export async function writeInstagramCache(
  username: string,
  entry: InstagramCacheEntry,
): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFilePath(username), JSON.stringify(entry, null, 2), "utf8");
}
