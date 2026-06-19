import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "@/lib/browser/copy-text";

describe("copyText", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll("textarea[data-copy-fallback]").forEach((node) =>
      node.remove()
    );
  });

  it("falls back to a temporary textarea when Clipboard API access is denied", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });

    await expect(copyText("# Lecture")).resolves.toBeUndefined();

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea[data-copy-fallback]")).toBeNull();
  });
});
