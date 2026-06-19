import { describe, expect, it } from "vitest";
import {
  PENDING_ASSISTANT_RECOVERY_WINDOW_MS,
  toChatMessages,
} from "./project-conversation-state";

const nowMs = Date.parse("2026-06-19T01:00:00.000Z");

describe("project conversation state", () => {
  it("marks recent empty assistant placeholders as background streaming", () => {
    const messages = toChatMessages(
      [
        {
          id: "user-1",
          role: "user",
          content: "生成 Mermaid 逻辑图",
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "",
          reasoningContent: null,
          tokenCount: null,
          createdAt: new Date(nowMs - 30_000).toISOString(),
        },
      ],
      nowMs
    );

    expect(messages[1]).toMatchObject({
      isStreaming: true,
      streamingSource: "background",
    });
  });

  it("does not keep polling stale empty assistant placeholders", () => {
    const messages = toChatMessages(
      [
        {
          id: "user-1",
          role: "user",
          content: "生成 Mermaid 逻辑图",
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "",
          reasoningContent: null,
          tokenCount: null,
          createdAt: new Date(
            nowMs - PENDING_ASSISTANT_RECOVERY_WINDOW_MS - 1
          ).toISOString(),
        },
      ],
      nowMs
    );

    expect(messages.some((message) => message.isStreaming)).toBe(false);
  });

  it("does not infer pending generation from user-only conversations", () => {
    const messages = toChatMessages(
      [
        {
          id: "user-1",
          role: "user",
          content: "生成 Mermaid 逻辑图",
          createdAt: new Date(nowMs - 30_000).toISOString(),
        },
      ],
      nowMs
    );

    expect(messages).toHaveLength(1);
    expect(messages[0].isStreaming).toBeUndefined();
  });
});
