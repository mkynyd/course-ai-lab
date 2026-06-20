import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  conversionFindFirst: vi.fn(),
  projectFindFirst: vi.fn(),
  fileAssetCreate: vi.fn(),
  uploadFileBuffer: vi.fn(),
  uploadObjectBuffer: vi.fn(),
  readStoredObject: vi.fn(),
  deleteStoredObject: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  prisma: {
    documentConversion: { findFirst: mocks.conversionFindFirst },
    project: { findFirst: mocks.projectFindFirst },
    fileAsset: { create: mocks.fileAssetCreate },
  },
}));
vi.mock("@/lib/storage/object-storage", () => ({
  uploadFileBuffer: mocks.uploadFileBuffer,
  uploadObjectBuffer: mocks.uploadObjectBuffer,
  readStoredObject: mocks.readStoredObject,
  deleteStoredObject: mocks.deleteStoredObject,
}));

import { POST } from "@/app/api/tools/conversions/[id]/save-to-project/route";

function request(projectId = "project-1") {
  return new Request("http://localhost/api/tools/conversions/conversion-1/save-to-project", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
}

describe("POST /api/tools/conversions/[id]/save-to-project", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.conversionFindFirst.mockResolvedValue({
      id: "conversion-1",
      userId: "user-1",
      originalName: "lecture.pdf",
      markdownContent: "# Lecture",
      assets: [
        {
          relativePath: "pics/circuit.png",
          mimeType: "image/png",
          size: 3,
          storageProvider: "local",
          storagePath: "conversions/circuit.png",
        },
      ],
    });
    mocks.projectFindFirst.mockResolvedValue({ id: "project-1" });
    mocks.uploadFileBuffer.mockResolvedValue({
      provider: "qiniu",
      key: "users/user-1/projects/project-1/files/file-1/lecture.md",
      filename: "lecture.md",
    });
    mocks.readStoredObject.mockResolvedValue(Buffer.from([1, 2, 3]));
    mocks.uploadObjectBuffer.mockImplementation(
      async ({ key }: { key: string }) => ({ provider: "qiniu", key })
    );
    mocks.deleteStoredObject.mockResolvedValue(undefined);
    mocks.fileAssetCreate.mockResolvedValue({ id: "file-1" });
  });

  it("rejects projects outside the current user's scope", async () => {
    mocks.projectFindFirst.mockResolvedValue(null);

    const response = await POST(request("project-2"), {
      params: Promise.resolve({ id: "conversion-1" }),
    });

    expect(response.status).toBe(404);
    expect(mocks.uploadFileBuffer).not.toHaveBeenCalled();
  });

  it("stores the Markdown through the shared object storage adapter", async () => {
    const response = await POST(request(), {
      params: Promise.resolve({ id: "conversion-1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.uploadFileBuffer).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        projectId: "project-1",
        originalName: "lecture.md",
        mimeType: "text/markdown",
        buffer: Buffer.from("# Lecture"),
      })
    );
    expect(mocks.fileAssetCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        projectId: "project-1",
        filename: "lecture.md",
        originalName: "lecture.md",
        mimeType: "text/markdown",
        size: 9,
        storageProvider: "qiniu",
        storagePath: "users/user-1/projects/project-1/files/file-1/lecture.md",
        textContent: "# Lecture",
        status: "parsed",
        resources: {
          create: [
            expect.objectContaining({
              id: expect.any(String),
              relativePath: "pics/circuit.png",
              mimeType: "image/png",
              size: 3,
              storageProvider: "qiniu",
              storagePath: expect.stringMatching(
                /^users\/user-1\/projects\/project-1\/files\/[^/]+\/resources\/[^/]+\/circuit\.png$/
              ),
            }),
          ],
        },
      }),
    });
    expect(mocks.readStoredObject).toHaveBeenCalledWith({
      provider: "local",
      key: "conversions/circuit.png",
    });
    await expect(response.json()).resolves.toEqual({
      fileId: "file-1",
      projectId: "project-1",
    });
  });

  it("removes the stored object when the database write fails", async () => {
    mocks.fileAssetCreate.mockRejectedValue(new Error("database unavailable"));

    const response = await POST(request(), {
      params: Promise.resolve({ id: "conversion-1" }),
    });

    expect(response.status).toBe(500);
    expect(mocks.deleteStoredObject).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "qiniu",
        key: "users/user-1/projects/project-1/files/file-1/lecture.md",
      })
    );
    expect(mocks.deleteStoredObject).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "qiniu",
        key: expect.stringContaining("/resources/"),
      })
    );
  });
});
