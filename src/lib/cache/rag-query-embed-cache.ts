import { getRedis } from "@/lib/redis";
import { buildQueryEmbedCacheKey } from "@/lib/cache/rag-cache-keys";
import { recordRagCacheResult } from "@/lib/cache/api-cache-metrics";

const QUERY_EMBED_TTL_SECONDS = 300;

export async function getQueryEmbeddingCache(
  query: string
): Promise<number[] | null> {
  try {
    const key = buildQueryEmbedCacheKey(query);
    const cached = await getRedis().get(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as number[];
    await recordRagCacheResult("query-embed", "hit");
    return parsed;
  } catch {
    return null;
  }
}

export async function setQueryEmbeddingCache(
  query: string,
  embedding: number[]
): Promise<void> {
  try {
    const key = buildQueryEmbedCacheKey(query);
    await getRedis().setex(
      key,
      QUERY_EMBED_TTL_SECONDS,
      JSON.stringify(embedding)
    );
    await recordRagCacheResult("query-embed", "miss");
  } catch {
    // Ignore.
  }
}
