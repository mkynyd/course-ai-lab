import crypto from "crypto";
import path from "path";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getProviderApiKey } from "@/lib/data/provider-access";
import { createDocumentChunks } from "@/lib/rag/vector-store";
import {
  generateFileIndexMetadata,
  refreshProjectIndex,
} from "@/lib/rag/project-index";
import { logger } from "@/lib/logger";
import {
  parseImageWithMiniMax,
  parseDocumentWithMiniMax,
} from "@/lib/vision/minimax";
import { embedChunksForFile } from "@/lib/rag/embedding";
import {
  readStoredObject,
  uploadObjectBuffer,
  deleteStoredObject,
  type StorageProvider,
} from "@/lib/storage/object-storage";
import { parseFileWithMinerU } from "@/lib/parse/mineru";
import type { ParsedImageAsset } from "@/lib/parse/mineru-result";

export const PARSING_STAGES = {
  uploading: "上传文件中",
  converting: "转换格式中",
  pending: "排队等待中",
  model: "模型解析中",
  writing: "写入中",
  complete: "完成",
} as const;

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "csv",
  "json",
  "ts",
  "tsx",
  "js",
  "jsx",
  "py",
  "c",
  "cpp",
  "h",
  "java",
  "sql",
  "html",
  "css",
]);

const PDF_EXTENSIONS = new Set(["pdf"]);

const OFFICE_EXTENSIONS = new Set([
  "ppt",
  "pptx",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "wps",
  "et",
  "dps",
  "pages",
  "numbers",
  "key",
]);

const IMAGE_MEDIA_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function mergeMetadata(current: unknown, next: Record<string, unknown>): Prisma.InputJsonObject {
  return {
    ...(current && typeof current === "object"
      ? (current as Prisma.InputJsonObject)
      : {}),
    ...(next as Prisma.InputJsonObject),
  } as Prisma.InputJsonObject;
}

function extensionOf(filename: string) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index + 1).toLowerCase() : "";
}

async function updateStage(
  file: { id: string; processingMetadata: unknown },
  stage: keyof typeof PARSING_STAGES,
  extra: Record<string, unknown> = {}
) {
  await prisma.fileAsset.update({
    where: { id: file.id },
    data: {
      status: stage === "complete" ? "parsed" : "parsing",
      processingMetadata: mergeMetadata(file.processingMetadata, {
        parsingStage: stage,
        parsingStageLabel: PARSING_STAGES[stage],
        ...extra,
      }),
    },
  });
}

async function getMiniMaxKey(userId: string) {
  try {
    return await getProviderApiKey(userId, "minimax");
  } catch {
    return undefined;
  }
}

async function getBailianKey(userId: string) {
  try {
    return await getProviderApiKey(userId, "bailian");
  } catch {
    return undefined;
  }
}

async function getMinerUToken(userId: string) {
  try {
    return await getProviderApiKey(userId, "mineru");
  } catch {
    return undefined;
  }
}

interface StoredFileAsset {
  id: string;
  relativePath: string;
  mimeType: string;
  size: number;
  storageProvider: StorageProvider;
  storagePath: string;
  resourceUrl: string;
}

async function storeFileAssets(input: {
  userId: string;
  fileAssetId: string;
  assets: ParsedImageAsset[];
}): Promise<StoredFileAsset[]> {
  const stored: StoredFileAsset[] = [];
  for (const asset of input.assets) {
    const id = crypto.randomUUID();
    const filename = path.posix.basename(asset.relativePath);
    const object = await uploadObjectBuffer({
      key: [
        "users",
        input.userId,
        "file-assets",
        input.fileAssetId,
        "resources",
        id,
        filename,
      ].join("/"),
      mimeType: asset.mimeType,
      buffer: asset.buffer,
    });
    stored.push({
      id,
      relativePath: asset.relativePath,
      mimeType: asset.mimeType,
      size: asset.buffer.length,
      storageProvider: object.provider,
      storagePath: object.key,
      resourceUrl: `/api/files/${input.fileAssetId}/resources/${id}`,
    });
  }
  return stored;
}

const MD_IMAGE_REGEX = /(!\[[^\]]*]\(\s*)(<?)([^)\s>]+)(>?)([^)]*\))/g;
const HTML_IMAGE_REGEX = /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi;

