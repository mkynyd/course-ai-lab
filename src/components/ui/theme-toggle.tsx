"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  { key: "light" as const, Icon: Sun, label: "浅色" },
  { key: "system" as const, Icon: Monitor, label: "自动" },
  { key: "dark" as const, Icon: Moon, label: "深色" },
];

const subscribeToHydration = () => () => undefined;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme = "system", setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );

  const selectedTheme = mounted ? theme : "system";

  return (
    <div
      className={cn(
        "flex items-center rounded-[var(--radius-lg)] p-0.5",
        "bg-[var(--color-surface)]",
        className
      )}
      role="radiogroup"
      aria-label="主题"
    >
      {options.map(({ key, Icon, label }) => {
        const active = selectedTheme === key;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(key)}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] transition-colors duration-150 sm:h-8 sm:w-8",
              active
                ? "bg-[var(--color-interaction-active)] text-[var(--color-text-primary)]"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            )}
          >
            <Icon size={14} strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
