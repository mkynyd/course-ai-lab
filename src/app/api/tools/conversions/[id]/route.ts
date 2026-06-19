import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const conversion = await prisma.documentConversion.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!conversion) {
    return NextResponse.json({ error: "转换记录不存在" }, { status: 404 });
  }

  return NextResponse.json({ conversion });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await prisma.documentConversion.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "转换记录不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
