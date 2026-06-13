import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createDocumentChunks,
  deleteChunksByFileAsset,
} from "@/lib/rag/vector-store";
import { unlink } from "fs/promises";
import path from "path";
import { z } from "zod";

const updateFileContentSchema = z.object({
  textContent: z.string().min(1).max(500000),
});

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;

  const file = await prisma.fileAsset.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!file) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  return NextResponse.json({ file });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  const file = await prisma.fileAsset.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!file) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
  if (!["parsed", "partial"].includes(file.status)) {
    return NextResponse.json(
      { error: "只有已解析文件可以编辑 OCR 原文" },
      { status: 400 }
    );
  }

  const parsed = updateFileContentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await prisma.fileAsset.update({
    where: { id: file.id },
    data: {
      textContent: parsed.data.textContent,
      enhancementStatus: file.enhancedContent ? "stale" : "none",
      processingMetadata: {
        ...(file.processingMetadata && typeof file.processingMetadata === "object"
          ? file.processingMetadata
          : {}),
        correctedAt: new Date().toISOString(),
      },
    },
  });
  await createDocumentChunks({
    fileAssetId: file.id,
    projectId: file.projectId,
    userId: session.user.id,
    textContent: parsed.data.textContent,
    title: file.originalName,
  });

  return NextResponse.json({
    success: true,
    enhancementStatus: file.enhancedContent ? "stale" : "none",
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;

  const file = await prisma.fileAsset.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!file) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  // Delete related chunks
  await deleteChunksByFileAsset(file.id, session.user.id);

  // Delete physical file
  try {
    const filePath = path.join(UPLOAD_DIR, file.storagePath);
    await unlink(filePath);
  } catch {
    // File might not exist on disk, that's ok
  }

  await prisma.fileAsset.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
