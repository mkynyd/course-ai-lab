import PDFDocument from "pdfkit";
import type { Content, Root } from "mdast";
import { readFileSync } from "fs";
import path from "path";
import { markdownNodeText, parseMarkdown } from "@/lib/export/markdown-ast";

const FONT_PATH = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "public",
  "fonts",
  "noto-sans-sc",
  "noto-sans-sc-400.woff2"
);
let fontBuffer: Buffer | null = null;

export function getPdfFont(): Buffer {
  if (!fontBuffer) {
    fontBuffer = readFileSync(FONT_PATH);
  }
  return fontBuffer;
}

function renderNode(doc: PDFKit.PDFDocument, node: Content) {
  const text = markdownNodeText(node);
  switch (node.type) {
    case "heading":
      doc.fontSize(Math.max(13, 24 - node.depth * 2)).text(text).moveDown(0.4);
      break;
    case "paragraph":
      doc.fontSize(11).text(text, { lineGap: 3 }).moveDown(0.5);
      break;
    case "code":
      doc
        .fontSize(9)
        .fillColor("#333333")
        .text(node.lang === "mermaid" ? `Mermaid 源码\n${node.value}` : node.value, {
          lineGap: 2,
        })
        .fillColor("#000000")
        .moveDown(0.5);
      break;
    case "blockquote":
      doc.fontSize(10).fillColor("#555555").text(`引用：${text}`).fillColor("#000000").moveDown(0.5);
      break;
    case "list":
      node.children.forEach((item, index) => {
        const marker = node.ordered ? `${index + 1}.` : "•";
        doc.fontSize(11).text(`${marker} ${markdownNodeText(item)}`, {
          indent: 12,
          lineGap: 2,
        });
      });
      doc.moveDown(0.5);
      break;
    case "table": {
      const widths = node.children.reduce<number[]>(
        (current, row) =>
          row.children.map((cell, index) =>
            Math.max(current[index] || 0, markdownNodeText(cell).length)
          ),
        []
      );
      node.children.forEach((row) => {
        doc.fontSize(9).text(
          row.children
            .map((cell, index) =>
              markdownNodeText(cell).padEnd(Math.min(widths[index] || 8, 24))
            )
            .join(" | "),
          { lineGap: 2 }
        );
      });
      doc.moveDown(0.5);
      break;
    }
    case "thematicBreak":
      doc.moveTo(doc.x, doc.y).lineTo(540, doc.y).stroke().moveDown(0.5);
      break;
    default:
      if (text) doc.fontSize(11).text(text).moveDown(0.5);
  }
}

function renderRoot(doc: PDFKit.PDFDocument, root: Root) {
  for (const node of root.children) renderNode(doc, node);
}

export async function markdownToPdf(content: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 48, right: 48, bottom: 48, left: 48 },
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.registerFont("NotoSansSC", new Uint8Array(getPdfFont()));
    doc.font("NotoSansSC");
    renderRoot(doc, parseMarkdown(content));
    doc.end();
  });
}
