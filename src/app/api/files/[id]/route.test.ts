// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  fileFindFirst: vi.fn(),
  fileDelete: vi.fn(),
  deleteStoredObject: vi.fn(),
  deleteChunksByFileAsset: vi.fn(),
  refreshProjectIndex: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  prisma: {
    fileAsset: {
      findFirst: mocks.fileFindFirst,
      delete: mocks.fileDelete,
    },
  },
}));
vi.mock("@/lib/storage/object-storage", () => ({
  deleteStoredObject: mocks.deleteStoredObject,
}));
vi.mock("@/lib/rag/vector-store", () => ({
  createDocumentChunks: vi.fn(),
  deleteChunksByFileAsset: mocks.deleteChunksByFileAsset,
}));
vi.mock("@/lib/rag/project-index", () => ({
  refreshProjectIndex: mocks.refreshProjectIndex,
}));

import { DELETE, GET } from "@/app/api/files/[id]/route";

const context = { params: Promise.resolve({ id: "file-1" }) };

describe("project file route resources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.fileFindFirst.mockResolvedValue({
      id: "file-1",
      userId: "user-1",
      projectId: "project-1",
      originalName: "lecture.md",
      textContent: "![电路](pics/circuit.png)",
      storageProvider: "local",
      storagePath: "files/lecture.md",
      resources: [
        {
          id: "resource-1",
          relativePath: "pics/circuit.png",
          storageProvider: "local",
          storagePath: "resources/circuit.png",
        },
      ],
    });
    mocks.deleteStoredObject.mockResolvedValue(undefined);
    mocks.deleteChunksByFileAsset.mockResolvedValue(undefined);
    mocks.refreshProjectIndex.mockResolvedValue(undefined);
    mocks.fileDelete.mockResolvedValue({ id: "file-1" });
  });

  it("returns public resource IDs and paths without object storage keys", async () => {
    const response = await GET(new Request("http://localhost"), context);
    const body = await response.json();

    expect(body.file.resources).toEqual([
      { id: "resource-1", relativePath: "pics/circuit.png" },
    ]);
    expect(JSON.stringify(body)).not.toContain("resources/circuit.png");
  });

  it("deletes project image resources with the main file object", async () => {
    const response = await DELETE(new Request("http://localhost"), context);

    expect(response.status).toBe(200);
    expect(mocks.deleteStoredObject).toHaveBeenCalledWith({
      provider: "local",
      key: "files/lecture.md",
    });
    expect(mocks.deleteStoredObject).toHaveBeenCalledWith({
      provider: "local",
      key: "resources/circuit.png",
    });
  });
});
