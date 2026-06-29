import { describe, it, expect } from "vitest";
import {
  buildSearchCacheKey,
  buildFileSelectCacheKey,
  buildQueryEmbedCacheKey,
  normalizeQuery,
} from "@/lib/cache/rag-cache-keys";

describe("rag cache keys", () => {
  it("normalizes query consistently", () => {
    expect(normalizeQuery("  Hello   World  ")).toBe("hello world");
    expect(normalizeQuery("  你好   世界  ")).toBe("你好 世界");
  });

  it("builds search cache key with version and scope", () => {
    const key = buildSearchCacheKey(
      "proj_1",
      "3",
      "test query",
      ["file_a", "file_b"]
    );
    expect(key).toMatch(/^rag:search:v1:proj_1:3:[a-f0-9]{64}$/);
  });

  it("sorts fileScopeIds for stable key", () => {
    const key1 = buildSearchCacheKey("proj_1", "3", "test", ["b", "a"]);
    const key2 = buildSearchCacheKey("proj_1", "3", "test", ["a", "b"]);
    expect(key1).toBe(key2);
  });

  it("uses ':all' scope when no fileScopeIds provided", () => {
    const key = buildSearchCacheKey("proj_1", "3", "test query");
    expect(key).toMatch(/^rag:search:v1:proj_1:3:[a-f0-9]{64}$/);
  });

  it("builds file select key", () => {
    const key = buildFileSelectCacheKey("proj_1", "2", "query");
    expect(key).toMatch(/^rag:file-select:v1:proj_1:2:[a-f0-9]{64}$/);
  });

  it("builds query embed key", () => {
    const key = buildQueryEmbedCacheKey("query");
    expect(key).toMatch(/^rag:query-embed:v1:[a-f0-9]{64}$/);
  });
});
