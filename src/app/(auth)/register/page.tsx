"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const errorId = useId();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<"email" | "registrationCode" | "password" | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const registrationCode = form.get("registrationCode") as string;

    if (password.length < 8) {
      setError("密码至少需要 8 个字符");
      setErrorField("password");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, registrationCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          setError("该邮箱已被注册");
          setErrorField("email");
        } else if (data.error?.registrationCode) {
          setError(data.error.registrationCode[0]);
          setErrorField("registrationCode");
        } else if (data.error?.email) {
          setError(data.error.email[0]);
          setErrorField("email");
        } else {
          setError("注册失败，请稍后重试");
          setErrorField(null);
        }
        setIsLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("网络异常，请稍后重试");
      setErrorField(null);
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="LumenLab"
      subtitle="创建新账户"
      footer={
        <>
          已有账户？{" "}
          <Link
            href="/login"
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-1 text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
          >
            登录
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            邮箱
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            aria-invalid={errorField === "email" || undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="registrationCode"
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            注册码
          </label>
          <Input
            id="registrationCode"
            name="registrationCode"
            type="text"
            autoComplete="off"
            required
            minLength={8}
            placeholder="输入 Alpha 注册码"
            className="uppercase tracking-wide"
            aria-invalid={errorField === "registrationCode" || undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            密码
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="至少 8 个字符"
            className="font-mono"
            aria-invalid={errorField === "password" || undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        {error && (
          <p
            id={errorId}
            className="text-sm text-[var(--color-error)]"
            role="alert"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-9 rounded-[var(--radius-md)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              创建中…
            </>
          ) : (
            "创建账户"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
