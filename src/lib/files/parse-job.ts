import { execFile } from "child_process";
import crypto from "crypto";
import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getProviderApiKey } from "@/lib/data/provider-access";
import { createDocumentChunks } from "@/lib/rag/vector-store";
import { refreshProjectIndex } from "@/lib/rag/project-index";
import { parsePdf } from "@/lib/files/pdf-parser";
import { parseDocumentWithMiniMax, parseImageWithMiniMax } from "@/lib/vision/minimax";
import { categorizeFiles } from "@/lib/files/categorize";

const execFileAsync = promisify(execFile);
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const PARSING_STAGES = {
  converting: "转换格式中",
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

const OFFICE_EXTENSIONS = new Set([
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
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
  return path.extname(filename).toLowerCase().slice(1);
}

function resolveUploadPath(storagePath: string) {
  const resolvedPath = path.resolve(UPLOAD_DIR, storagePath);
  if (!resolvedPath.startsWith(`${path.resolve(UPLOAD_DIR)}${path.sep}`)) {
    throw new Error("文件路径无效");
  }
  return resolvedPath;
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

async function convertToPdf(inputPath: string) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "course-ai-lab-office-"));
  try {
    await execFileAsync("soffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      tempDir,
      inputPath,
    ], { timeout: 120_000 });

    const pdfPath = path.join(
      tempDir,
      `${path.basename(inputPath, path.extname(inputPath))}.pdf`
    );
    const data = await readFile(pdfPath);
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Office 转 PDF 失败";
    throw new Error(`Office/iWork/WPS 转 PDF 失败，请确认服务端已安装 LibreOffice：${message}`);
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function parseFileContent(options: {
  userId: string;
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    storagePath: string;
    processingMetadata: unknown;
  };
}) {
  const resolvedPath = resolveUploadPath(options.file.storagePath);
  const ext = extensionOf(options.file.originalName || options.file.storagePath);
  const data = await readFile(resolvedPath);

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

  const minimaxKey = await getMiniMaxKey(options.userId);
  if (!minimaxKey) {
    throw new Error("尚未配置 MiniMax API Key，请先在设置中添加");
  }

  if (ext === "pdf" || options.file.mimeType === "application/pdf") {
    await updateStage(options.file, "model", {
      parser: "minimax-pdf-native",
    });
    return parsePdf({
      data,
      filename: options.file.originalName,
      minimaxApiKey: minimaxKey,
    });
  }

  if (OFFICE_EXTENSIONS.has(ext)) {
    await updateStage(options.file, "converting", {
      parser: "libreoffice-to-pdf",
    });
    const pdf = await convertToPdf(resolvedPath);
    await updateStage(options.file, "model", {
      parser: "minimax-office-vision",
    });
    const content = await parseDocumentWithMiniMax({
      apiKey: minimaxKey,
      data: pdf,
      filename: `${options.file.originalName}.pdf`,
      mediaType: "application/pdf",
    });
    return {
      content: `# ${options.file.originalName}\n\n${content}`,
      status: "parsed" as const,
      metadata: {
        parser: "minimax-office-vision",
        convertedToPdf: true,
        parsedAt: new Date().toISOString(),
      },
    };
  }

  if (IMAGE_MEDIA_TYPES.has(options.file.mimeType)) {
    await updateStage(options.file, "model", {
      parser: "minimax-image",
    });
    const content = await parseImageWithMiniMax({
      apiKey: minimaxKey,
      data,
      mediaType: options.file.mimeType as "image/png" | "image/jpeg" | "image/webp",
    });
    return {
      content,
      status: "parsed" as const,
      metadata: {
        parser: "minimax-image",
        parsedAt: new Date().toISOString(),
      },
    };
  }

  throw new Error(`不支持的文件类型: .${ext || options.file.mimeType}`);
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

  await updateStage(file, "converting", {
    parseStartedAt: new Date().toISOString(),
    parseRunId: crypto.randomUUID(),
  });

  try {
    const result = await parseFileContent({
      userId: input.userId,
      file,
    });
    await updateStage(file, "writing", result.metadata);

    await prisma.fileAsset.update({
      where: { id: file.id },
      data: {
        textContent: result.content,
        status: result.status,
        enhancementStatus: file.enhancedContent ? "stale" : "none",
        processingMetadata: mergeMetadata(file.processingMetadata, {
          ...result.metadata,
          parsingStage: "complete",
          parsingStageLabel: PARSING_STAGES.complete,
        }),
      },
    });

    try {
      await createDocumentChunks({
        fileAssetId: file.id,
        projectId: file.projectId,
        userId: input.userId,
        textContent: result.content,
        title: file.originalName,
      });
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
  const parsedByProject = new Map<string, string[]>();
  for (const fileId of [...new Set(input.fileIds)]) {
    try {
      const result = await parseFileAsset({ userId: input.userId, fileId });
      if (result.projectId && ["parsed", "partial"].includes(result.status)) {
        parsedByProject.set(result.projectId, [
          ...(parsedByProject.get(result.projectId) || []),
          result.fileId,
        ]);
      }
    } catch (error) {
      console.error(
        "File parse job failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  for (const [projectId, fileIds] of parsedByProject) {
    await categorizeFiles({
      userId: input.userId,
      projectId,
      fileIds,
    }).catch((error) => {
      console.error(
        "File categorization failed:",
        error instanceof Error ? error.message : error
      );
    });
  }
}

export function startFileParseBatch(input: {
  userId: string;
  fileIds: string[];
}) {
  void parseFileBatch(input);
}
