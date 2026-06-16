import { parseDocumentWithMiniMax } from "@/lib/vision/minimax";

export interface PdfParseResult {
  content: string;
  status: "parsed" | "partial";
  metadata: Record<string, unknown>;
}

export async function parsePdf(options: {
  data: Buffer;
  filename: string;
  minimaxApiKey?: string;
}): Promise<PdfParseResult> {
  if (!options.minimaxApiKey) {
    throw new Error(
      "PDF 文件需要 MiniMax M3 原生解析。请先在设置中配置 MiniMax API Key。"
    );
  }

  const content = await parseDocumentWithMiniMax({
    apiKey: options.minimaxApiKey,
    data: options.data,
    filename: options.filename,
    mediaType: "application/pdf",
  });
  return {
    content: `# ${options.filename}\n\n${content}`,
    status: "parsed",
    metadata: {
      parser: "minimax-pdf-native",
      truncated: false,
      parsedAt: new Date().toISOString(),
    },
  };
}
