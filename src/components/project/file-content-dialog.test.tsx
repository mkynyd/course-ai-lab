import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileContentDialog } from "@/components/project/file-content-dialog";

describe("FileContentDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders saved Markdown with project-owned image resources", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          file: {
            id: "file-1",
            originalName: "lecture.md",
            filename: "lecture.md",
            mimeType: "text/markdown",
            size: 20,
            status: "parsed",
            createdAt: "2026-06-20T00:00:00.000Z",
            textContent: "# 题目\n\n![电路](pics/circuit.png)",
            resources: [
              { id: "resource-1", relativePath: "pics/circuit.png" },
            ],
          },
        })
      )
    );

    render(
      <FileContentDialog
        file={{
          id: "file-1",
          originalName: "lecture.md",
          filename: "lecture.md",
          mimeType: "text/markdown",
          size: 20,
          status: "parsed",
          createdAt: "2026-06-20T00:00:00.000Z",
        }}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
      />
    );

    expect(await screen.findByRole("heading", { name: "题目" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "电路" })).toHaveAttribute(
      "src",
      "/api/files/file-1/resources/resource-1"
    );
  });
});
