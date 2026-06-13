import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fileFindMany: vi.fn(),
  chunkFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    fileAsset: { findMany: mocks.fileFindMany },
    documentChunk: { findMany: mocks.chunkFindMany },
  },
}));

import { retrieveProjectContext } from "@/lib/rag/vector-store";

describe("retrieveProjectContext", () => {
  beforeEach(() => vi.clearAllMocks());

  it("prefers enhanced content from selected files and identifies its source", async () => {
    mocks.fileFindMany.mockResolvedValue([
      {
        id: "file-1",
        originalName: "课件.png",
        mimeType: "image/png",
        status: "parsed",
        textContent: "OCR 原文",
        enhancedContent: "增强后的资料",
        enhancementStatus: "enhanced",
        processingMetadata: { parser: "minimax-image" },
      },
    ]);
    mocks.chunkFindMany.mockResolvedValue([]);

    const result = await retrieveProjectContext({
      userId: "user-1",
      projectId: "project-1",
      selectedFileIds: ["file-1"],
      query: "资料内容",
      maxChars: 1000,
    });

    expect(result.context).toContain("增强后的资料");
    expect(result.context).toContain("基于 OCR 原文整理的增强资料");
    expect(result.usedFileIds).toEqual(["file-1"]);
  });

  it("returns a Chinese notice when no project material matches", async () => {
    mocks.fileFindMany.mockResolvedValue([]);
    mocks.chunkFindMany.mockResolvedValue([]);

    const result = await retrieveProjectContext({
      userId: "user-1",
      projectId: "project-1",
      selectedFileIds: [],
      query: "不存在的内容",
      maxChars: 1000,
    });

    expect(result.context).toBe("");
    expect(result.notice).toBe("未找到可用于回答的项目资料。");
  });
});
