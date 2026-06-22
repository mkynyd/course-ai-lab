/**
 * POST /api/classification
 *
 * 调用 DeepSeek 进行用户身份分类，输出受 JSON Schema 严格约束的结果。
 * roleKey 必须是数据库中已启用的 UserRole.key 之一或 null。
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildClassificationPrompt, getRecommendedQuickActions } from "@/lib/classification";
import { mapDeepSeekModel } from "@/lib/deepseek";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/anthropic";

const requestSchema = z.object({
  userInput: z.string().min(2).max(500),
  mode: z.enum(["experiment", "review", "coding", "general"]).default("general"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "参数无效", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { userInput, mode } = parsed.data;

  // 1. Build dynamic classification prompt
  const { systemPrompt, jsonSchema, roleKeys } = await buildClassificationPrompt(mode);

  // No roles available — return empty result immediately
  if (roleKeys.length === 0) {
    return NextResponse.json({
      classification: {
        roleKey: null,
        mode,
        domain: "通用",
        confidence: 0,
        reason: "no_roles_available",
      },
      quickActions: [],
    });
  }

  // 2. Get provider API key
  const { getProviderApiKey } = await import("@/lib/data/provider-access");
  let apiKey: string;
  try {
    apiKey = await getProviderApiKey(session.user.id, "deepseek");
  } catch {
    return NextResponse.json(
      { error: "DeepSeek API Key 未配置" },
      { status: 503 }
    );
  }

  // 3. Call DeepSeek — use simple text output with JSON, more reliable than tool_choice
  try {
    const client = new Anthropic({
      baseURL: DEEPSEEK_BASE_URL,
      apiKey,
      timeout: 30_000,
      maxRetries: 0,
    });

    const schemaStr = JSON.stringify(jsonSchema, null, 2);

    const response = await client.messages.create({
      model: mapDeepSeekModel("deepseek-v4-flash"),
      max_tokens: 256,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `用户输入：${userInput}\n\n请根据以上信息判断用户的身份角色和工作模式。\n\n必须严格按照以下 JSON Schema 输出，不要输出任何额外内容：\n${schemaStr}`,
        },
      ],
    });

    // Extract text content
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || !("text" in textBlock)) {
      return NextResponse.json(
        { error: "分类器未返回有效结果" },
        { status: 500 }
      );
    }

    // Parse JSON from response text
    let classification: {
      roleKey: string | null;
      mode: string;
      domain: string;
      confidence: number;
      reason: string;
    };
    try {
      // Extract JSON from possible markdown code blocks
      const jsonStr = textBlock.text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      classification = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "分类器返回格式异常" },
        { status: 500 }
      );
    }

    // 4. Validate roleKey against available roles
    if (classification.roleKey && !roleKeys.includes(classification.roleKey)) {
      classification.roleKey = null;
      classification.confidence = 0;
    }

    // 5. Validate mode
    const validModes = ["experiment", "review", "coding", "general"];
    if (!validModes.includes(classification.mode)) {
      classification.mode = mode;
    }

    // 6. Get recommended quick actions
    const quickActions = await getRecommendedQuickActions(classification.roleKey);

    return NextResponse.json({
      classification,
      quickActions,
    });
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: "分类服务暂时不可用，请稍后重试或跳过此步骤" },
      { status: 500 }
    );
  }
}