function rewriteAssetReferences(
  content: string,
  assetMap: StoredFileAsset[]
): string {
  const lookup = new Map(assetMap.map((a) => [a.relativePath, a.resourceUrl]));
  return content
    .replace(MD_IMAGE_REGEX, (match, prefix, open, reference, close, suffix) => {
      const url = lookup.get(reference);
      return url ? `${prefix}${open}${url}${close}${suffix}` : match;
    })
    .replace(HTML_IMAGE_REGEX, (match, prefix, reference, suffix) => {
      const url = lookup.get(reference);
      return url ? `${prefix}${url}${suffix}` : match;
    });
}

async function parseOfficeWithMinerU(options: {
  userId: string;
  file: {
    id: string;
    originalName: string;
    processingMetadata: unknown;
  };
  data: Buffer;
}) {
  const token = await getMinerUToken(options.userId);
  if (!token) {
    throw new Error("尚未配置 MinerU Token，Office 文件无法解析");
  }

  const parsed = await parseFileWithMinerU({
    token,
    fileBuffer: options.data,
    filename: options.file.originalName,
    onProgress(stage, progress) {
      const normalizedStage =
        stage === "running" || stage === "converting" ? "model" : stage;
      if (normalizedStage === "model" && progress) {
        void updateStage(options.file, "model", {
          parser: "mineru-office",
          extractedPages: progress.current,
          totalPages: progress.total,
        });
      }
    },
  });

  // 清理旧资源（重新解析时）
  const oldResources = await prisma.fileAssetResource.findMany({
    where: { fileAssetId: options.file.id },
    select: { id: true, storageProvider: true, storagePath: true },
  });
  if (oldResources.length > 0) {
    await Promise.all(
      oldResources.map((r) =>
        deleteStoredObject({
          provider: r.storageProvider as StorageProvider,
          key: r.storagePath,
        }).catch(() => {})
      )
    );
    await prisma.fileAssetResource.deleteMany({
      where: { fileAssetId: options.file.id },
    });
  }

  const storedAssets = await storeFileAssets({
    userId: options.userId,
    fileAssetId: options.file.id,
    assets: parsed.assets,
  });

  await prisma.fileAssetResource.createMany({
    data: storedAssets.map((asset) => ({
      id: asset.id,
      fileAssetId: options.file.id,
      relativePath: asset.relativePath,
      mimeType: asset.mimeType,
      size: asset.size,
      storageProvider: asset.storageProvider,
      storagePath: asset.storagePath,
    })),
  });

  const content = rewriteAssetReferences(parsed.content, storedAssets);

  return {
    content,
    status: "parsed" as const,
    metadata: {
      ...parsed.metadata,
      parsedAt: new Date().toISOString(),
      assetCount: storedAssets.length,
    },
  };
}

type MiniMaxImageMedia = "image/png" | "image/jpeg" | "image/webp";

function imageMediaType(mimeType: string): MiniMaxImageMedia | null {
  if ((IMAGE_MEDIA_TYPES as Set<string>).has(mimeType)) {
    return mimeType as MiniMaxImageMedia;
  }
  return null;
}

async function parseFileContent(options: {
  userId: string;
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    storageProvider: string;
    storagePath: string;
    processingMetadata: unknown;
  };
}) {
  const ext = extensionOf(options.file.originalName || options.file.storagePath);
  const data = await readStoredObject({
    provider: options.file.storageProvider as StorageProvider,
    key: options.file.storagePath,
  });

  if (TEXT_EXTENSIONS.has(ext)) {
    return {
      content: data.toString("utf-8"),
      status: "parsed" as const,
      metadata: {
        parser: "text-local",
        parsedAt: new Date().toISOString(),
      },
    };
  }

  if (OFFICE_EXTENSIONS.has(ext)) {
    return parseOfficeWithMinerU({
      userId: options.userId,
      file: {
        id: options.file.id,
        originalName: options.file.originalName,
        processingMetadata: options.file.processingMetadata,
      },
      data,
    });
  }

  if (!PDF_EXTENSIONS.has(ext) && options.file.mimeType !== "application/pdf") {
    const imageType = imageMediaType(options.file.mimeType);
    if (!imageType) {
      throw new Error(`不支持的文件类型: .${ext || options.file.mimeType}`);
    }

    const apiKey = await getMiniMaxKey(options.userId);
    if (!apiKey) {
      throw new Error("尚未配置 MiniMax API Key，请先在设置中添加");
    }

    await updateStage(options.file, "model", { parser: "minimax-m3-image" });
    const content = await parseImageWithMiniMax({
      apiKey,
      data,
      mediaType: imageType,
    });
    return {
      content,
      status: "parsed" as const,
      metadata: {
        parser: "minimax-m3-image",
        parsedAt: new Date().toISOString(),
        requiresVisionModel: true,
      },
    };
  }

  const apiKey = await getMiniMaxKey(options.userId);
  if (!apiKey) {
    throw new Error("尚未配置 MiniMax API Key，请先在设置中添加");
  }

  await updateStage(options.file, "model", { parser: "minimax-m3-pdf" });
  const content = await parseDocumentWithMiniMax({
    apiKey,
    data,
    filename: options.file.originalName,
    mediaType: "application/pdf",
  });
  return {
    content,
    status: "parsed" as const,
    metadata: {
      parser: "minimax-m3-pdf",
      parsedAt: new Date().toISOString(),
      requiresVisionModel: true,
    },
  };
}

