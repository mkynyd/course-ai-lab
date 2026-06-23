"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Globe, Paperclip, Send, Sparkles, User, X } from "lucide-react";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ModelSelector } from "@/components/chat/model-selector";
import { cn } from "@/lib/utils";
import { MOCK_CHAT_MESSAGES, type MockChatMessage } from "@/lib/mock/landing-fixtures";

/**
 * 缩放版聊天演示。纯 mock 数据驱动，不接 API / SSE。
 * 输入框结构与 /chat 工作台真实 ChatInput 保持一致：textarea + 工具行；
 * ModelSelector 直接复用真实组件，确保下拉菜单视觉与 /chat 一致。
 */
export function ChatDemo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface)]",
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border-light)] bg-[var(--color-panel)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--color-success)]" aria-hidden />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">光电效应实验复盘</span>
        </div>
        <span className="text-[11px] text-[var(--color-text-tertiary)]">在线 · 深度</span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-hidden bg-[var(--color-bg)] px-3 py-4 sm:px-4">
        {MOCK_CHAT_MESSAGES.map((message) => (
          <MockBubble key={message.id} message={message} />
        ))}
      </div>

      <ChatDemoInputDock />
    </div>
  );
}

function MockBubble({ message }: { message: MockChatMessage }) {
  const isUser = message.role === "user";
  const [reasoningOpen, setReasoningOpen] = useState(false);

  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
          isUser
            ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
            : "bg-[var(--color-panel-muted)] text-[var(--color-text-secondary)]"
        )}
      >
        {isUser ? <User size={12} /> : <Sparkles size={12} />}
      </div>

      <div className={cn("min-w-0 flex-1", isUser && "flex flex-col items-end")}>
        {message.reasoningContent && (
          <Collapsible
            open={reasoningOpen}
            onOpenChange={setReasoningOpen}
            className="mb-1.5 w-full max-w-[74ch]"
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[var(--radius-md)] px-1.5 py-1 text-[11px] text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-secondary)]"
                aria-expanded={reasoningOpen}
              >
                {reasoningOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                思考过程
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="mt-1 max-w-[74ch] rounded-[var(--radius-md)] bg-[var(--color-panel-muted)] px-3 py-2 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                {message.reasoningContent}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div
          className={cn(
            "max-w-[85%] rounded-[var(--radius-lg)] px-3 py-2 text-[13px] leading-relaxed",
            isUser
              ? "bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]"
              : "bg-transparent pl-0"
          )}
        >
          {isUser ? (
            message.content
          ) : (
            <div className="text-[var(--color-text-primary)]">
              <MarkdownContent content={message.content} imageLoading="lazy" />
            </div>
          )}
        </div>

        <div className="mt-1 px-1 text-[10px] tabular-nums text-[var(--color-text-tertiary)]">
          {message.tokenCount} tokens
        </div>
      </div>
    </div>
  );
}

/**
 * 视觉上与 /chat 工作台的 ChatInput 保持一致：
 *  - 外层圆角面板
 *  - 顶部 textarea（单行 min-h-9）
 *  - 底部工具行：[Paperclip] [ModelSelector（真实组件）] [Globe] [Send]
 *  - 底栏挂载/关闭提示
 * 输入框与按钮全部 disabled，纯展示。
 */
function ChatDemoInputDock() {
  return (
    <div className="shrink-0 border-t border-[var(--color-border-light)] bg-[var(--color-panel)] p-3">
      <div className="rounded-[calc(var(--radius-xl)+10px)] bg-[var(--color-surface)] p-2">
        <div className="min-h-9 px-2 py-2 text-[13px] leading-snug text-[var(--color-text-tertiary)]">
          向 LumenLab 提问，支持附件、引用资料…
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              disabled
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--color-text-tertiary)] disabled:opacity-60"
              aria-label="添加附件"
            >
              <Paperclip size={17} strokeWidth={2} />
            </button>
            <ModelSelector
              model="deepseek-v4-pro"
              onChange={() => {}}
              reasoningEffort="max"
              onReasoningEffortChange={() => {}}
              compact
            />
            <button
              type="button"
              disabled
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--color-text-tertiary)] disabled:opacity-60"
              aria-label="联网搜索"
            >
              <Globe size={17} strokeWidth={2} />
            </button>
          </div>
          <button
            type="button"
            disabled
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-contrast)] disabled:opacity-60"
            aria-label="发送消息"
          >
            <Send size={17} strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)]">
        <span className="inline-flex items-center gap-1">
          <FileText size={10} />
          1 资料已挂载
        </span>
        <span className="inline-flex items-center gap-1">
          <X size={10} />
          可在 /chat 关闭
        </span>
      </div>
    </div>
  );
}