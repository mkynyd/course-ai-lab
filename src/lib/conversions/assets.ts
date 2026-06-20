import crypto from "crypto";
import path from "path";
import type { ParsedImageAsset } from "@/lib/parse/mineru-result";
import {
  deleteStoredObject,
  uploadObjectBuffer,
  type StorageProvider,
  type StoredObjectRef,
} from "@/lib/storage/object-storage";

export interface StoredConversionAsset {
  id: string;
  relativePath: string;
  mimeType: string;
  size: number;
  storageProvider: StorageProvider;
  storagePath: string;
}

export async function deleteStoredObjects(objects: StoredObjectRef[]) {
  await Promise.all(objects.map((object) => deleteStoredObject(object)));
}

export async function storeConversionAssets(input: {
  userId: string;
  conversionId: string;
  assets: ParsedImageAsset[];
}): Promise<StoredConversionAsset[]> {
  const uploaded: StoredObjectRef[] = [];
  const stored: StoredConversionAsset[] = [];

  try {
    for (const asset of input.assets) {
      const id = crypto.randomUUID();
      const filename = path.posix.basename(asset.relativePath);
      const object = await uploadObjectBuffer({
        key: [
          "users",
          input.userId,
          "conversions",
          input.conversionId,
          "assets",
          id,
          filename,
        ].join("/"),
        mimeType: asset.mimeType,
        buffer: asset.buffer,
      });
      uploaded.push(object);
      stored.push({
        id,
        relativePath: asset.relativePath,
        mimeType: asset.mimeType,
        size: asset.buffer.length,
        storageProvider: object.provider,
        storagePath: object.key,
      });
    }
    return stored;
  } catch (error) {
    await Promise.all(
      uploaded.map((object) => deleteStoredObject(object).catch(() => {}))
    );
    throw error;
  }
}
