import { Configuration, DashscopeApi } from "dashscope-sdk-official";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import {
  getQueryEmbeddingCache,
  setQueryEmbeddingCache,
} from "@/lib/cache/rag-query-embed-cache";

export const EMBEDDING_MODEL = "qwen3-vl-embedding";
export const EMBEDDING_DIM = 1024;
const BATCH_SIZE = 10;
const CHUNK_EMBED_CONCURRENCY = 5;
const MAX_MEDIA_PER_FUSION = 5; // qwen3-vl-embedding limit per fusion request

function getApi(apiKey: string) {
  return new DashscopeApi(new Configuration({ apiKey }));
}

function normalizeEmbeddingInput(items: { text?: string; image?: string; video?: string }[]) {
  return items.map((item) => {
    if (item.video) return { video: item.video };
    if (item.image) return { image: item.image };
    return { text: item.text ?? "" };
  });
}

interface EmbeddingCallOptions {
  enableFusion?: boolean;
  expectCount?: number;
  context?: string;
}

async function callMultiModalEmbedding(
  api: DashscopeApi,
  input: { text?: string; image?: string; video?: string }[],
  options: EmbeddingCallOptions = {}
): Promise<number[][]> {
  const { enableFusion = false, expectCount = input.length, context } = options;

  const result = await api.createMultiModalEmbedding({
    model: EMBEDDING_MODEL,
    input: normalizeEmbeddingInput(input),
    enable_fusion: enableFusion,
    dimension: EMBEDDING_DIM,
  });

  const prefix = context ? `${context}: ` : "";

  if (result.status_code !== 200 || !result.output?.embeddings) {
    throw new Error(
      `${prefix}Embedding failed: ${result.code ?? "unknown"} ${result.message ?? ""}`.trim()
    );
  }

  const embeddings = result.output.embeddings
    .slice()
    .sort((a, b) => (a.text_index ?? 0) - (b.text_index ?? 0))
    .map((item) => item.embedding);

  if (embeddings.length !== expectCount) {
    throw new Error(
      `${prefix}Embedding count mismatch: expected ${expectCount}, got ${embeddings.length}`
    );
  }

  for (const embedding of embeddings) {
    if (embedding.length !== EMBEDDING_DIM) {
      throw new Error(
        `${prefix}Embedding dimension mismatch: expected ${EMBEDDING_DIM}, got ${embedding.length}`
      );
    }
  }

  return embeddings;
}

export async function embedTexts(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const results: number[][] = [];
  const api = getApi(apiKey);

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await callMultiModalEmbedding(
      api,
      batch.map((text) => ({ text })),
      { expectCount: batch.length, context: `batch ${i / BATCH_SIZE + 1}` }
    );
    results.push(...embeddings);
  }

  return results;
}

export async function embedQuery(query: string, apiKey: string): Promise<number[]> {
  const cached = await getQueryEmbeddingCache(query);
  if (cached) return cached;

  const embeddings = await embedTexts([query], apiKey);
  const result = embeddings[0];
  await setQueryEmbeddingCache(query, result);
  return result;
}

export async function embedChunkWithFallback(options: {
  chunk: { id: string; content: string; mediaUrls: string[] };
  api: DashscopeApi;
}): Promise<number[]> {
  const { chunk, api } = options;
  const mediaUrls = (chunk.mediaUrls ?? []).slice(0, MAX_MEDIA_PER_FUSION);
  const multimediaInput: { text?: string; image?: string; video?: string }[] = [
    { text: chunk.content },
  ];
  for (const url of mediaUrls) {
    if (/\.(mp4|mov|avi|webm|mkv|flv|mpeg|mpg)(\?.*)?$/i.test(url)) {
      multimediaInput.push({ video: url });
    } else {
      multimediaInput.push({ image: url });
    }
  }

  try {
    const embeddings = await callMultiModalEmbedding(api, multimediaInput, {
      enableFusion: true,
      expectCount: 1,
      context: `chunk ${chunk.id}`,
    });
    return embeddings[0];
  } catch (error) {
    console.warn(
      `Multimodal embedding failed for chunk ${chunk.id}, falling back to text-only`,
      error
    );
    const embeddings = await callMultiModalEmbedding(api, [{ text: chunk.content }], {
      enableFusion: false,
      expectCount: 1,
      context: `chunk ${chunk.id} text fallback`,
    });
    return embeddings[0];
  }
}

export async function embedChunksForFile(options: {
  fileAssetId: string;
  apiKey: string;
}): Promise<void> {
  const fileAsset = await prisma.fileAsset.findUnique({
    where: { id: options.fileAssetId },
    select: { textContent: true },
  });
  if (!fileAsset?.textContent) return;

  const newHash = crypto
    .createHash("sha256")
    .update(fileAsset.textContent)
    .digest("hex")
    .slice(0, 32);

  const existingChunks =
    await prisma.$queryRawUnsafe<
      { id: string; contentHash: string | null; content: string; mediaUrls: string[]; embedding: unknown }[]
    >(
      `SELECT id, "contentHash", content, "mediaUrls", embedding FROM "DocumentChunk" WHERE "fileAssetId" = $1 ORDER BY "chunkIndex" ASC`,
      options.fileAssetId
    );

  if (
    existingChunks.length > 0 &&
    existingChunks.every((c) => c.contentHash === newHash && c.embedding !== null)
  ) {
    return; // Content unchanged and already embedded
  }

  if (existingChunks.length === 0) return;

  const api = getApi(options.apiKey);

  for (let i = 0; i < existingChunks.length; i += CHUNK_EMBED_CONCURRENCY) {
    const batch = existingChunks.slice(i, i + CHUNK_EMBED_CONCURRENCY);
    await Promise.all(
      batch.map(async (chunk) => {
        try {
          const embedding = await embedChunkWithFallback({ chunk, api });
          const vector = `[${embedding.join(",")}]`;
          await prisma.$executeRawUnsafe(
            `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
            vector,
            chunk.id
          );
        } catch (error) {
          console.error(`Failed to embed chunk ${chunk.id}:`, error);
        }
      })
    );
  }
}
