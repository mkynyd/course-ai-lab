// @vitest-environment node
import { describe, expect, it } from "vitest";
import PDFDocument from "pdfkit";
import { parsePdf } from "@/lib/files/pdf-parser";

function createPdf(text?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    if (text) doc.fontSize(10).text(text);
    doc.end();
  });
}

describe("parsePdf", () => {
  it("extracts a text PDF without requiring MiniMax", async () => {
    const data = await createPdf(
      Array.from({ length: 80 }, (_, index) => `Operating systems concept ${index}.`).join(" ")
    );
    const result = await parsePdf({ data, filename: "course.pdf" });

    expect(result.status).toBe("parsed");
    expect(result.metadata.parser).toBe("pdf-text");
    expect(result.content).toContain("Operating systems concept");
  });

  it("requests MiniMax configuration for an image-like PDF", async () => {
    const data = await createPdf();
    await expect(parsePdf({ data, filename: "scan.pdf" })).rejects.toThrow(
      "需要 MiniMax 视觉解析"
    );
  });
});
