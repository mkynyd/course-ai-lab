/** Skills Executor — 执行 client-side 工具 */

import { prisma } from "@/lib/db";

export interface SkillContext {
  userId: string;
  projectId?: string;
  conversationId?: string;
}

export async function executeSkill(
  name: string,
  input: Record<string, unknown>,
  context: SkillContext
): Promise<string> {
  try {
    switch (name) {
      case "search_project_files":
        return await searchFiles(input, context);
      case "list_project_files":
        return await listFiles(context);
      default:
        return `未知工具: ${name}`;
    }
  } catch (error) {
    return `工具执行失败: ${error instanceof Error ? error.message : "未知错误"}`;
  }
}

async function searchFiles(
  input: Record<string, unknown>,
  context: SkillContext
): Promise<string> {
  const query = (input.query as string) || "";
  const maxResults = Math.min((input.maxResults as number) || 5, 10);
  if (!context.projectId) return "未关联项目。";

  const files = await prisma.fileAsset.findMany({
    where: {
      projectId: context.projectId,
      userId: context.userId,
      status: "parsed",
      textContent: { not: null },
    },
    select: { id: true, originalName: true, textContent: true },
    take: 50,
  });

  if (!files.length) return "项目中没有已解析的文件。";

  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: Array<{ file: string; snippet: string; score: number }> = [];

  for (const file of files) {
    if (!file.textContent) continue;
    const lower = file.textContent.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      score += (lower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    }
    if (score > 0) {
      const idx = lower.indexOf(keywords[0]);
      const start = Math.max(0, idx - 80);
      const snippet = file.textContent.slice(start, start + 250).trim();
      results.push({ file: file.originalName, snippet: (start > 0 ? "..." : "") + snippet, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  const top = results.slice(0, maxResults);
  return top.length
    ? top.map((r, i) => `[${i + 1}] ${r.file} (匹配:${r.score})\n${r.snippet}`).join("\n\n---\n\n")
    : `在 ${files.length} 个文件中未找到匹配 "${query}" 的内容。`;
}

async function listFiles(context: SkillContext): Promise<string> {
  if (!context.projectId) return "未关联项目。";
  const files = await prisma.fileAsset.findMany({
    where: { projectId: context.projectId, userId: context.userId },
    select: { originalName: true, status: true, size: true, category: true },
    orderBy: { createdAt: "desc" },
  });
  return files.length
    ? files.map((f) => `- ${f.originalName} · ${f.status} · ${(f.size / 1024).toFixed(1)}KB` + (f.category ? ` · ${f.category}` : "")).join("\n")
    : "项目中没有文件。";
}
