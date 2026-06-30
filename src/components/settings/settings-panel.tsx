"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Database,
  KeyRound,
  LogOut,
  Palette,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarMark } from "@/components/user/avatar-mark";
import { useCacheMetrics } from "@/lib/hooks/use-cache-metrics";
import {
  useUpdateUserProfile,
  useUserProfile,
} from "@/lib/hooks/use-user-profile";
import {
  AVATAR_PRESETS,
  avatarPresetById,
  type AvatarPresetId,
} from "@/lib/user-profile";
import { cn } from "@/lib/utils";

type TabId = "alpha" | "tokens" | "profile" | "appearance" | "account";

function formatTokenCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function formatCurrency(value: number) {
  if (value >= 1) return `¥${value.toFixed(2)}`;
  if (value >= 0.01) return `¥${value.toFixed(4)}`;
  return `¥${value.toFixed(6)}`;
}

export function SettingsPanel() {
  const [tab, setTab] = useState<TabId>("alpha");

  const tabs: Array<{ id: TabId; label: string; icon: typeof KeyRound }> = [
    { id: "alpha", label: "服务访问", icon: KeyRound },
    { id: "tokens", label: "用量统计", icon: Database },
    { id: "profile", label: "关于你", icon: UserRound },
    { id: "appearance", label: "外观", icon: Palette },
    { id: "account", label: "账户", icon: LogOut },
  ];

  return (
    <div className="flex h-[560px]">
      {/* Left sidebar — neutral surface, no border, breathing room */}
      <nav
        className="w-52 shrink-0 bg-[var(--color-panel)] py-5 px-3 flex flex-col gap-0.5"
        role="tablist"
        aria-label="设置标签页"
      >
        <div className="flex flex-col gap-0.5">
          {tabs.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              aria-controls={`settings-panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl text-left w-full",
                "transition-colors duration-150",
                tab === item.id
                  ? "bg-[var(--color-interaction-active)] text-[var(--color-text-primary)] font-medium"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-interaction-hover)] hover:text-[var(--color-text-primary)]"
              )}
            >
              <item.icon size={16} strokeWidth={1.5} />
              {item.label}
            </button>
          ))}
        </div>

        <Link
          href="/home"
          className={cn(
            "mt-auto flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl text-left w-full",
            "mt-3",
            "text-[var(--color-text-secondary)] hover:bg-[var(--color-interaction-hover)] hover:text-[var(--color-text-primary)]",
            "transition-colors duration-150"
          )}
        >
          <Sparkles size={16} strokeWidth={1.5} />
          <span className="flex-1">网站介绍</span>
          <ArrowUpRight size={12} strokeWidth={1.5} className="text-[var(--color-text-tertiary)]" />
        </Link>
      </nav>

      {/* Right content — soft surface, generous spacing */}
      <ScrollArea className="flex-1 min-w-0 bg-[var(--color-bg)]">
        <div className="px-8 py-6">
          {tab === "alpha" && <AlphaSection />}
          {tab === "tokens" && <TokensSection />}
          {tab === "profile" && <ProfileSection />}
          {tab === "appearance" && <AppearanceSection />}
          {tab === "account" && <AccountSection />}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================
// Section shell — gives every tab a consistent title + divider
// ============================================================

function SectionShell({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="space-y-5" role="tabpanel" aria-label={title}>
      <div className="pb-3 border-b border-[var(--color-border-light)]">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] tracking-tight">
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ============================================================
// Section Components
// ============================================================

function AlphaSection() {
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
    <SectionShell id="settings-panel-alpha" title="Alpha 服务访问">
      <div className="rounded-2xl bg-[var(--color-project-control)] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
          <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            API Key 由管理员统一配置。账户通过注册码绑定 Alpha 测试密钥组，无需自行填写。
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--color-project-control)] p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">更换注册码</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            更换后立即生效，原注册码自动失效
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            value={switchCodeValue}
            onChange={(e) => setSwitchCodeValue(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="flex-1 h-9 rounded-xl font-mono text-sm bg-[var(--color-surface)]"
          />
          <Button
            variant="primary"
            size="md"
            disabled={switchPending || !switchCodeValue.trim()}
            onClick={handleSwitchCode}
            className="rounded-xl px-4"
          >
            {switchPending ? "验证中..." : "更换"}
          </Button>
        </div>
        {switchMessage && (
          <p
            className={cn(
              "text-xs",
              switchError ? "text-[var(--color-error)]" : "text-[var(--color-success)]"
            )}
          >
            {switchMessage}
          </p>
        )}
      </div>
    </SectionShell>
  );
}

function TokensSection() {
  const cacheMetrics = useCacheMetrics(7);

  return (
    <SectionShell id="settings-panel-tokens" title="用量统计">
      <p className="text-xs text-[var(--color-text-tertiary)] -mt-2">
        近 7 天 Token 使用情况
      </p>

      {cacheMetrics.isPending ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : cacheMetrics.data ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--color-project-control)] p-4">
              <p className="text-xs text-[var(--color-text-tertiary)]">近 7 天总量</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)] tracking-tight">
                {formatTokenCount(cacheMetrics.data.tokenUsage.totalTokens)}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                今日 {formatTokenCount(cacheMetrics.data.tokenUsage.todayTokens)}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-project-control)] p-4">
              <p className="text-xs text-[var(--color-text-tertiary)]">预估费用</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                {formatCurrency(cacheMetrics.data.tokenUsage.estimatedCostCny)}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                输入 {formatTokenCount(cacheMetrics.data.tokenUsage.inputTokens)} / 输出{" "}
                {formatTokenCount(cacheMetrics.data.tokenUsage.outputTokens)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--color-project-control)] p-4 space-y-1">
            <p className="mb-2 text-xs text-[var(--color-text-tertiary)]">
              服务拆分
            </p>
            {(["deepseek", "minimax"] as const).map((provider) => (
              <div key={provider} className="flex justify-between py-0.5 text-sm">
                <span className="text-[var(--color-text-secondary)]">
                  {provider === "deepseek" ? "DeepSeek" : "MiniMax"}
                </span>
                <span className="text-right font-mono text-[var(--color-text-primary)]">
                  {cacheMetrics.data.tokenUsage.providers[provider].requestCount > 0 ? (
                    <>
                      {formatTokenCount(cacheMetrics.data.tokenUsage.providers[provider].totalTokens)}
                      <span className="ml-2 text-[var(--color-text-tertiary)]">
                        {formatCurrency(
                          cacheMetrics.data.tokenUsage.providers[provider].estimatedCostCny
                        )}
                      </span>
                    </>
                  ) : (
                    "--"
                  )}
                </span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-2">
              RAG 缓存命中率
            </p>
            <div className="rounded-2xl bg-[var(--color-project-control)] p-4 space-y-2">
              {([
                ["search", "检索结果缓存"] as const,
                ["file-select", "文件选择缓存"] as const,
                ["query-embed", "查询向量缓存"] as const,
              ]).map(([key, label]) => {
                const metric = cacheMetrics.data.rag[key];
                const total = metric.hits + metric.misses;
                const rate = total > 0 ? Math.round(metric.hitRate * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3 text-sm">
                    <span className="w-24 text-[var(--color-text-secondary)]">{label}</span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--color-surface)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-success)]"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-[var(--color-text-primary)]">
                      {total > 0 ? `${rate}%` : "--"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-error)]">加载失败</p>
      )}
    </SectionShell>
  );
}

function ProfileSection() {
  const [nickname, setNickname] = useState("");
  const [profession, setProfession] = useState("");
  const [details, setDetails] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!nickname.trim() && !profession.trim() && !details.trim()) return;
    setGenerating(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/user/generate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, profession, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <SectionShell id="settings-panel-profile" title="关于你">
      <p className="text-xs text-[var(--color-text-tertiary)] -mt-2">
        AI 会根据这些信息更好地理解你的使用场景
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            昵称
          </label>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="你的称呼"
            maxLength={60}
            className="mt-2 h-9 rounded-xl bg-[var(--color-project-control)]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            职业
          </label>
          <Input
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            placeholder="例如: 计算机学院本科生"
            maxLength={100}
            className="mt-2 h-9 rounded-xl bg-[var(--color-project-control)]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            你的详情
          </label>
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="描述你的学习目标、使用习惯等"
            maxLength={500}
            className="mt-2 h-24 rounded-xl bg-[var(--color-project-control)] resize-none"
          />
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-xl px-4"
        >
          {generating ? "生成中..." : saved ? "已保存，点击重新生成" : "生成个人描述"}
        </Button>
        {saved && (
          <p className="text-xs text-[var(--color-success)]">已保存</p>
        )}
        {error && (
          <p className="text-xs text-[var(--color-error)]">{error}</p>
        )}
      </div>
    </SectionShell>
  );
}

function AppearanceSection() {
  return (
    <SectionShell id="settings-panel-appearance" title="外观">
      <div className="flex items-center justify-between rounded-2xl bg-[var(--color-project-control)] p-4">
        <span className="text-sm text-[var(--color-text-primary)]">主题</span>
        <ThemeToggle />
      </div>
    </SectionShell>
  );
}

function AccountSection() {
  const { data: session, update: updateSession } = useSession();
  const profileQuery = useUserProfile();

  const profile = profileQuery.data;
  const currentName = profile?.name || session?.user?.name || "";
  const currentAvatarPreset = avatarPresetById(
    profile?.avatarPreset || session?.user?.avatarPreset
  ).id;
  const email = profile?.email || session?.user?.email || "";

  async function syncSessionProfile(nextProfile: {
    name: string | null;
    avatarPreset: AvatarPresetId;
  }) {
    await updateSession({
      user: {
        name: nextProfile.name,
        avatarPreset: nextProfile.avatarPreset,
      },
    });
  }

  return (
    <SectionShell id="settings-panel-account" title="账户">
      <AccountProfileForm
        key={profile ? "profile-loaded" : "session-profile"}
        initialName={currentName}
        initialAvatarPreset={currentAvatarPreset}
        email={email}
        loading={profileQuery.isPending}
        onSaved={syncSessionProfile}
      />

      <div className="rounded-2xl bg-[var(--color-project-control)] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--color-text-tertiary)]">邮箱</span>
          <span className="text-sm text-[var(--color-text-primary)] truncate">
            {email}
          </span>
        </div>
      </div>
      <Button
        variant="danger"
        size="md"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-fit rounded-xl px-4"
      >
        退出登录
      </Button>
    </SectionShell>
  );
}

function AccountProfileForm({
  initialName,
  initialAvatarPreset,
  email,
  loading,
  onSaved,
}: {
  initialName: string;
  initialAvatarPreset: AvatarPresetId;
  email: string;
  loading: boolean;
  onSaved: (profile: {
    name: string | null;
    avatarPreset: AvatarPresetId;
  }) => Promise<void>;
}) {
  const updateProfile = useUpdateUserProfile();
  const [name, setName] = useState(initialName);
  const [avatarPreset, setAvatarPreset] =
    useState<AvatarPresetId>(initialAvatarPreset);
  const [saved, setSaved] = useState(false);

  async function handleSaveProfile() {
    setSaved(false);
    const nextProfile = await updateProfile.mutateAsync({
      name,
      avatarPreset,
    });
    await onSaved(nextProfile);
    setSaved(true);
  }

  return (
    <div className="space-y-4 rounded-2xl bg-[var(--color-project-control)] p-4">
      <div className="flex items-center gap-3">
        <AvatarMark presetId={avatarPreset} className="size-10 text-sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {name.trim() || email || "账户"}
          </p>
          <p className="truncate text-xs text-[var(--color-text-tertiary)]">
            侧栏和账户菜单会显示这个昵称
          </p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          昵称
        </label>
        <Input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
          placeholder="你的称呼"
          maxLength={60}
          className="mt-2 h-9 rounded-xl bg-[var(--color-surface)]"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          头像样式
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2" role="list" aria-label="头像样式">
          {AVATAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={avatarPreset === preset.id}
              onClick={() => {
                setAvatarPreset(preset.id);
                setSaved(false);
              }}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 rounded-xl text-xs transition-colors",
                avatarPreset === preset.id
                  ? "bg-[var(--color-interaction-active)] text-[var(--color-text-primary)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              )}
            >
              <AvatarMark presetId={preset.id} className="size-7" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={handleSaveProfile}
          disabled={loading || updateProfile.isPending}
          className="rounded-xl px-4"
        >
          {updateProfile.isPending ? "保存中..." : "保存资料"}
        </Button>
        {saved && (
          <span className="text-xs text-[var(--color-success)]">已保存</span>
        )}
        {updateProfile.isError && (
          <span className="text-xs text-[var(--color-error)]">保存失败，请重试</span>
        )}
      </div>
    </div>
  );
}
