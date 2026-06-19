"use client";

export function downloadTextFile(content: string, filename: string): void {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/markdown;charset=utf-8" })
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.dataset.downloadFallback = "true";
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
