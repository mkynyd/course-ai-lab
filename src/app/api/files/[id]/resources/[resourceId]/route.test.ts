// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  resourceFindFirst: vi.fn(),
  readStoredObject: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  prisma: { fileAssetResource: { findFirst: mocks.resourceFindFirst } },
}));
vi.mock("@/lib/storage/object-storage", () => ({
  readStoredObject: mocks.readStoredObject,
}));

import { GET } from "@/app/api/files/[id]/resources/[resourceId]/route";

const context = {
  params: Promise.resolve({ id: "file-1", resourceId: "resource-1" }),
};

describe("GET project file resource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.resourceFindFirst.mockResolvedValue({
      mimeType: "image/png",
      storageProvider: "local",
      storagePath: "projects/circuit.png",
    });
    mocks.readStoredObject.mockResolvedValue(Buffer.from([1, 2, 3]));
  });

  it("enforces ownership through the parent file", async () => {
    mocks.resourceFindFirst.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(404);
    expect(mocks.resourceFindFirst).toHaveBeenCalledWith({
      where: {
        id: "resource-1",
        fileAssetId: "file-1",
        fileAsset: { userId: "user-1" },
      },
      select: {
        mimeType: true,
        storageProvider: true,
        storagePath: true,
      },
    });
  });

  it("returns the project-owned image", async () => {
    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(Buffer.from([1, 2, 3]));
  });
});
