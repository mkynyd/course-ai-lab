import { createCanvas } from "@napi-rs/canvas";
import { parseImageWithMiniMax } from "@/lib/vision/minimax";

const MAX_PDF_PAGES = 10;

interface PdfTextPage {
  pageNumber: number;
  text: string;
}

export interface PdfParseResult {
  content: string;
  status: "parsed" | "partial";
  metadata: Record<string, unknown>;
}

function validCharacterRatio(text: string): number {
  const compact = text.replace(/\s/g, "");
  if (!compact) return 0;
  const valid = compact.match(/[\p{L}\p{N}\p{P}\p{S}]/gu)?.length || 0;
  return valid / compact.length;
}

function textPagesToMarkdown(filename: string, pages: PdfTextPage[]): string {
  return [
    `# ${filename}`,
    "",
    ...pages.flatMap((page) => [
      `## 第 ${page.pageNumber} 页`,
      "",
      page.text || "[该页未提取到文本]",
      "",
    ]),
  ].join("\n");
}

export async function parsePdf(options: {
  data: Buffer;
  filename: string;
  minimaxApiKey?: string;
}): Promise<PdfParseResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(options.data),
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pageLimit = Math.min(pageCount, MAX_PDF_PAGES);
  const pages: PdfTextPage[] = [];

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ pageNumber, text });
    page.cleanup();
  }

  const extractedText = pages.map((page) => page.text).join("\n");
  const ratio = validCharacterRatio(extractedText);
  const isTextPdf = extractedText.length > 500 && ratio >= 0.7;

  if (isTextPdf) {
    await pdf.destroy();
    return {
      content: textPagesToMarkdown(options.filename, pages),
      status: "parsed",
      metadata: {
        parser: "pdf-text",
        pageCount,
        parsedPages: pageLimit,
        textLength: extractedText.length,
        validCharacterRatio: ratio,
        truncated: pageCount > pageLimit,
        parsedAt: new Date().toISOString(),
      },
    };
  }

  if (!options.minimaxApiKey) {
    await pdf.destroy();
    throw new Error(
      "该 PDF 疑似扫描版，需要 MiniMax 视觉解析。请先在设置中配置 MiniMax API Key。"
    );
  }

  const parsedPages: number[] = [];
  const failedPages: number[] = [];
  const markdownPages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height)
      );
      const context = canvas.getContext("2d");
      await page.render({
        canvas: canvas as never,
        canvasContext: context as never,
        viewport,
      }).promise;
      const png = canvas.toBuffer("image/png");
      const pageMarkdown = await parseImageWithMiniMax({
        apiKey: options.minimaxApiKey,
        data: png,
        mediaType: "image/png",
        pageLabel: `PDF 第 ${pageNumber} 页`,
      });
      parsedPages.push(pageNumber);
      markdownPages.push(`## 第 ${pageNumber} 页\n\n${pageMarkdown}`);
      page.cleanup();
    } catch {
      failedPages.push(pageNumber);
    }
  }

  await pdf.destroy();
  if (parsedPages.length === 0) {
    throw new Error("PDF 页面视觉解析失败，请稍后重试");
  }

  return {
    content: `# ${options.filename}\n\n${markdownPages.join("\n\n---\n\n")}`,
    status: failedPages.length > 0 ? "partial" : "parsed",
    metadata: {
      parser: "minimax-pdf-vision",
      pageCount,
      parsedPages,
      failedPages,
      truncated: pageCount > pageLimit,
      warnings:
        failedPages.length > 0
          ? [`第 ${failedPages.join("、")} 页解析失败`]
          : [],
      parsedAt: new Date().toISOString(),
    },
  };
}
