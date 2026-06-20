import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  readStoredObject,
  type StorageProvider,
} from "@/lib/storage/object-storage";

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; assetId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id, assetId } = await params;
  const asset = await prisma.documentConversionAsset.findFirst({
    where: {
      id: assetId,
      conversionId: id,
      conversion: { userId: session.user.id },
    },
    select: {
      mimeType: true,
      storageProvider: true,
      storagePath: true,
    },
  });
  if (!asset) {
    return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  }

  const data = await readStoredObject({
    provider: asset.storageProvider as StorageProvider,
    key: asset.storagePath,
  });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
