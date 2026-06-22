/**
 * POST /api/user/generate-profile
 * 根据用户填写的昵称/职业/详情，调用 LLM 生成个人描述提示词，存入 User.profilePrompt。
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateUserProfilePrompt } from "@/lib/classification";
import { z } from "zod";

const reqSchema = z.object({
  nickname: z.string().max(60).default(""),
  profession: z.string().max(100).default(""),
  details: z.string().max(500).default(""),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }
  const parsed = reqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }
  const { nickname, profession, details } = parsed.data;

  let apiKey: string;
  try {
    const { getProviderApiKey } = await import("@/lib/data/provider-access");
    apiKey = await getProviderApiKey(session.user.id, "deepseek");
  } catch {
    return NextResponse.json({ error: "API Key 未配置" }, { status: 503 });
  }

  try {
    const profilePrompt = await generateUserProfilePrompt(nickname, profession, details, apiKey);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePrompt },
    });
    return NextResponse.json({ profilePrompt });
  } catch (err) {
    console.error("generate-profile error:", err);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
