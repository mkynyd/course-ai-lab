import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  deleteStoredObject,
  uploadFileBuffer,
} from "@/lib/storage/object-storage";

const saveSchema = z.object({
  projectId: z.string().trim().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "请选择目标项目" }, { status: 400 });
  }

  const userId = session.user.id;
  const { id } = await params;
  const [conversion, project] = await Promise.all([
    prisma.documentConversion.findFirst({ where: { id, userId } }),
    prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId },
      select: { id: true },
    }),
  ]);
  if (!conversion) {
    return NextResponse.json({ error: "转换记录不存在" }, { status: 404 });
  }
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const fileId = crypto.randomUUID();
  const originalName = conversion.originalName.replace(/\.pdf$/i, ".md");
  const buffer = Buffer.from(conversion.markdownContent, "utf8");

  try {
    const stored = await uploadFileBuffer({
      userId,
      projectId: project.id,
      fileId,
      originalName,
      mimeType: "text/markdown",
      buffer,
    });

    try {
      const file = await prisma.fileAsset.create({
        data: {
          id: fileId,
          userId,
          projectId: project.id,
          filename: stored.filename,
          originalName,
          mimeType: "text/markdown",
          size: buffer.byteLength,
          storageProvider: stored.provider,
          storagePath: stored.key,
          textContent: conversion.markdownContent,
          status: "parsed",
          processingMetadata: {
            source: "document-conversion",
            conversionId: conversion.id,
          },
        },
      });

      return NextResponse.json({ fileId: file.id, projectId: project.id });
    } catch (error) {
      await deleteStoredObject({
        provider: stored.provider,
        key: stored.key,
      });
      throw error;
    }
  } catch (error) {
    logger.error("保存转换结果到项目失败", {
      conversionId: conversion.id,
      projectId: project.id,
      error: String(error),
    });
    return NextResponse.json(
      { error: "保存到项目失败，请稍后重试" },
      { status: 500 }
    );
  }
}