export async function parseFileAsset(input: {
  userId: string;
  fileId: string;
}) {
  const file = await prisma.fileAsset.findFirst({
    where: { id: input.fileId, userId: input.userId },
  });
  if (!file) {
    throw new Error("文件不存在");
  }

  await updateStage(file, "uploading", {
    parseStartedAt: new Date().toISOString(),
    parseRunId: crypto.randomUUID(),
  });

  try {
    const result = await parseFileContent({
      userId: input.userId,
      file,
    });
    const indexMetadata = await generateFileIndexMetadata({
      userId: input.userId,
      filename: file.originalName,
      content: result.content,
    });
    const completedMetadata = {
      ...result.metadata,
      ...indexMetadata,
      parsingStage: "complete",
      parsingStageLabel: PARSING_STAGES.complete,
    };

    await updateStage(file, "writing", completedMetadata);

    await prisma.fileAsset.update({
      where: { id: file.id },
      data: {
        textContent: result.content,
        status: result.status,
        enhancementStatus: file.enhancedContent ? "stale" : "none",
        processingMetadata: mergeMetadata(file.processingMetadata, completedMetadata),
      },
    });

    let chunksCreated = false;
    try {
      await createDocumentChunks({
        fileAssetId: file.id,
        projectId: file.projectId,
        userId: input.userId,
        textContent: result.content,
        title: file.originalName,
      });
      chunksCreated = true;
    } catch {
      await prisma.fileAsset.update({
        where: { id: file.id },
        data: {
          processingMetadata: mergeMetadata(file.processingMetadata, {
            ...result.metadata,
            chunkWarning: "解析内容已保存，但检索分块创建失败",
          }),
        },
      });
    }

    if (chunksCreated) {
      const bailianKey = await getBailianKey(input.userId);
      if (bailianKey) {
        await embedChunksForFile({
          fileAssetId: file.id,
          apiKey: bailianKey,
        }).catch((error) => {
          logger.error("嵌入向量生成失败", {
            fileId: file.id,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
    }

    if (file.projectId) {
      await refreshProjectIndex({
        userId: input.userId,
        projectId: file.projectId,
      }).catch(() => {});
    }

    return {
      fileId: file.id,
      projectId: file.projectId,
      status: result.status,
      metadata: result.metadata,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "文件解析失败，请稍后重试";
    await prisma.fileAsset.update({
      where: { id: file.id },
      data: {
        status: "failed",
        processingMetadata: mergeMetadata(file.processingMetadata, {
          parseError: message.slice(0, 300),
          parsingStage: "failed",
          failedAt: new Date().toISOString(),
        }),
      },
    });
    if (file.projectId) {
      await refreshProjectIndex({
        userId: input.userId,
        projectId: file.projectId,
      }).catch(() => {});
    }
    throw error;
  }
}

export async function parseFileBatch(input: {
  userId: string;
  fileIds: string[];
}) {
  for (const fileId of [...new Set(input.fileIds)]) {
    try {
      await parseFileAsset({ userId: input.userId, fileId });
    } catch (error) {
      logger.error("文件解析任务失败", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export function startFileParseBatch(input: {
  userId: string;
  fileIds: string[];
}) {
  void parseFileBatch(input);
}
