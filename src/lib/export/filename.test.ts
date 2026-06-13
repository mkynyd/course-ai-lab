import { describe, expect, it } from "vitest";
import { safeExportFilename } from "@/lib/export/filename";

describe("safeExportFilename", () => {
  it("removes path and response header characters", () => {
    expect(safeExportFilename('../报告\\实验"\r\n', "pdf")).toBe(
      "-报告-实验-.pdf"
    );
  });
});
