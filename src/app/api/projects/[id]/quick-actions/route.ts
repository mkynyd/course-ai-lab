import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createQuickActionSchema = z.object({
  title: z.string().min(1).max(6),
  prompt: z.string().min(1).max(200000),
});

async function assertProject(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  return project;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id: projectId } = await params;
  const project = await assertProject(session.user.id, projectId);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const quickActions = await prisma.quickAction.findMany({
    where: { projectId },
    orderBy: [{ isSystem: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ quickActions });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id: projectId } = await params;
  const project = await assertProject(session.user.id, projectId);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const parsed = createQuickActionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const maxSort = await prisma.quickAction.aggregate({
    where: { projectId },
    _max: { sortOrder: true },
  });
  const quickAction = await prisma.quickAction.create({
    data: {
      projectId,
      title: parsed.data.title,
      prompt: parsed.data.prompt,
      isSystem: false,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json({ quickAction }, { status: 201 });
}
