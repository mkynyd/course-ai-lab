// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  uploadObjectBuffer: vi.fn(),
  deleteStoredObject: vi.fn(),
}));

vi.mock("@/lib/storage/object-storage", () => ({
  uploadObjectBuffer: mocks.uploadObjectBuffer,
  deleteStoredObject: mocks.deleteStoredObject,
}));

import { storeConversionAssets } from "@/lib/conversions/assets";

describe("storeConversionAssets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uploadObjectBuffer.mockImplementation(
      async ({ key }: { key: string }) => ({ provider: "local", key })
    );
    mocks.deleteStoredObject.mockResolvedValue(undefined);
  });

  it("stores assets below their conversion-owned object prefix", async () => {
    const stored = await storeConversionAssets({
      userId: "user-1",
      conversionId: "conversion-1",
      assets: [
        {
          relativePath: "pics/circuit.png",
          mimeType: "image/png",
          buffer: Buffer.from([1, 2, 3]),
        },
      ],
    });

    expect(stored).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        relativePath: "pics/circuit.png",
        mimeType: "image/png",
        size: 3,
        storageProvider: "local",
        storagePath: expect.stringMatching(
          /^users\/user-1\/conversions\/conversion-1\/assets\/[^/]+\/circuit\.png$/
        ),
      }),
    ]);
  });

  it("removes assets uploaded before a later upload fails", async () => {
    mocks.uploadObjectBuffer
      .mockResolvedValueOnce({ provider: "local", key: "stored/first.png" })
      .mockRejectedValueOnce(new Error("upload failed"));

    await expect(
      storeConversionAssets({
        userId: "user-1",
        conversionId: "conversion-1",
        assets: [
          {
            relativePath: "pics/first.png",
            mimeType: "image/png",
            buffer: Buffer.from([1]),
          },
          {
            relativePath: "pics/second.png",
            mimeType: "image/png",
            buffer: Buffer.from([2]),
          },
        ],
      })
    ).rejects.toThrow("upload failed");

    expect(mocks.deleteStoredObject).toHaveBeenCalledWith({
      provider: "local",
      key: "stored/first.png",
    });
  });
});
