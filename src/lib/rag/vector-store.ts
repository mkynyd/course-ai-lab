/**
 * Vector store — DocumentChunk CRUD and similarity search.
 * Uses pgvector <-> distance operator via Prisma raw queries.
 *
 * MVP: chunk text only, no embedding. Embedding field is reserved for later.
 */

import { prisma } from "@/lib/db";
import crypto from "crypto";
import { matchProjectIndex, type ProjectIndexMatch } from "@/lib/rag/project-index";

// ============================================================
// Configuration
// ============================================================

/** Embedding dimensions — change this when connecting an embedding model */
export const EMBEDDING_DIM = 1536;

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
        for (let i = 0; i < run.length - 1 && terms.size < 8; i += 2) {
          terms.add(run.slice(i, i + 2));
        }
      }
    }
    if (terms.size >= 8) break;
  }

  return [...terms];
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
      const indexMatches = await matchProjectIndex({
        userId: params.userId,
        projectId: params.projectId,
        query: params.query,
        limit: 5,
      });
      contextFileIds = indexMatches.fullLoadFileIds;
      summaryOnlyMatches = indexMatches.summaryOnly;
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
    currentChars < Math.min(params.maxChars, 3000)
  ) {
    const keywordChunks = await searchChunksByKeyword({
      userId: params.userId,
      projectId: params.projectId,
      query: params.query,
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

  if (params.queryEmbedding) {
    const vectorChunks = await searchSimilarChunks({
      userId: params.userId,
      projectId: params.projectId,
      queryEmbedding: params.queryEmbedding,
    });
    for (const chunk of vectorChunks) {
      const key = `${chunk.fileAssetId || "none"}:${chunk.chunkIndex}`;
      if (seen.has(key)) continue;
      seen.add(key);
      sections.push({
        key,
        fileAssetId: chunk.fileAssetId || "",
        markdown: `## 来源：${chunk.title || "项目资料"}（chunk ${chunk.chunkIndex + 1}）\n\n${chunk.content}`,
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
