/**
 * Vector store — DocumentChunk CRUD and similarity search.
 * Uses pgvector <-> distance operator via Prisma raw queries.
 *
 * MVP: chunk text only, no embedding. Embedding field is reserved for later.
 */

import { prisma } from "@/lib/db";
import crypto from "crypto";
import { createTextMessage } from "@/lib/deepseek";
import { getProviderApiKey } from "@/lib/data/provider-access";
import {
  matchProjectIndex,
  refreshProjectIndex,
  type ProjectIndexMatch,
} from "@/lib/rag/project-index";

// ============================================================
// Configuration
// ============================================================

/** Embedding dimensions — Aliyun Bailian text-embedding-v4 default */
export const EMBEDDING_DIM = 1024;

/** Default chunk size in characters */
const CHUNK_SIZE = 1500;

/** Overlap between consecutive chunks in characters */
const CHUNK_OVERLAP = 150;

// ============================================================
// Types
// ============================================================

export interface CreateChunksParams {
  fileAssetId: string;
  projectId: string | null;
  userId: string;
  textContent: string;
  title?: string;
}

export interface SearchParams {
  userId: string;
  projectId?: string;
  /** Query embedding vector (if available) */
  queryEmbedding?: number[];
  limit?: number;
}

export interface ChunkSearchResult {
  id: string;
  content: string;
  title: string | null;
  fileAssetId: string | null;
  projectId: string | null;
  chunkIndex: number;
  distance: number;
}

export interface KeywordChunkResult {
  id: string;
  content: string;
  title: string | null;
  fileAssetId: string | null;
  projectId: string | null;
  chunkIndex: number;
  originalName: string | null;
}

export interface RetrieveProjectContextParams {
  userId: string;
  projectId: string;
  selectedFileIds: string[];
  query: string;
  maxChars: number;
  queryEmbedding?: number[];
}

export interface RetrievedProjectContext {
  context: string;
  notice: string | null;
  usedFileIds: string[];
  truncated: boolean;
}

// ============================================================
// Text splitting
// ============================================================

/**
 * Split text into overlapping chunks by character count.
 * Tries to break at paragraph boundaries within the limit.
 */
