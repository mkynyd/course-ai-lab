import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/hooks/use-conversions", () => ({
  useConversions: () => ({ data: [], isPending: false }),
}));
vi.mock("@/components/tools/save-to-project-dialog", () => ({
  SaveToProjectDialog: () => null,
}));
vi.mock("@/components/markdown/markdown-content", () => ({
  MarkdownContent: ({ content }: { content: string }) => <div>{content}</div>,
}));

import { PdfConvertClient } from "@/components/tools/pdf-convert-client";

function renderClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PdfConvertClient conversions={[]} />
    </QueryClientProvider>
  );
}

describe("PdfConvertClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `data: ${JSON.stringify({
            stage: "done",
            content: "# 转换完成",
            conversionId: "conversion-1",
            fileName: "扫描文稿.md",
            assets: [],
          })}\n\n`,
          { status: 200, headers: { "Content-Type": "text/event-stream" } }
        )
      )
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("marks the fourth step complete, then dismisses the finished progress", async () => {
    const { container } = renderClient();
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    await act(async () => {
      fireEvent.change(input!, {
        target: {
          files: [new File(["pdf"], "扫描文稿.pdf", { type: "application/pdf" })],
        },
      });
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "转换结果" })).toBeInTheDocument();
    expect(screen.getByLabelText("完成步骤已完成")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "转换进度" })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1_600));

    expect(screen.queryByRole("region", { name: "转换进度" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "转换结果" })).toBeInTheDocument();
  });
});
