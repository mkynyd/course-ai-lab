import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  type: z.string().min(1).max(80).optional(),
  content: z.string().min(1).max(500000).optional(),
});

async function ownedArtifact(id: string, userId: string) {
  return prisma.artifact.findFirst({ where: { id, userId } });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  const artifact = await ownedArtifact(id, session.user.id);
  if (!artifact) {
    return NextResponse.json({ error: "成果不存在" }, { status: 404 });
  }
  return NextResponse.json({ artifact });
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
  if (!(await ownedArtifact(id, session.user.id))) {
    return NextResponse.json({ error: "成果不存在" }, { status: 404 });
  }
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const artifact = await prisma.artifact.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ artifact });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  if (!(await ownedArtifact(id, session.user.id))) {
    return NextResponse.json({ error: "成果不存在" }, { status: 404 });
  }
  await prisma.artifact.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
