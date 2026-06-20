import crypto from "crypto";
import path from "path";
import AdmZip from "adm-zip";

export interface ParsedImageAsset {
  relativePath: string;
  mimeType: string;
  buffer: Buffer;
}

export interface ParsedMinerUResult {
  content: string;
  assets: ParsedImageAsset[];
}

const IMAGE_MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
};

function isExternalReference(value: string) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value);
}

function decodeReference(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function safeInternalPath(markdownDir: string, reference: string) {
  const withoutQuery = reference.split(/[?#]/, 1)[0];
  const decoded = decodeReference(withoutQuery).replace(/\\/g, "/");
  if (!decoded || decoded.startsWith("/") || /^[a-z]:\//i.test(decoded)) {
    throw new Error(`MinerU 图片路径无效：${reference}`);
  }
  const resolved = path.posix.normalize(path.posix.join(markdownDir, decoded));
  if (resolved === ".." || resolved.startsWith("../")) {
    throw new Error(`MinerU 图片路径无效：${reference}`);
  }
  return resolved;
}

function sanitizedBasename(entryName: string) {
  const basename = path.posix.basename(entryName).normalize("NFC");
  const extension = path.posix.extname(basename).toLowerCase();
  const stem = basename.slice(0, basename.length - extension.length);
  const safeStem =
    stem
      .replace(/[^\p{L}\p{N}._-]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "image";
  return `${safeStem}${extension}`;
}

function mimeTypeOf(entryName: string) {
  const extension = path.posix.extname(entryName).slice(1).toLowerCase();
  const mimeType = IMAGE_MIME_TYPES[extension];
  if (!mimeType) {
    throw new Error(`MinerU 图片格式不受支持：${entryName}`);
  }
  return mimeType;
}

export function extractMinerUResult(zipBuffer: Buffer): ParsedMinerUResult {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const markdownEntry =
    entries.find((entry) => entry.entryName.endsWith("/full.md")) ||
    entries.find((entry) => entry.entryName === "full.md") ||
    entries.find((entry) => entry.entryName.toLowerCase().endsWith(".md"));

  if (!markdownEntry) {
    throw new Error(
      `MinerU 结果中未找到 Markdown 内容：${entries.map((entry) => entry.entryName).join(", ")}`
    );
  }

  const markdownDir = path.posix.dirname(markdownEntry.entryName);
  const entryMap = new Map(
    entries
      .filter((entry) => !entry.isDirectory)
      .map((entry) => [path.posix.normalize(entry.entryName), entry] as const)
  );
  const assetsByEntry = new Map<string, ParsedImageAsset>();
  const usedNames = new Set<string>();

  function archiveReference(rawReference: string) {
    const reference = rawReference.trim().replace(/^<|>$/g, "");
    if (!reference || isExternalReference(reference)) return rawReference;

    const entryName = safeInternalPath(markdownDir, reference);
    const existing = assetsByEntry.get(entryName);
    if (existing) return existing.relativePath;

    const entry = entryMap.get(entryName);
    if (!entry) {
      throw new Error(`MinerU 结果缺少图片：${reference}`);
    }

    const basename = sanitizedBasename(entryName);
    const extension = path.posix.extname(basename);
    const stem = basename.slice(0, basename.length - extension.length);
    let outputName = basename;
    if (usedNames.has(outputName)) {
      const suffix = crypto.createHash("sha256").update(entryName).digest("hex").slice(0, 8);
      outputName = `${stem}-${suffix}${extension}`;
    }
    usedNames.add(outputName);

    const asset = {
      relativePath: `pics/${outputName}`,
      mimeType: mimeTypeOf(entryName),
      buffer: entry.getData(),
    };
    assetsByEntry.set(entryName, asset);
    return asset.relativePath;
  }

  let content = markdownEntry.getData().toString("utf-8").trim();
  content = content.replace(
    /(!\[[^\]]*]\(\s*)(<?)([^)\s>]+)(>?)([^)]*\))/g,
    (_match, prefix: string, _open: string, reference: string, _close: string, suffix: string) =>
      `${prefix}${archiveReference(reference)}${suffix}`
  );
  content = content.replace(
    /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
    (_match, prefix: string, reference: string, suffix: string) =>
      `${prefix}${archiveReference(reference)}${suffix}`
  );

  return { content, assets: [...assetsByEntry.values()] };
}
