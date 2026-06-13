import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeExportFilename } from "@/lib/export/filename";
import { markdownToDocx } from "@/lib/export/markdown-to-docx";
import { markdownToPdf } from "@/lib/export/markdown-to-pdf";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  const artifact = await prisma.artifact.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!artifact) {
    return NextResponse.json({ error: "成果不存在" }, { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format") || "markdown";
  if (!["markdown", "docx", "pdf"].includes(format)) {
    return NextResponse.json({ error: "不支持的导出格式" }, { status: 400 });
  }

  const extension = format === "markdown" ? "md" : format;
  const filename = safeExportFilename(artifact.title, extension);
  const disposition = `attachment; filename="artifact.${extension}"; filename*=UTF-8''${encodeURIComponent(filename)}`;

  if (format === "markdown") {
    return new Response(artifact.content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": disposition,
      },
    });
  }

  const body =
    format === "docx"
      ? await markdownToDocx(artifact.content)
      : await markdownToPdf(artifact.content);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type":
        format === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/pdf",
      "Content-Disposition": disposition,
    },
  });
}
