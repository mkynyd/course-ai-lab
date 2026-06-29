import type { TaskProfile } from "./skill-router";
import { isSafePublicHttpUrl } from "@/lib/tools/web/fetch";
import {
  aggregateSources,
  extractSourcesFromToolResult,
  type AgentSource,
} from "./sources";

export type { TaskProfile };

export type ToolLoopStopReason =
  | "round_limit"
  | "duplicate_tool_call"
  | "no_progress";

export interface ToolLoopRecord {
  toolId: string;
  args: Record<string, unknown>;
  producedNewContent: boolean;
}

export interface PlannedToolCall {
  id: string;
  name: "project_files.list" | "project_files.read" | "project_rag.search" | "web.fetch" | "artifact.save";
  input: Record<string, unknown>;
}

export interface ToolPlanningInput {
  prompt: string;
  profile: TaskProfile;
  projectId?: string | null;
  selectedFileIds?: string[];
  webAccessRecommended?: boolean;
}

export type PlannedToolRunResult =
  | { status: "succeeded"; summary: Record<string, unknown> }
  | { status: "failed"; error: string; summary?: Record<string, unknown> };

export interface ExecutePlannedToolCallsInput {
  profile: TaskProfile;
  plannedCalls: PlannedToolCall[];
  runTool: (call: PlannedToolCall) => Promise<PlannedToolRunResult>;
}

export interface ExecutePlannedToolCallsResult {
  contextMessage: string;
  sources: AgentSource[];
  results: Array<{
    call: PlannedToolCall;
    status: "succeeded" | "failed";
    summary?: Record<string, unknown>;
    error?: string;
  }>;
  stopReason: ToolLoopStopReason | null;
}

export interface ToolLoopState {
  profile: TaskProfile;
  round: number;
  history: ToolLoopRecord[];
}

const TOOL_ROUND_LIMITS: Record<TaskProfile, number> = {
  simple: 2,
  rag: 4,
  research: 6,
  workflow: 10,
};

export function getToolRoundLimit(profile: TaskProfile): number {
  return TOOL_ROUND_LIMITS[profile];
}

function extractPublicUrls(text: string) {
  const matches = text.match(/https?:\/\/[^\s<>"')\]}，。；、]+/g) ?? [];
  return [...new Set(matches.map((url) => url.replace(/[),.;!?]+$/, "")))]
    .filter(isSafePublicHttpUrl)
    .slice(0, 3);
}

export function buildPlannedToolCalls(input: ToolPlanningInput): PlannedToolCall[] {
  const calls: PlannedToolCall[] = [];
  const urls = extractPublicUrls(input.prompt);
  urls.forEach((url, index) => {
    calls.push({
      id: `planned-web-fetch-${index + 1}`,
      name: "web.fetch",
      input: { url },
    });
  });

  if (input.projectId && input.selectedFileIds?.length) {
    [...new Set(input.selectedFileIds)].slice(0, 5).forEach((fileId, index) => {
      calls.push({
        id: `planned-project-file-read-${index + 1}`,
        name: "project_files.read",
        input: {
          projectId: input.projectId,
          fileId,
          maxChars: 12000,
        },
      });
    });
    return calls;
  }

  if (input.projectId && input.profile !== "simple") {
    calls.push({
      id: "planned-project-rag-search-1",
      name: "project_rag.search",
      input: {
        projectId: input.projectId,
        query: input.prompt,
        maxResults: 5,
      },
    });
  }

  return calls;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function toolCallKey(record: ToolLoopRecord) {
  return `${record.toolId}:${stableStringify(record.args)}`;
}

function hasDuplicateToolCall(history: ToolLoopRecord[]) {
  const seen = new Set<string>();
  for (const item of history) {
    const key = toolCallKey(item);
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function hasConsecutiveNoProgress(history: ToolLoopRecord[]) {
  if (history.length < 2) return false;
  return history.slice(-2).every((item) => !item.producedNewContent);
}

export function shouldStopToolLoop(
  state: ToolLoopState
): { stop: true; reason: ToolLoopStopReason } | { stop: false } {
  if (state.round >= getToolRoundLimit(state.profile)) {
    return { stop: true, reason: "round_limit" };
  }
  if (hasDuplicateToolCall(state.history)) {
    return { stop: true, reason: "duplicate_tool_call" };
  }
  if (hasConsecutiveNoProgress(state.history)) {
    return { stop: true, reason: "no_progress" };
  }
  return { stop: false };
}

export function toolResultProducedNewContent(result: Record<string, unknown>): boolean {
  if (typeof result.error === "string") return false;
  if (Array.isArray(result.hits)) return result.hits.length > 0;
  if (Array.isArray(result.files)) return result.files.length > 0;
  if (typeof result.text === "string") return result.text.trim().length > 0;
  if (typeof result.markdown === "string") return result.markdown.trim().length > 0;
  if (typeof result.body === "string") return result.body.trim().length > 0;
  if (typeof result.id === "string") return true;
  return Object.keys(result).length > 0;
}

function summarizeToolResult(call: PlannedToolCall, result: Record<string, unknown>) {
  const compact = JSON.stringify(result, null, 2);
  return `## ${call.name}\n\n参数：${JSON.stringify(call.input)}\n\n结果：\n${compact.slice(0, 16000)}`;
}

export async function executePlannedToolCalls(
  input: ExecutePlannedToolCallsInput
): Promise<ExecutePlannedToolCallsResult> {
  const results: ExecutePlannedToolCallsResult["results"] = [];
  const sources: AgentSource[] = [];
  const history: ToolLoopRecord[] = [];
  let stopReason: ToolLoopStopReason | null = null;

  for (let index = 0; index < input.plannedCalls.length; index += 1) {
    const stop = shouldStopToolLoop({
      profile: input.profile,
      round: index,
      history,
    });
    if (stop.stop) {
      stopReason = stop.reason;
      break;
    }

    const call = input.plannedCalls[index];
    const executed = await input.runTool(call);
    if (executed.status === "succeeded") {
      results.push({ call, status: "succeeded", summary: executed.summary });
      sources.push(...extractSourcesFromToolResult(call.name, executed.summary));
      history.push({
        toolId: call.name,
        args: call.input,
        producedNewContent: toolResultProducedNewContent(executed.summary),
      });
    } else {
      results.push({
        call,
        status: "failed",
        summary: executed.summary,
        error: executed.error,
      });
      history.push({
        toolId: call.name,
        args: call.input,
        producedNewContent: false,
      });
    }
  }

  const contextSections = results
    .filter((item) => item.status === "succeeded" && item.summary)
    .map((item) => summarizeToolResult(item.call, item.summary ?? {}));
  const contextMessage = contextSections.length
    ? `# Agent 工具结果\n\n${contextSections.join("\n\n")}\n\n请基于这些工具结果回答用户问题。正文不要插入引用标记；来源会在回答底部单独展示。`
    : "";

  return {
    contextMessage,
    sources: aggregateSources(sources),
    results,
    stopReason,
  };
}
