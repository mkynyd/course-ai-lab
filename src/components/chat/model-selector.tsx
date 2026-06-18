"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModelSelectorProps {
  model: string;
  onChange: (model: string) => void;
  thinkingEnabled?: boolean;
  onThinkingEnabledChange?: (checked: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

const DEEPSEEK_PROFILES = [
  { value: "deepseek-v4-pro:thinking", model: "deepseek-v4-pro", thinking: true, label: "Pro · 思考" },
  { value: "deepseek-v4-pro:plain", model: "deepseek-v4-pro", thinking: false, label: "Pro · 普通" },
  { value: "deepseek-v4-flash:thinking", model: "deepseek-v4-flash", thinking: true, label: "Flash · 思考" },
  { value: "deepseek-v4-flash:plain", model: "deepseek-v4-flash", thinking: false, label: "Flash · 普通" },
] as const;

const MINIMAX_PROFILES = [
  { value: "minimax-m3:thinking", model: "minimax-m3", thinking: true, label: "M3 · 思考" },
  { value: "minimax-m3:plain", model: "minimax-m3", thinking: false, label: "M3 · 普通" },
] as const;

function providerFor(model: string) {
  return model === "minimax-m3" ? "minimax" : "deepseek";
}

function profileValue(model: string, thinkingEnabled = true) {
  const suffix = thinkingEnabled ? "thinking" : "plain";
  if (model === "minimax-m3") return `minimax-m3:${suffix}`;
  if (model === "deepseek-v4-flash") return `deepseek-v4-flash:${suffix}`;
  return `deepseek-v4-pro:${suffix}`;
}

export function ModelSelector({
  model,
  onChange,
  thinkingEnabled = true,
  onThinkingEnabledChange,
  disabled = false,
  compact = false,
  className,
}: ModelSelectorProps) {
  const provider = providerFor(model);
  const profiles = provider === "minimax" ? MINIMAX_PROFILES : DEEPSEEK_PROFILES;

  function handleProviderChange(nextProvider: string) {
    if (nextProvider === "minimax") {
      onChange("minimax-m3");
      return;
    }
    onChange(model === "deepseek-v4-flash" ? "deepseek-v4-flash" : "deepseek-v4-pro");
  }

  function handleProfileChange(value: string) {
    const next = [...DEEPSEEK_PROFILES, ...MINIMAX_PROFILES].find(
      (profile) => profile.value === value
    );
    if (!next) return;
    onChange(next.model);
    onThinkingEnabledChange?.(next.thinking);
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-[var(--radius-lg)] bg-[var(--color-panel-muted)] p-0.5",
        compact ? "max-w-[min(72vw,18rem)]" : "max-w-none",
        className
      )}
      aria-label="模型设置"
    >
      <Select
        value={provider}
        onValueChange={handleProviderChange}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          className="h-7 rounded-[var(--radius-md)] border-0 bg-transparent px-2 text-xs hover:bg-[var(--color-interaction-hover)] focus-visible:ring-0"
          aria-label="选择模型提供方"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>选择模型</SelectLabel>
            <SelectItem value="deepseek">DeepSeek</SelectItem>
            <SelectItem value="minimax">MiniMax</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={profileValue(model, thinkingEnabled)}
        onValueChange={handleProfileChange}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          className="h-7 rounded-[var(--radius-md)] border-0 bg-[var(--color-surface)] px-2 text-xs hover:bg-[var(--color-interaction-hover)] focus-visible:ring-0"
          aria-label="选择模型强度与思考模式"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>强度与思考</SelectLabel>
            {profiles.map((profile) => (
              <SelectItem key={profile.value} value={profile.value}>
                {profile.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
