// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  assetFindFirst: vi.fn(),
  readStoredObject: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  prisma: {
    documentConversionAsset: { findFirst: mocks.assetFindFirst },
  },
}));
vi.mock("@/lib/storage/object-storage", () => ({
  readStoredObject: mocks.readStoredObject,
}));

import { GET } from "@/app/api/tools/conversions/[id]/assets/[assetId]/route";

const context = {
  params: Promise.resolve({ id: "conversion-1", assetId: "asset-1" }),
};

describe("GET conversion asset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.assetFindFirst.mockResolvedValue({
      id: "asset-1",
      mimeType: "image/png",
      storageProvider: "local",
      storagePath: "stored/circuit.png",
    });
    mocks.readStoredObject.mockResolvedValue(Buffer.from([1, 2, 3]));
  });

  it("requires authentication", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(401);
  });

  it("does not expose assets outside the current user's conversion", async () => {
    mocks.assetFindFirst.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(404);
    expect(mocks.assetFindFirst).toHaveBeenCalledWith({
      where: {
        id: "asset-1",
        conversionId: "conversion-1",
        conversion: { userId: "user-1" },
      },
      select: {
        mimeType: true,
        storageProvider: true,
        storagePath: true,
      },
    });
  });

  it("returns private image bytes for the owner", async () => {
    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("private, max-age=3600");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(Buffer.from([1, 2, 3]));
  });
});
