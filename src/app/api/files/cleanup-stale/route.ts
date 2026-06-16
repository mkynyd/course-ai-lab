import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
  const result = await prisma.fileAsset.updateMany({
    where: {
      userId: session.user.id,
      status: "parsing",
      updatedAt: { lt: staleBefore },
    },
    data: {
      status: "failed",
      processingMetadata: {
        parseError: "解析超过 10 分钟未完成，已自动标记失败",
        parsingStage: "failed",
        failedAt: new Date().toISOString(),
      },
    },
  });

  return NextResponse.json({ cleaned: result.count });
}
