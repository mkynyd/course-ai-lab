// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  conversionFindFirst: vi.fn(),
  conversionDelete: vi.fn(),
  deleteStoredObjects: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  prisma: {
    documentConversion: {
      findFirst: mocks.conversionFindFirst,
      delete: mocks.conversionDelete,
    },
  },
}));
vi.mock("@/lib/conversions/assets", () => ({
  deleteStoredObjects: mocks.deleteStoredObjects,
}));

import { DELETE, GET } from "@/app/api/tools/conversions/[id]/route";

const context = { params: Promise.resolve({ id: "conversion-1" }) };

describe("conversion detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.conversionFindFirst.mockResolvedValue({
      id: "conversion-1",
      userId: "user-1",
      title: "lecture",
      markdownContent: "![电路](pics/circuit.png)",
      exportStorageProvider: "local",
      exportStoragePath: "exports/lecture.zip",
      assets: [
        {
          id: "asset-1",
          relativePath: "pics/circuit.png",
          storageProvider: "local",
          storagePath: "assets/circuit.png",
        },
      ],
    });
    mocks.conversionDelete.mockResolvedValue({ id: "conversion-1" });
    mocks.deleteStoredObjects.mockResolvedValue(undefined);
  });

  it("returns only public asset metadata in conversion detail", async () => {
    const response = await GET(new Request("http://localhost"), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.conversion.assets).toEqual([
      { id: "asset-1", relativePath: "pics/circuit.png" },
    ]);
    expect(JSON.stringify(body)).not.toContain("assets/circuit.png");
    expect(JSON.stringify(body)).not.toContain("exports/lecture.zip");
  });

  it("deletes image and cached export objects before the conversion row", async () => {
    const response = await DELETE(new Request("http://localhost"), context);

    expect(response.status).toBe(200);
    expect(mocks.deleteStoredObjects).toHaveBeenCalledWith([
      { provider: "local", key: "assets/circuit.png" },
      { provider: "local", key: "exports/lecture.zip" },
    ]);
    expect(mocks.conversionDelete).toHaveBeenCalledWith({
      where: { id: "conversion-1" },
    });
    expect(mocks.deleteStoredObjects.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.conversionDelete.mock.invocationCallOrder[0]
    );
  });

  it("does not delete the database row when object cleanup fails", async () => {
    mocks.deleteStoredObjects.mockRejectedValue(new Error("storage unavailable"));

    const response = await DELETE(new Request("http://localhost"), context);

    expect(response.status).toBe(500);
    expect(mocks.conversionDelete).not.toHaveBeenCalled();
  });
});
