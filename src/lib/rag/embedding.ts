import OpenAI from "openai";
import { prisma } from "@/lib/db";

export const BAILIAN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
export const EMBEDDING_MODEL = "text-embedding-v4";
export const EMBEDDING_DIM = 1024;
const BATCH_SIZE = 10;

function getClient(apiKey: string) {
  return new OpenAI({
    apiKey,
    baseURL: BAILIAN_BASE_URL,
  });
}

export async function embedTexts(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const results: number[][] = [];
  const client = getClient(apiKey);

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const resp = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIM,
      encoding_format: "float",
    });
    results.push(...resp.data.map((item) => item.embedding));
  }

  return results;
}

export async function embedQuery(query: string, apiKey: string): Promise<number[]> {
  const resp = await getClient(apiKey).embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
    dimensions: EMBEDDING_DIM,
    encoding_format: "float",
  });
  return resp.data[0]?.embedding || [];
}

export async function embedChunksForFile(options: {
  fileAssetId: string;
  apiKey: string;
}): Promise<void> {
  const chunks = await prisma.documentChunk.findMany({
    where: { fileAssetId: options.fileAssetId },
    select: { id: true, content: true },
    orderBy: { chunkIndex: "asc" },
  });
  if (chunks.length === 0) return;

  const embeddings = await embedTexts(
    chunks.map((chunk) => chunk.content),
    options.apiKey
  );

  for (let i = 0; i < chunks.length; i += 1) {
    const vector = `[${embeddings[i].join(",")}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
      vector,
      chunks[i].id
    );
  }
}
