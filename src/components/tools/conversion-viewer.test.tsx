import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));
vi.mock("@/components/tools/save-to-project-dialog", () => ({
  SaveToProjectDialog: () => null,
}));
vi.mock("@/components/chat/mermaid-block", () => ({
  MermaidBlock: ({ code }: { code: string }) => <div>{code}</div>,
}));

import { ConversionViewer } from "@/components/tools/conversion-viewer";

describe("ConversionViewer", () => {
  it("shows full Markdown and package actions without a copy action", () => {
    render(
      <ConversionViewer
        conversion={{
          id: "conversion-1",
          title: "电路原理",
          originalName: "电路原理.pdf",
          status: "completed",
          markdownContent: "# 题目\n\n![电路](pics/circuit.png)",
          assets: [{ id: "asset-1", relativePath: "pics/circuit.png" }],
          fileSize: 1024,
          pageCount: 10,
          metadata: null,
          createdAt: "2026-06-20T00:00:00.000Z",
          updatedAt: "2026-06-20T00:00:00.000Z",
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "题目" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "电路" })).toHaveAttribute(
      "src",
      "/api/tools/conversions/conversion-1/assets/asset-1"
    );
    expect(screen.getByRole("link", { name: /下载完整包/ })).toHaveAttribute(
      "href",
      "/api/tools/conversions/conversion-1/download"
    );
    expect(screen.getByRole("button", { name: /下载 \.md/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "复制" })).not.toBeInTheDocument();
  });
});
