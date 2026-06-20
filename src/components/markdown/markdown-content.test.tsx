import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/chat/mermaid-block", () => ({
  MermaidBlock: ({ code }: { code: string }) => <div data-testid="mermaid">{code}</div>,
}));

import { MarkdownContent } from "@/components/markdown/markdown-content";

describe("MarkdownContent", () => {
  it("uses the complete Markdown surface and resolves relative image URLs", () => {
    const { container } = render(
      <MarkdownContent
        content={[
          "# 电路题",
          "",
          "![串联电路](pics/circuit.png)",
          "",
          "| 元件 | 数值 |",
          "| --- | --- |",
          "| R | 10Ω |",
          "",
          "```mermaid",
          "graph LR; A-->B",
          "```",
        ].join("\n")}
        resolveImageUrl={(src) => `/assets/${src}`}
      />
    );

    expect(container.firstChild).toHaveClass("workbench-readable", "markdown-body");
    expect(screen.getByRole("heading", { name: "电路题" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "串联电路" })).toHaveAttribute(
      "src",
      "/assets/pics/circuit.png"
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByTestId("mermaid")).toHaveTextContent("graph LR; A-->B");
  });
});
