import { getRedis } from "@/lib/redis";
import {
  buildSearchCacheKey,
  buildSearchVersionKey,
} from "@/lib/cache/rag-cache-keys";
import { recordRagCacheResult } from "@/lib/cache/api-cache-metrics";
import type { KeywordChunkResult } from "@/lib/rag/vector-store";

const SEARCH_CACHE_TTL_SECONDS = 60;

export async function getSearchCache(
  projectId: string,
  query: string,
  fileScopeIds?: string[]
): Promise<KeywordChunkResult[] | null> {
  try {
    const version =
      (await getRedis().get(buildSearchVersionKey(projectId))) || "0";
    const key = buildSearchCacheKey(projectId, version, query, fileScopeIds);
    const cached = await getRedis().get(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as KeywordChunkResult[];
    await recordRagCacheResult("search", "hit");
    return parsed;
  } catch {
    return null;
  }
}

export async function setSearchCache(
  projectId: string,
  query: string,
  fileScopeIds: string[] | undefined,
  result: KeywordChunkResult[]
): Promise<void> {
  try {
    const version =
      (await getRedis().get(buildSearchVersionKey(projectId))) || "0";
    const key = buildSearchCacheKey(projectId, version, query, fileScopeIds);
    await getRedis().setex(key, SEARCH_CACHE_TTL_SECONDS, JSON.stringify(result));
    await recordRagCacheResult("search", "miss");
  } catch {
    // Cache failures are non-fatal.
  }
}

export async function invalidateSearchCache(projectId: string): Promise<void> {
  try {
    await getRedis().incr(buildSearchVersionKey(projectId));
  } catch {
    // Ignore.
  }
}
