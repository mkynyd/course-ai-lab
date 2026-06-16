import type { DeepSeekMessage } from "@/lib/deepseek";

export function filterThinkingForMiniMax(messages: DeepSeekMessage[]): DeepSeekMessage[] {
  return messages.map((message) => {
    if (message.role === "assistant" && message.reasoning_content) {
      const rest = { ...message };
      delete rest.reasoning_content;
      return rest;
    }
    return message;
  });
}