function splitTextIntoChunks(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  if (!text || text.trim().length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + size;
    if (end >= text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }

    // Try to break at a paragraph boundary (double newline or period+newline)
    const searchRegion = text.slice(end - overlap, end);
    const lastPara = searchRegion.lastIndexOf("\n\n");
    const lastPeriod = searchRegion.lastIndexOf("。\n");

    let breakPoint = -1;
    if (lastPara !== -1) breakPoint = end - overlap + lastPara + 2;
    else if (lastPeriod !== -1) breakPoint = end - overlap + lastPeriod + 1;

    if (breakPoint !== -1 && breakPoint > start) {
      end = breakPoint;
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    if (start < 0) start = 0;
  }

  return chunks.filter((c) => c.length > 0);
}

// ============================================================
// Chunk CRUD
// ============================================================

/**
 * Split text content into chunks and insert into DocumentChunk table.
 * Deletes existing chunks for the same fileAssetId first.
 * MVP: no embedding — only stores content.
 */
export async function createDocumentChunks(params: CreateChunksParams): Promise<number> {
  const { fileAssetId, projectId, userId, textContent, title } = params;

  // Delete existing chunks for this file
  await prisma.documentChunk.deleteMany({
    where: { fileAssetId, userId },
  });

  const texts = splitTextIntoChunks(textContent);
  if (texts.length === 0) return 0;

  const contentHash = crypto
    .createHash("sha256")
    .update(textContent)
    .digest("hex")
    .slice(0, 32);

  // Batch insert
  const data = texts.map((content, i) => ({
    userId,
    projectId,
    fileAssetId,
    title: title || null,
    content,
    contentHash,
    chunkIndex: i,
    tokenCount: Math.ceil(content.length / 2), // rough estimate: ~2 chars per token
  }));

  await prisma.documentChunk.createMany({ data });

  return texts.length;
}

/**
 * Search similar chunks by embedding vector using pgvector <-> operator.
 * Returns empty array if queryEmbedding is not provided (MVP).
 * Results are scoped by userId.
 */
export async function searchSimilarChunks(
  params: SearchParams
): Promise<ChunkSearchResult[]> {
  const { userId, projectId, queryEmbedding, limit = 10 } = params;

  // MVP: no embedding → return empty
  if (!queryEmbedding || queryEmbedding.length !== EMBEDDING_DIM) {
    return [];
  }

  const vectorStr = `[${queryEmbedding.join(",")}]`;

  const projectFilter = projectId
    ? `AND "projectId" = '${projectId}'`
    : "";

  // Use raw SQL for pgvector distance operator
  const rows = await prisma.$queryRawUnsafe<ChunkSearchResult[]>(
    `SELECT
      id, content, title, "fileAssetId", "projectId", "chunkIndex",
      embedding <-> $1::vector AS distance
    FROM "DocumentChunk"
    WHERE "userId" = $2
      AND embedding IS NOT NULL
      ${projectFilter}
    ORDER BY embedding <-> $1::vector
    LIMIT $3`,
    vectorStr,
    userId,
    limit
  );

  return rows || [];
}

function extractKeywords(query: string): string[] {
  const runs = query
    .toLowerCase()
    .match(/[\p{Script=Han}a-z0-9_+-]{2,}/gu) || [];
  const terms = new Set<string>();

  for (const run of runs) {
    if (run.length <= 8) {
      terms.add(run);
    } else {
      terms.add(run.slice(0, 8));
      if (/^\p{Script=Han}+$/u.test(run)) {
        for (let i = 0; i < run.length - 1 && terms.size < 20; i += 2) {
          terms.add(run.slice(i, i + 2));
        }
      }
    }
    if (terms.size >= 20) break;
  }

  return [...terms];
}

function extractJsonFileIds(value: string): string[] {
  const fenced = value.match(/```json\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || value.match(/\[[\s\S]*\]/)?.[0] || value;
  const parsed = JSON.parse(candidate) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return typeof record.id === "string" ? record.id : null;
      }
      return null;
    })
    .filter((id): id is string => Boolean(id));
}

export async function selectFilesWithDeepSeek(params: {
  userId: string;
  projectId: string;
  query: string;
  limit?: number;
}): Promise<{ fileIds: string[]; source: "agentic-retrieval" | "index-fallback" }> {
  const limit = params.limit ?? 12;
  const fallback = async () => {
    const result = await matchProjectIndex({
      userId: params.userId,
      projectId: params.projectId,
      query: params.query,
      limit,
    });
    return {
      fileIds: result.fullLoadFileIds,
      source: "index-fallback" as const,
    };
  };

  let apiKey: string;
  try {
    apiKey = await getProviderApiKey(params.userId, "deepseek");
  } catch {
    return fallback();
  }

  let projectIndex = await prisma.projectIndex.findUnique({
    where: { projectId: params.projectId },
    select: { content: true },
  });
  if (!projectIndex?.content) {
    const content = await refreshProjectIndex({
      userId: params.userId,
      projectId: params.projectId,
    });
    projectIndex = { content };
  }

  const validFiles = await prisma.fileAsset.findMany({
    where: {
      userId: params.userId,
      projectId: params.projectId,
      status: { in: ["parsed", "partial"] },
    },
    select: { id: true },
  });
  const validIds = new Set(validFiles.map((file) => file.id));

  try {
    const output = await createTextMessage(apiKey, {
      model: "deepseek-v4-flash",
      maxTokens: 1200,
      temperature: 0,
      system:
        "你是课程项目资料检索器。根据 INDEX.md 只选择与问题直接相关的文件。只能输出 JSON 数组。",
      prompt: [
        "从下面 INDEX.md 中选出最相关的文件 ID。",
        `最多选择 ${limit} 个。不要选择无关文件。`,
        "输出格式：[{\"id\":\"file_id\"}]",
        "",
        "# 用户问题",
        params.query,
        "",
        "# INDEX.md",
        projectIndex.content,
      ].join("\n"),
    });
    const fileIds = [...new Set(extractJsonFileIds(output))]
      .filter((id) => validIds.has(id))
      .slice(0, limit);
    if (fileIds.length === 0) return fallback();
    return { fileIds, source: "agentic-retrieval" };
  } catch {
    return fallback();
  }
}

export async function searchChunksByKeyword(params: {
  userId: string;
  projectId: string;
  query: string;
  limit?: number;
}): Promise<KeywordChunkResult[]> {
  const keywords = extractKeywords(params.query);
  if (keywords.length === 0) return [];

  const rows = await prisma.documentChunk.findMany({
    where: {
      userId: params.userId,
      projectId: params.projectId,
      OR: keywords.map((keyword) => ({
        content: { contains: keyword, mode: "insensitive" as const },
      })),
    },
    orderBy: [{ fileAssetId: "asc" }, { chunkIndex: "asc" }],
    take: params.limit || 12,
    select: {
      id: true,
      content: true,
      title: true,
      fileAssetId: true,
      projectId: true,
      chunkIndex: true,
      fileAsset: { select: { originalName: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    title: row.title,
    fileAssetId: row.fileAssetId,
    projectId: row.projectId,
    chunkIndex: row.chunkIndex,
    originalName: row.fileAsset?.originalName || row.title,
  }));
}

export async function hybridSearch(params: {
  userId: string;
  projectId: string;
  query: string;
  queryEmbedding?: number[];
  limit?: number;
}): Promise<KeywordChunkResult[]> {
  const limit = params.limit ?? 10;
  const [vectorResults, keywordResults] = await Promise.all([
    params.queryEmbedding
      ? searchSimilarChunks({
          userId: params.userId,
          projectId: params.projectId,
          queryEmbedding: params.queryEmbedding,
          limit: limit * 2,
        })
      : Promise.resolve([]),
    searchChunksByKeyword({
      userId: params.userId,
      projectId: params.projectId,
      query: params.query,
      limit: limit * 2,
    }),
  ]);

  const scores = new Map<string, number>();
  const k = 60;
  for (const [rank, chunk] of vectorResults.entries()) {
    scores.set(chunk.id, (scores.get(chunk.id) || 0) + 1 / (k + rank + 1));
  }
  for (const [rank, chunk] of keywordResults.entries()) {
    scores.set(chunk.id, (scores.get(chunk.id) || 0) + 1 / (k + rank + 1));
  }

  const sortedIds = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
  if (sortedIds.length === 0) return [];

  const chunks = await prisma.documentChunk.findMany({
    where: { id: { in: sortedIds }, userId: params.userId },
    select: {
      id: true,
      content: true,
      title: true,
      fileAssetId: true,
      projectId: true,
      chunkIndex: true,
      fileAsset: { select: { originalName: true } },
    },
  });
  const byId = new Map(chunks.map((chunk) => [chunk.id, chunk]));

  return sortedIds.flatMap((id) => {
    const chunk = byId.get(id);
    if (!chunk) return [];
    return [{
      id: chunk.id,
      content: chunk.content,
      title: chunk.title,
      fileAssetId: chunk.fileAssetId,
      projectId: chunk.projectId,
      chunkIndex: chunk.chunkIndex,
      originalName: chunk.fileAsset?.originalName || chunk.title,
    }];
  });
}

function parserNotice(file: {
  mimeType: string;
  processingMetadata: unknown;
  enhancedContent: string | null;
  enhancementStatus: string;
}) {
  if (file.enhancedContent && file.enhancementStatus === "enhanced") {
    return "以下内容为基于 OCR 原文整理的增强资料，原始 OCR 可能存在识别误差。";
  }

  const metadata =
    file.processingMetadata && typeof file.processingMetadata === "object"
      ? (file.processingMetadata as Record<string, unknown>)
      : {};
  if (metadata.parser === "pdf-text") {
    return "以下内容来自 PDF 文本提取，可能存在页码顺序或格式丢失。";
  }
  if (
    metadata.parser === "minimax-pdf-vision" ||
    file.mimeType.startsWith("image/")
  ) {
    return "以下内容来自图片 OCR/视觉解析，可能存在识别误差。涉及数字、公式和单位时请提醒用户核对。";
  }
  return "以下资料来自用户选中文件或关键词检索。";
}

export async function retrieveProjectContext(
  params: RetrieveProjectContextParams
): Promise<RetrievedProjectContext> {
  const sections: Array<{
    key: string;
    fileAssetId: string;
    markdown: string;
  }> = [];
  const seen = new Set<string>();
  let summaryOnlyMatches: ProjectIndexMatch[] = [];
  let contextFileIds = [...new Set(params.selectedFileIds)];

  if (contextFileIds.length === 0) {
    try {
      const selection = await selectFilesWithDeepSeek({
        userId: params.userId,
        projectId: params.projectId,
        query: params.query,
        limit: 12,
      });
      contextFileIds = selection.fileIds;
      summaryOnlyMatches = [];
    } catch {
      contextFileIds = [];
      summaryOnlyMatches = [];
    }
  }

  if (contextFileIds.length > 0) {
    const fileOrder = new Map(contextFileIds.map((id, index) => [id, index]));
    const files = await prisma.fileAsset.findMany({
      where: {
        id: { in: contextFileIds },
        userId: params.userId,
        projectId: params.projectId,
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        status: true,
        textContent: true,
        enhancedContent: true,
        enhancementStatus: true,
        processingMetadata: true,
      },
    });

    for (const file of files.sort(
      (a, b) => (fileOrder.get(a.id) ?? 0) - (fileOrder.get(b.id) ?? 0)
    )) {
      const content =
        file.enhancementStatus === "enhanced" && file.enhancedContent
          ? file.enhancedContent
          : file.textContent;
      if (!content || !["parsed", "partial"].includes(file.status)) continue;
      const key = `${file.id}:enhanced-or-full`;
      seen.add(key);
      sections.push({
        key,
        fileAssetId: file.id,
        markdown: `## 来源：${file.originalName}\n\n> ${parserNotice(file)}\n\n${content}`,
      });
    }
  }

  if (summaryOnlyMatches.length > 0) {
    sections.push({
      key: "project-index-summary-only",
      fileAssetId: "",
      markdown: [
        "## INDEX.md 相关文件摘要",
        "",
        "> 以下文件与当前问题相关，但超过 Top-5 全文加载上限，仅提供摘要。",
        "",
        ...summaryOnlyMatches.map(
          (match) =>
            `- ${match.originalName}（${match.category || "未分类"}）：${match.summary}`
        ),
      ].join("\n"),
    });
  }

  const currentChars = sections.reduce(
    (total, section) => total + section.markdown.length,
    0
  );
  if (
    contextFileIds.length === 0 ||
    currentChars < Math.min(params.maxChars, 12000)
  ) {
    const keywordChunks = await hybridSearch({
      userId: params.userId,
      projectId: params.projectId,
      query: params.query,
      queryEmbedding: params.queryEmbedding,
    });

    for (const chunk of keywordChunks) {
      const key = `${chunk.fileAssetId || "none"}:${chunk.chunkIndex}`;
      if (seen.has(key)) continue;
      seen.add(key);
      sections.push({
        key,
        fileAssetId: chunk.fileAssetId || "",
        markdown: `## 来源：${chunk.originalName || chunk.title || "项目资料"}（chunk ${chunk.chunkIndex + 1}）\n\n> 以下资料来自用户选中文件或关键词检索。\n\n${chunk.content}`,
      });
    }
  }

  if (sections.length === 0) {
    return {
      context: "",
      notice: "未找到可用于回答的项目资料。",
      usedFileIds: [],
      truncated: false,
    };
  }

  let context = "";
  let truncated = false;
  for (const section of sections) {
    const separator = context ? "\n\n---\n\n" : "";
    const remaining = params.maxChars - context.length - separator.length;
    if (remaining <= 0) {
      truncated = true;
      break;
    }
    if (section.markdown.length > remaining) {
      context += `${separator}${section.markdown.slice(0, remaining)}`;
      truncated = true;
      break;
    }
    context += `${separator}${section.markdown}`;
  }

  return {
    context,
    notice: null,
    usedFileIds: [...new Set(sections.map((section) => section.fileAssetId).filter(Boolean))],
    truncated,
  };
}

/**
 * Delete all chunks for a file asset. Verifies userId ownership.
 */
export async function deleteChunksByFileAsset(
  fileAssetId: string,
  userId: string
): Promise<number> {
  const result = await prisma.documentChunk.deleteMany({
    where: { fileAssetId, userId },
  });
  return result.count;
}

/**
 * Get all chunks for a file asset (no embedding needed).
 */
export async function getChunksByFileAsset(
  fileAssetId: string,
  userId: string
) {
  return prisma.documentChunk.findMany({
    where: { fileAssetId, userId },
    orderBy: { chunkIndex: "asc" },
    select: {
      id: true,
      content: true,
      chunkIndex: true,
      tokenCount: true,
    },
  });
}
