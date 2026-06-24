"use client";

import { AmbientField } from "@/components/workbench/ambient-field";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <AmbientField
        intensity="medium"
        density="wide"
        className="absolute inset-0 -z-10"
      />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <main className="relative z-0 w-full max-w-sm">
        <div data-dot-avoid className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        </div>

        <div
          data-dot-avoid
          className="motion-safe:animate-slide-up-fade rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6"
        >
          {children}
        </div>

        <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          {footer}
        </div>
      </main>
    </div>
  );
}
