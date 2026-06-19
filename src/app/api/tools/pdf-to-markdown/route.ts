import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProviderApiKey } from "@/lib/data/provider-access";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { parseFileWithMinerU } from "@/lib/parse/mineru";

const MAX_PDF_SIZE = 200 * 1024 * 1024;
const NEED_TOKEN_MESSAGE =
  "您的账户未开通文档解析服务，请在下方输入 MinerU Token";

function isUploadFile(value: unknown): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "name" in value &&
      typeof (value as { name?: unknown }).name === "string" &&
      "size" in value &&
      typeof (value as { size?: unknown }).size === "number" &&
      "arrayBuffer" in value &&
      typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function"
  );
}

function isPdf(file: File) {
  return (
    file.name.toLowerCase().endsWith(".pdf") &&
    (!file.type || file.type === "application/pdf")
  );
}

function conversionTitle(filename: string) {
  return filename.replace(/\.pdf$/i, "").trim() || "PDF 文档";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "无效的上传请求" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!isUploadFile(file) || !isPdf(file)) {
    return NextResponse.json(
      { error: "请选择有效的 PDF 文件" },
      { status: 400 }
    );
  }
  if (file.size > MAX_PDF_SIZE) {
    return NextResponse.json(
      { error: "文件大小超过 200MB 限制，请压缩或拆分后重试" },
      { status: 413 }
    );
  }

  const oneTimeToken = String(formData.get("mineruToken") || "").trim();
  let token: string;
  try {
    token = await getProviderApiKey(session.user.id, "mineru");
  } catch {
    if (!oneTimeToken) {
      return NextResponse.json(
        { error: NEED_TOKEN_MESSAGE, needToken: true },
        { status: 403 }
      );
    }
    token = oneTimeToken;
  }

  const userId = session.user.id;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      void (async () => {
        let pageCount: number | null = null;
        try {
          const parsed = await parseFileWithMinerU({
            token,
            fileBuffer,
            filename: file.name,
            onProgress(stage, progress) {
              const normalizedStage =
                stage === "running" || stage === "converting"
                  ? "model"
                  : stage;
              if (normalizedStage === "model" && progress) {
                pageCount = progress.total > 0 ? progress.total : pageCount;
                send({
                  stage: "model",
                  extractedPages: progress.current,
                  totalPages: progress.total,
                });
              } else if (
                normalizedStage === "uploading" ||
                normalizedStage === "pending"
              ) {
                send({ stage: normalizedStage });
              }
            },
          });

          const conversion = await prisma.documentConversion.create({
            data: {
              userId,
              title: conversionTitle(file.name),
              originalName: file.name,
              markdownContent: parsed.content,
              status: "completed",
              fileSize: file.size,
              pageCount,
              metadata: parsed.metadata,
            },
            select: { id: true },
          });

          send({
            stage: "done",
            conversionId: conversion.id,
            content: parsed.content,
            fileName: file.name.replace(/\.pdf$/i, ".md"),
            metadata: { ...parsed.metadata, pageCount },
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "转换失败，请稍后重试";
          logger.error("PDF 转 Markdown 失败", {
            userId,
            filename: file.name,
            error: String(error),
          });
          send({ stage: "failed", error: message });
        } finally {
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
