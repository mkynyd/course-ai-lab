import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadTextFile } from "@/lib/browser/download-text-file";

describe("downloadTextFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll("a[data-download-fallback]").forEach((node) =>
      node.remove()
    );
  });

  it("clicks a temporary download link and removes it", () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    downloadTextFile("# Lecture", "lecture.md");

    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector("a[data-download-fallback]")).toBeNull();
    expect(revoke).toHaveBeenCalledWith("blob:preview");
  });
});
