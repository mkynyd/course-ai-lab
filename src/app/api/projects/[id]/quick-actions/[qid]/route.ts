import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateQuickActionSchema = z.object({
  title: z.string().min(1).max(6).optional(),
  prompt: z.string().min(1).max(200000).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

async function findQuickAction(userId: string, projectId: string, id: string) {
  return prisma.quickAction.findFirst({
    where: {
      id,
      projectId,
      project: { userId },
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id: projectId, qid } = await params;
  const quickAction = await findQuickAction(session.user.id, projectId, qid);
  if (!quickAction) {
    return NextResponse.json({ error: "快捷操作不存在" }, { status: 404 });
  }

  const parsed = updateQuickActionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await prisma.quickAction.update({
    where: { id: quickAction.id },
    data: parsed.data,
  });

  return NextResponse.json({ quickAction: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id: projectId, qid } = await params;
  const quickAction = await findQuickAction(session.user.id, projectId, qid);
  if (!quickAction) {
    return NextResponse.json({ error: "快捷操作不存在" }, { status: 404 });
  }
  if (quickAction.isSystem) {
    return NextResponse.json(
      { error: "系统预设不可删除" },
      { status: 400 }
    );
  }

  await prisma.quickAction.delete({ where: { id: quickAction.id } });
  return NextResponse.json({ success: true });
}
