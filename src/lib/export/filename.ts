export function safeExportFilename(title: string, extension: string): string {
  const safe = title
    .normalize("NFKC")
    .replace(/[\r\n"\\/<>:*?|]+/g, "-")
    .replace(/^\.+/g, "")
    .replace(/\.+$/g, "")
    .trim()
    .slice(0, 80);
  return `${safe || "artifact"}.${extension}`;
}
