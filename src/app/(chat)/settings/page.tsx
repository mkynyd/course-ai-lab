"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Database, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { useCacheMetrics } from "@/lib/hooks/use-cache-metrics";

export default function SettingsPage() {
  const { data: session } = useSession();
  const cacheMetrics = useCacheMetrics(7);
  const [switchCodeValue, setSwitchCodeValue] = useState("");
  const [switchPending, setSwitchPending] = useState(false);
  const [switchMessage, setSwitchMessage] = useState("");
  const [switchError, setSwitchError] = useState(false);

  async function handleSwitchCode() {
    const code = switchCodeValue.trim();
    if (!code) return;
    setSwitchPending(true);
    setSwitchMessage("");
    setSwitchError(false);
    try {
      const res = await fetch("/api/user/switch-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSwitchError(true);
        setSwitchMessage(data.error || "更换失败");
      } else {
        setSwitchMessage("注册码更换成功，新模型配置已生效");
        setSwitchCodeValue("");
      }
    } catch {
      setSwitchError(true);
      setSwitchMessage("网络错误，请重试");
    } finally {
      setSwitchPending(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-lg space-y-8 px-4 py-8">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
          设置
        </h1>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound
              size={16}
              className="text-[var(--color-text-tertiary)]"
            />
            <h2 className="text-sm font-medium">Alpha 服务访问</h2>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-[var(--color-success)]"
              />
              <div className="space-y-1">
                <p className="text-sm font-medium">API Key 由测试管理员统一配置</p>
                <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
                  你的账户通过注册码绑定到 Alpha 测试密钥组。密钥不会发送到浏览器，也无需自行填写。
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw
                size={14}
                className="text-[var(--color-text-tertiary)]"
              />
              <span className="text-sm font-medium">更换注册码</span>
            </div>
            <p className="text-xs leading-5 text-[var(--color-text-secondary)] mb-3">
              输入新的注册码以切换到不同的服务配置。更换后立即生效，下次对话即可使用新模型。
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={switchCodeValue}
                onChange={(e) => setSwitchCodeValue(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="h-10 flex-1 rounded-[var(--radius-md)] border bg-[var(--color-bg)] px-3 font-mono text-sm placeholder:text-[var(--color-text-tertiary)]"
              />
              <Button
                variant="primary"
                size="md"
                disabled={switchPending || !switchCodeValue.trim()}
                onClick={handleSwitchCode}
                className="shrink-0"
              >
                {switchPending ? "验证中..." : "更换"}
              </Button>
            </div>
            {switchMessage && (
              <p
                className={`mt-2 text-xs ${
                  switchError
                    ? "text-[var(--color-error)]"
                    : "text-[var(--color-success)]"
                }`}
              >
                {switchMessage}
              </p>
            )}
          </div>
        </section>

        <hr className="border-[var(--color-border)]" />

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Database
              size={16}
              className="text-[var(--color-text-tertiary)]"
            />
            <h2 className="text-sm font-medium">Cache</h2>
          </div>
          {cacheMetrics.isPending ? (
            <div className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-hover)]" />
          ) : cacheMetrics.data ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  近 7 天 Token 命中率
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {(cacheMetrics.data.overall.hitRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs">
                {(["deepseek", "minimax"] as const).map((provider) => (
                  <div key={provider} className="flex justify-between py-1">
                    <span className="capitalize">{provider}</span>
                    <span className="font-mono">
                      {(
                        cacheMetrics.data.providers[provider].hitRate * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-error)]">缓存指标加载失败</p>
          )}
        </section>

        <hr className="border-[var(--color-border)]" />

        <section className="space-y-4">
          <h2 className="text-sm font-medium">外观</h2>
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <span className="text-sm text-[var(--color-text-secondary)]">
              主题
            </span>
            <ThemeToggle />
          </div>
        </section>

        <hr className="border-[var(--color-border)]" />

        <section className="space-y-4">
          <h2 className="text-sm font-medium">账户</h2>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-tertiary)]">
                邮箱
              </span>
              <span className="text-sm">{session?.user?.email}</span>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            退出登录
          </Button>
        </section>
      </div>
    </div>
  );
}
