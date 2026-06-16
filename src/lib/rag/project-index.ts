import { prisma } from "@/lib/db";
export { FILE_CATEGORIES, type FileCategory } from "@/lib/file-categories";

interface IndexFile {
  id: string;
  originalName: string;
  category: string | null;
  categoryConfidence: number | null;
  status: string;
  textContent: string | null;
  enhancedContent: string | null;
}

export interface RefreshProjectIndexInput {
  userId: string;
  projectId: string;
}

export interface MatchProjectIndexInput extends RefreshProjectIndexInput {
  query: string;
  limit?: number;
}

export interface ProjectIndexMatch {
  fileId: string;
  originalName: string;
  category: string | null;
  summary: string;
  keywords: string[];
  score: number;
}

export interface ProjectIndexMatchResult {
  fullLoadFileIds: string[];
  summaryOnly: ProjectIndexMatch[];
  matches: ProjectIndexMatch[];
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function summarize(content: string | null, maxLength = 100) {
  const text = compactText(content || "");
  if (!text) return "暂无可检索正文";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function tokenize(value: string, limit = 18) {
  const terms = new Set<string>();
  const runs = value
    .toLowerCase()
    .match(/[\p{Script=Han}a-z0-9_+-]{2,}/gu) || [];

  for (const run of runs) {
    if (run.length <= 10) {
      terms.add(run);
    } else {
      terms.add(run.slice(0, 10));
      if (/^\p{Script=Han}+$/u.test(run)) {
        for (let i = 0; i < run.length - 1 && terms.size < limit; i += 2) {
          terms.add(run.slice(i, i + 2));
        }
      }
    }
    if (terms.size >= limit) break;
  }

  return [...terms];
}

function fileContent(file: IndexFile) {
  return file.enhancedContent || file.textContent || "";
}

export function buildProjectIndexEntries(files: IndexFile[]) {
  return files.map((file) => {
    const content = fileContent(file);
    const summary = summarize(content);
    const keywords = tokenize(`${file.originalName} ${file.category || ""} ${content}`, 10);
    const category =
      file.category && (file.categoryConfidence ?? 1) >= 0.7
        ? file.category
        : "未分类";

    return {
      fileId: file.id,
      originalName: file.originalName,
      category,
      status: file.status,
      summary,
      keywords,
      line: `- 文件ID：${file.id} | 文件名：${file.originalName} | 分类：${category} | 摘要：${summary} | 关键术语：${keywords.join("、") || "无"} | 状态：${file.status}`,
    };
  });
}

async function assertProjectAccess(input: RefreshProjectIndexInput) {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId: input.userId },
    select: { id: true },
  });
  if (!project) {
    throw new Error("项目不存在或无访问权限");
  }
}

async function getIndexableFiles(input: RefreshProjectIndexInput): Promise<IndexFile[]> {
  return prisma.fileAsset.findMany({
    where: {
      projectId: input.projectId,
      userId: input.userId,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      originalName: true,
      category: true,
      categoryConfidence: true,
      status: true,
      textContent: true,
      enhancedContent: true,
    },
  });
}

export async function refreshProjectIndex(input: RefreshProjectIndexInput) {
  await assertProjectAccess(input);
  const files = await getIndexableFiles(input);
  const entries = buildProjectIndexEntries(files);
  const content = [
    "# INDEX.md",
    "",
    `项目ID：${input.projectId}`,
    `文件数：${entries.length}`,
    "",
    ...entries.map((entry) => entry.line),
  ].join("\n");

  await prisma.projectIndex.upsert({
    where: { projectId: input.projectId },
    create: { projectId: input.projectId, content },
    update: { content },
  });

  return content;
}

function scoreEntry(entry: ReturnType<typeof buildProjectIndexEntries>[number], query: string) {
  const queryTerms = tokenize(query, 24);
  const normalizedQuery = normalize(query);
  const normalizedName = normalize(entry.originalName);
  let score = 0;

  if (normalizedName && normalizedQuery.includes(normalizedName)) {
    score += 1000;
  }

  const filename = entry.originalName.toLowerCase();
  const summary = entry.summary.toLowerCase();
  const category = entry.category.toLowerCase();
  const keywords = entry.keywords.map((keyword) => keyword.toLowerCase());

  for (const term of queryTerms) {
    if (filename.includes(term)) score += 8;
    if (category.includes(term)) score += 3;
    if (summary.includes(term)) score += 2;
    if (keywords.some((keyword) => keyword.includes(term) || term.includes(keyword))) {
      score += 5;
    }
  }

  return score;
}

export async function matchProjectIndex(input: MatchProjectIndexInput): Promise<ProjectIndexMatchResult> {
  await assertProjectAccess(input);
  const files = await getIndexableFiles(input);
  const entries = buildProjectIndexEntries(
    files.filter((file) => ["parsed", "partial"].includes(file.status))
  );
  const limit = input.limit ?? 5;
  const matches = entries
    .map((entry) => ({
      fileId: entry.fileId,
      originalName: entry.originalName,
      category: entry.category === "未分类" ? null : entry.category,
      summary: entry.summary,
      keywords: entry.keywords,
      score: scoreEntry(entry, input.query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.originalName.localeCompare(b.originalName, "zh-Hans-CN"));

  return {
    fullLoadFileIds: matches.slice(0, limit).map((match) => match.fileId),
    summaryOnly: matches.slice(limit),
    matches,
  };
}
