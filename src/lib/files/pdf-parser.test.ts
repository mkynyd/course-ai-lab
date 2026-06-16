// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parsePdf } from "@/lib/files/pdf-parser";

const mocks = vi.hoisted(() => ({
  parseDocumentWithMiniMax: vi.fn(),
}));

vi.mock("@/lib/vision/minimax", () => ({
  parseDocumentWithMiniMax: mocks.parseDocumentWithMiniMax,
}));

describe("parsePdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires MiniMax M3 native parsing for every PDF", async () => {
    await expect(
      parsePdf({ data: Buffer.from("%PDF-1.7"), filename: "course.pdf" })
    ).rejects.toThrow("MiniMax M3 原生解析");
  });

  it("passes PDF bytes directly to MiniMax without rendering pages to images", async () => {
    mocks.parseDocumentWithMiniMax.mockResolvedValue("# Parsed PDF");

    const result = await parsePdf({
      data: Buffer.from("%PDF-1.7"),
      filename: "course.pdf",
      minimaxApiKey: "minimax-key",
    });

    expect(mocks.parseDocumentWithMiniMax).toHaveBeenCalledWith({
      apiKey: "minimax-key",
      data: Buffer.from("%PDF-1.7"),
      filename: "course.pdf",
      mediaType: "application/pdf",
    });
    expect(result.metadata.parser).toBe("minimax-pdf-native");
    expect(result.content).toContain("# Parsed PDF");
  });
});
