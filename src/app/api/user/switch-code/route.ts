import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  digestRegistrationCode,
  evaluateRegistrationCode,
  normalizeRegistrationCode,
} from "@/lib/registration-code";

const switchCodeSchema = z.object({
  code: z.string().min(4).max(128),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const parsed = switchCodeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "请输入有效的注册码" }, { status: 400 });
  }

  const pepper = process.env.REGISTRATION_CODE_PEPPER;
  if (!pepper) {
    return NextResponse.json({ error: "注册码服务尚未配置" }, { status: 503 });
  }

  const normalized = normalizeRegistrationCode(parsed.data.code);
  const digest = digestRegistrationCode(normalized, pepper);

  const code = await prisma.registrationCode.findUnique({
    where: { codeDigest: digest },
    select: {
      id: true,
      status: true,
      redemptionCount: true,
      maxRedemptions: true,
      expiresAt: true,
      credentialProfile: {
        select: {
          id: true,
          status: true,
          credentials: { select: { provider: true, status: true } },
        },
      },
    },
  });

  if (!code) {
    return NextResponse.json({ error: "注册码无效" }, { status: 400 });
  }

  const evaluation = evaluateRegistrationCode(code);
  if (!evaluation.allowed) {
    const messages: Record<string, string> = {
      disabled: "该注册码已停用",
      exhausted: "该注册码使用次数已达上限",
      expired: "该注册码已过期",
    };
    return NextResponse.json(
      { error: messages[evaluation.reason] || "注册码不可用" },
      { status: 400 }
    );
  }

  const hasDeepSeek = code.credentialProfile.credentials.some(
    (c) => c.provider === "deepseek" && c.status === "active"
  );
  if (code.credentialProfile.status !== "active" || !hasDeepSeek) {
    return NextResponse.json(
      { error: "该注册码对应的服务配置暂不可用" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      credentialProfileId: true,
      redemption: { select: { codeId: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (user.credentialProfileId === code.credentialProfile.id) {
    return NextResponse.json(
      { error: "你已在使用该注册码对应的服务配置，无需更换" },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(
      async (transaction) => {
        // Release old code's redemption count
        if (user.redemption) {
          await transaction.registrationCode.update({
            where: { id: user.redemption.codeId },
            data: { redemptionCount: { decrement: 1 } },
          });
        }

        // Consume new code
        const affected = await transaction.$executeRaw`
          UPDATE "RegistrationCode"
          SET "redemptionCount" = "redemptionCount" + 1,
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${code.id}
            AND "status" = 'active'
            AND "redemptionCount" < "maxRedemptions"
            AND ("expiresAt" IS NULL OR "expiresAt" > CURRENT_TIMESTAMP)
        `;
        if (affected !== 1) {
          throw new Error("code_exhausted");
        }

        // Create new redemption record
        if (user.redemption) {
          await transaction.registrationRedemption.delete({
            where: { userId: session.user.id },
          });
        }
        await transaction.registrationRedemption.create({
          data: { codeId: code.id, userId: session.user.id },
        });

        // Update user's credential profile
        await transaction.user.update({
          where: { id: session.user.id },
          data: { credentialProfileId: code.credentialProfile.id },
        });
      },
      { isolationLevel: "Serializable" }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "code_exhausted") {
      return NextResponse.json(
        { error: "该注册码使用次数已达上限" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "更换注册码失败，请重试" }, { status: 500 });
  }
}
