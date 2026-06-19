import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRedisHealth } from "@/lib/redis";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: Record<
    string,
    { status: "ok" | "fail"; latencyMs: number; error?: string }
  >;
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const checks: HealthStatus["checks"] = {};
  let overall: HealthStatus["status"] = "healthy";

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch (error) {
    checks.database = {
      status: "fail",
      latencyMs: Date.now() - dbStart,
      error: error instanceof Error ? error.message : "数据库连接失败",
    };
    overall = "unhealthy";
  }

  // Redis check
  const redisStart = Date.now();
  try {
    const redisOk = await checkRedisHealth();
    checks.redis = {
      status: redisOk ? "ok" : "fail",
      latencyMs: Date.now() - redisStart,
      ...(redisOk ? {} : { error: "Redis PING 失败" }),
    };
    if (!redisOk) overall = "degraded";
  } catch (error) {
    checks.redis = {
      status: "fail",
      latencyMs: Date.now() - redisStart,
      error: error instanceof Error ? error.message : "Redis 连接失败",
    };
    overall = "degraded";
  }

  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status:
        overall === "healthy" ? 200 : overall === "degraded" ? 200 : 503,
    }
  );
}
