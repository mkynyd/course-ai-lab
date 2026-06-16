import { prisma } from "@/lib/db";
import { createTextMessage } from "@/lib/deepseek";
import { getProviderApiKey } from "@/lib/data/provider-access";
import { FILE_CATEGORIES, type FileCategory } from "@/lib/file-categories";
import { refreshProjectIndex } from "@/lib/rag/project-index";

interface CategorizeFilesInput {
  userId: string;
  projectId: string;
  fileIds: string[];
}

interface Classification {
  id: string;
  category: FileCategory | null;
  confidence: number | null;
}

const CATEGORY_KEYWORDS: Array<{
  category: FileCategory;
  keywords: string[];
}> = [
  { category: "试卷", keywords: ["试卷", "考试", "期末", "期中", "卷", "题"] },
  { category: "作业", keywords: ["作业", "习题", "练习", "homework", "assignment"] },
  { category: "课件", keywords: ["课件", "ppt", "lecture", "第", "讲"] },
  { category: "讲义", keywords: ["讲义", "教材", "notes", "note"] },
  { category: "实验", keywords: ["实验", "lab", "报告", "数据", "指导书"] },
  { category: "代码", keywords: ["代码", "源码", "code", "src", ".ts", ".py", ".java", ".cpp"] },
];

function normalizeCategory(value: unknown): FileCategory | null {
  if (typeof value !== "string") return null;
  return FILE_CATEGORIES.includes(value as FileCategory) ? (value as FileCategory) : null;
}

function extractJsonArray(value: string): unknown {
  const fenced = value.match(/```json\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || value.match(/\[[\s\S]*\]/)?.[0] || value;
  return JSON.parse(candidate);
}

function clampConfidence(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(1, value));
}

function heuristicClassify(file: {
  id: string;
  originalName: string;
  textContent: string | null;
}): Classification {
  const haystack = `${file.originalName} ${file.textContent || ""}`.toLowerCase();
  let best: { category: FileCategory; hits: number } | null = null;

  for (const group of CATEGORY_KEYWORDS) {
    const hits = group.keywords.filter((keyword) =>
      haystack.includes(keyword.toLowerCase())
    ).length;
    if (hits > 0 && (!best || hits > best.hits)) {
      best = { category: group.category, hits };
    }
  }

  if (!best) {
    return { id: file.id, category: null, confidence: 0.4 };
  }

  return {
    id: file.id,
    category: best.category,
    confidence: Math.min(0.95, 0.68 + best.hits * 0.12),
  };
}

async function classifyWithDeepSeek(
  userId: string,
  files: Array<{
    id: string;
    originalName: string;
    textContent: string | null;
  }>
): Promise<Classification[] | null> {
  let apiKey: string;
  try {
    apiKey = await getProviderApiKey(userId, "deepseek");
  } catch {
    return null;
  }

  const payload = files.map((file) => ({
    id: file.id,
    filename: file.originalName,
    excerpt: (file.textContent || "").slice(0, 800),
  }));

  try {
    const output = await createTextMessage(apiKey, {
      model: "deepseek-v4-pro",
      maxTokens: 1200,
      temperature: 0,
      system:
        "你是课程资料分类器。只能输出 JSON 数组，不要输出解释。分类只能是：试卷、作业、课件、讲义、实验、代码。",
      prompt:
        `请为每个文件判定 category 和 confidence。confidence 范围 0-1。\n` +
        `输出格式：[{"id":"...","category":"课件","confidence":0.86}]\n\n` +
        JSON.stringify(payload),
    });
    const parsed = extractJsonArray(output);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const category = normalizeCategory(record.category);
      const confidence = clampConfidence(record.confidence);
      return {
        id: String(record.id || ""),
        category: category && (confidence ?? 0) >= 0.7 ? category : null,
        confidence,
      };
    }).filter((item) => item.id);
  } catch {
    return null;
  }
}

export async function categorizeFiles(input: CategorizeFilesInput) {
  const fileIds = [...new Set(input.fileIds)];
  if (fileIds.length === 0) return [];

  const files = await prisma.fileAsset.findMany({
    where: {
      id: { in: fileIds },
      userId: input.userId,
      projectId: input.projectId,
      status: { in: ["parsed", "partial"] },
    },
    select: {
      id: true,
      originalName: true,
      textContent: true,
    },
  });

  const deepSeekResults = await classifyWithDeepSeek(input.userId, files);
  const results = deepSeekResults || files.map(heuristicClassify);
  const byId = new Map(results.map((item) => [item.id, item]));

  await Promise.all(
    files.map((file) => {
      const result = byId.get(file.id) || heuristicClassify(file);
      return prisma.fileAsset.update({
        where: { id: file.id },
        data: {
          category: result.category,
          categoryConfidence: result.confidence,
        },
      });
    })
  );

  await refreshProjectIndex({
    userId: input.userId,
    projectId: input.projectId,
  }).catch(() => {});

  return results;
}
