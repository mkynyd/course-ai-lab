/**
 * 简化的提示词拼接器。
 *
 * 架构变更：
 *   不再维护 UserRole 数据库体系。
 *   项目级 systemPrompt 由 LLM 根据用户自然语言输入生成，存入 Project.systemPrompt。
 *   用户全局 profilePrompt 存入 User.profilePrompt。
 *
 * 拼接顺序：GLOBAL → userProfilePrompt → projectSystemPrompt → MODE_PROMPT
 */

import { prisma } from "@/lib/db";
import { GLOBAL_SYSTEM_PROMPT, GLOBAL_SYSTEM_PROMPT_WEB_SEARCH, getModePrompt } from "@/lib/ai/prompts";

// ============================================================
// LLM 生成项目级 Prompt
// ============================================================

export async function generateProjectPrompt(
  userInput: string,
  mode: string,
  apiKey: string
): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const { mapDeepSeekModel } = await import("@/lib/deepseek");

  const modeLabel =
    mode === "experiment" ? "实验/实践" :
    mode === "review" ? "复习/资料整理" :
    mode === "coding" ? "编程/开发" : "通用";

  const systemPrompt = `你是一个项目配置助手。根据用户的自然语言描述，生成一段简洁的项目级系统提示词。

这段提示词会被注入到 AI 助手的系统中，帮助 AI 更好地理解用户的背景和使用场景。

生成规则：
- 长度控制在 200 字以内
- 包含用户的身份/专业背景、使用目的、学科领域
- 使用第三人称描述（"用户是一名..."开头）
- 给出 AI 回答时的注意事项（如"使用初学者能理解的语言"、"保留完整推导步骤"等）
- 用中文输出，不要用 markdown 格式`;

  const client = new Anthropic({
    baseURL: "https://api.deepseek.com/anthropic",
    apiKey,
    timeout: 30_000,
    maxRetries: 0,
  });

  const response = await client.messages.create({
    model: mapDeepSeekModel("deepseek-v4-flash"),
    max_tokens: 300,
    temperature: 0.3,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `用户描述：${userInput}\n工作模式：${modeLabel}\n\n请生成项目系统提示词。`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text.trim() : "";
}

// ============================================================
// LLM 生成用户全局 Profile Prompt
// ============================================================

export async function generateUserProfilePrompt(
  nickname: string,
  profession: string,
  details: string,
  apiKey: string
): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const { mapDeepSeekModel } = await import("@/lib/deepseek");

  const client = new Anthropic({
    baseURL: "https://api.deepseek.com/anthropic",
    apiKey,
    timeout: 30_000,
    maxRetries: 0,
  });

  const response = await client.messages.create({
    model: mapDeepSeekModel("deepseek-v4-flash"),
    max_tokens: 250,
    temperature: 0.3,
    system: "你是一个用户画像助手。根据用户提供的信息，生成一段简洁的个人描述提示词，用于帮助 AI 理解用户背景。控制在 150 字以内，中文输出，第三人称。",
    messages: [
      {
        role: "user",
        content: `昵称：${nickname || "未提供"}\n职业/专业：${profession || "未提供"}\n详情：${details || "未提供"}\n\n请生成用户个人描述。`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text.trim() : "";
}

// ============================================================
// 快捷任务推荐生成
// ============================================================

export async function generateQuickActions(
  userInput: string,
  mode: string,
  apiKey: string
): Promise<Array<{ title: string; prompt: string }>> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const { mapDeepSeekModel } = await import("@/lib/deepseek");

  const client = new Anthropic({
    baseURL: "https://api.deepseek.com/anthropic",
    apiKey,
    timeout: 30_000,
    maxRetries: 0,
  });

  const response = await client.messages.create({
    model: mapDeepSeekModel("deepseek-v4-flash"),
    max_tokens: 400,
    temperature: 0.3,
    system: `你是一个快捷任务推荐助手。根据用户描述和使用场景，推荐 3-5 个快捷任务。

每个快捷任务包含：
- title: 简短标题（6字以内）
- prompt: 具体的 AI 指令

输出纯 JSON 数组格式：[
  {"title": "逐题解析", "prompt": "请对以下题目进行逐题解析..."},
  ...
]

不要输出其他内容。`,
    messages: [
      {
        role: "user",
        content: `用户描述：${userInput}\n工作模式：${mode}\n\n请推荐 3-5 个快捷任务。`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || !("text" in textBlock)) return [];

  try {
    const cleaned = textBlock.text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ============================================================
// 提示词拼接器
// ============================================================

export interface PromptAssemblyInput {
  webSearchActive: boolean;
  projectId?: string;
  userId?: string;
  mode?: string;
}

export async function assembleSystemPrompt(
  input: PromptAssemblyInput
): Promise<string> {
  const parts: string[] = [];

  // Layer 1: Global
  parts.push(
    input.webSearchActive ? GLOBAL_SYSTEM_PROMPT_WEB_SEARCH : GLOBAL_SYSTEM_PROMPT
  );

  // Layer 2: User profile prompt
  if (input.userId) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { profilePrompt: true },
    });
    if (user?.profilePrompt) {
      parts.push(`## 用户背景\n${user.profilePrompt}`);
    }
  }

  // Layer 3: Project system prompt (LLM-generated)
  if (input.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: { systemPrompt: true },
    });
    if (project?.systemPrompt) {
      parts.push(`## 项目上下文\n${project.systemPrompt}`);
    }
  }

  // Layer 4: Mode prompt
  const mode = input.mode || "general";
  const modePrompt = getModePrompt(mode);
  if (modePrompt) {
    parts.push(modePrompt);
  }

  return parts.join("\n\n");
}
