"use client";

import { useState } from "react";
import { useChat } from "@/lib/hooks/use-chat";
import { useWebSearch } from "@/lib/hooks/use-web-search";
import type { FileAttachment } from "@/lib/chat/router";
import { ChatInput } from "@/components/chat/chat-input";
import { VirtualMessageList } from "@/components/chat/virtual-message-list";
import { TokenUsageBar } from "@/components/chat/token-usage-bar";
import { ContextRing } from "@/components/chat/context-ring";
import { CostDisplay } from "@/components/chat/cost-display";
import { AgentTimeline } from "@/components/chat/agent-timeline";
import { AmbientField } from "@/components/workbench/ambient-field";
import { AlertCircle, Hash } from "lucide-react";
import type { AgentEvent } from "@/lib/agent/types";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  initialConversationId?: string;
  initialMessages?: Array<{
    id: string;
    role: string;
    content: string;
    reasoningContent?: string | null;
    tokenCount?: number | null;
    cacheHitTokens?: number | null;
    cacheMissTokens?: number | null;
  }>;
}

export function ChatArea({
  initialConversationId,
  initialMessages,
}: ChatAreaProps) {
  const {
    messages,
    isStreaming,
    error,
    usage,
    model,
    reasoningEffort,
    setModel,
    setReasoningEffort,
    sendMessage,
    abort,
    clearError,
    agentTimeline,
    approveExecution,
    rejectExecution,
  } = useChat({
    initialConversationId,
    initialMessages: initialMessages?.map((m) => ({
      ...m,
      role: m.role as "user" | "assistant" | "system",
    })),
  });
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const { webSearchActive, toggle: toggleWebSearch } = useWebSearch();

  // Render the most recent awaiting/executing entry as a visible approval card.
  // Completed/failed entries briefly remain visible, then are replaced by the next.
  const visibleAgentEntries = Object.values(agentTimeline)
    .filter((entry) => entry.latestEvent.type !== "approval_granted")
    .sort((a, b) => {
      const order: Record<AgentEvent["type"], number> = {
        approval_required: 0,
        tool_started: 1,
        tool_proposed: 2,
        tool_progress: 3,
        tool_completed: 4,
        tool_failed: 5,
        tool_blocked: 6,
        approval_granted: 7,
        approval_denied: 8,
        approval_expired: 9,
        skill_activated: 10,
        skill_deactivated: 11,
      };
      return order[a.latestEvent.type] - order[b.latestEvent.type];
    })
    .slice(-3);

  // 计算 Token 总数
  const totalTokens = messages.reduce(
    (sum, m) => sum + (m.tokenCount || 0),
    0
  );
  const totalInputTokens =
    usage?.promptTokens || Math.round(totalTokens * 0.4);
  const totalOutputTokens =
    usage?.completionTokens || Math.round(totalTokens * 0.6);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      {/* 顶部模型切换栏 */}
      <div
        className={cn(
          "flex min-h-14 items-center justify-between gap-3 px-4 py-2",
          "border-b border-[var(--color-border-light)]",
          "bg-[var(--color-panel)] shrink-0 backdrop-blur-[var(--glass-blur)]"
        )}
      >
        <div className="text-xs font-medium text-[var(--color-text-tertiary)]">
          聊天
        </div>

        {usage && (
          <div className="hidden md:flex items-center gap-4">
            <ContextRing used={usage.totalTokens} />
            <CostDisplay
              inputTokens={totalInputTokens}
              outputTokens={totalOutputTokens}
              cacheHitTokens={usage.cacheHitTokens}
              cacheMissTokens={usage.cacheMissTokens}
              model={model as "deepseek-v4-pro" | "deepseek-v4-flash"}
            />
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 mx-4 mt-2 rounded-[var(--radius-md)]",
            "bg-[var(--color-error-muted)]",
            "text-sm text-[var(--color-error)]"
          )}
        >
          <AlertCircle size={14} strokeWidth={2} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={clearError}
            className="text-xs underline hover:no-underline"
          >
            关闭
          </button>
        </div>
      )}

      {/* 消息列表 */}
      {messages.length === 0 ? (
        <div className="relative flex-1 overflow-y-auto">
          <AmbientField density="wide" className="opacity-75" />
          <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
            <div
              data-dot-avoid
              className={cn(
                "mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)]",
                "bg-[var(--color-panel)]"
              )}
            >
              <Hash size={24} strokeWidth={1.5} className="text-[var(--color-text-tertiary)]" />
            </div>
            <h2 data-dot-avoid className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
              开始对话
            </h2>
            <p data-dot-avoid className="max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)]">
              选择强度和模型，然后发送消息即可开始对话。
            </p>
          </div>
        </div>
      ) : (
        <VirtualMessageList messages={messages} />
      )}

      {/* Token 用量条（移动端底部显示） */}
      {usage && (
        <div className="px-4 py-1.5 border-t border-[var(--color-border-light)] md:hidden">
          <TokenUsageBar
            used={usage.totalTokens}
            cacheHit={usage.cacheHitTokens}
          />
        </div>
      )}

      {/* Agent timeline：当前未完成 / 最近 3 条工具调用 */}
      {visibleAgentEntries.length > 0 && (
        <div className="px-4 pt-2 pb-1 space-y-1.5 max-h-72 overflow-y-auto">
          {visibleAgentEntries.map((entry) => {
            const event = entry.latestEvent;
            if (event.type === "approval_required") {
              return (
                <AgentTimeline
                  key={entry.executionId}
                  state={{
                    kind: "awaiting_user",
                    executionId: entry.executionId,
                    preview: event.preview,
                    token: entry.approvalToken ?? "",
                    expiresAt: entry.approvalExpiresAt ?? 0,
                    canApproveSession: event.preview.isReversible,
                  }}
                  onApprove={async (executionId, token, scope) => {
                    await approveExecution(executionId, token, scope);
                  }}
                  onDeny={async (executionId) => {
                    await rejectExecution(executionId);
                  }}
                />
              );
            }
            if (event.type === "tool_proposed") {
              return (
                <AgentTimeline
                  key={entry.executionId}
                  state={{
                    kind: "proposed",
                    executionId: entry.executionId,
                    preview: event.preview,
                  }}
                />
              );
            }
            if (event.type === "tool_started") {
              return (
                <AgentTimeline
                  key={entry.executionId}
                  state={{
                    kind: "executing",
                    executionId: entry.executionId,
                  }}
                />
              );
            }
            if (event.type === "tool_completed") {
              return (
                <AgentTimeline
                  key={entry.executionId}
                  state={{
                    kind: "completed",
                    executionId: entry.executionId,
                    resultSummary: event.resultSummary,
                  }}
                />
              );
            }
            if (event.type === "tool_failed") {
              return (
                <AgentTimeline
                  key={entry.executionId}
                  state={{
                    kind: "failed",
                    executionId: entry.executionId,
                    error: event.error,
                  }}
                />
              );
            }
            if (event.type === "tool_blocked") {
              return (
                <AgentTimeline
                  key={entry.executionId}
                  state={{
                    kind: "failed",
                    executionId: entry.executionId,
                    error: event.reason,
                  }}
                />
              );
            }
            if (event.type === "approval_denied" || event.type === "approval_expired") {
              return (
                <AgentTimeline
                  key={entry.executionId}
                  state={{
                    kind: "denied",
                    executionId: entry.executionId,
                    reason:
                      event.type === "approval_expired"
                        ? "审批已过期"
                        : "用户拒绝",
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* 输入框 */}
      <ChatInput
        onSend={(content, files) =>
          void sendMessage({ content, attachments: files, webSearchActive })
        }
        onStop={abort}
        isStreaming={isStreaming}
        attachments={attachments}
        onAttachmentsChange={setAttachments}
        model={model}
        onModelChange={setModel}
        reasoningEffort={reasoningEffort}
        onReasoningEffortChange={setReasoningEffort}
        webSearchActive={webSearchActive}
        onWebSearchToggle={toggleWebSearch}
      />
    </div>
  );
}
