import {
  prepare,
  layout,
  prepareWithSegments,
  layoutWithLines,
  measureLineStats,
  walkLineRanges,
  type PreparedText,
  type PreparedTextWithSegments,
  type LayoutLine,
  type LayoutLineRange,
} from "@chenglou/pretext";

/**
 * Pretext-based text measurement for light-ai-chat.
 *
 * This module provides deterministic, DOM-free text measurement. It is the
 * foundation for:
 *  - virtual message list height estimation (P0)
 *  - message bubble shrink-wrap width (P1)
 *  - textarea auto-grow (P1)
 *  - Canvas/SVG export text layout (P2)
 */

export interface TextLayoutOptions {
  /** Max width in CSS pixels. */
  maxWidth: number;
  /** Font size in CSS pixels. */
  fontSize: number;
  /** Line height in CSS pixels. */
  lineHeight: number;
  /** Font weight, e.g. 400, 500, 700. */
  fontWeight?: number | string;
  /**
   * A single font family name that Pretext will measure against.
   * For Chinese text use "Noto Sans SC"; for Latin text use "Figtree".
   * Do not pass a font stack here.
   */
  fontFamily: string;
  /** CSS letter-spacing in pixels. */
  letterSpacing?: number;
  whiteSpace?: "normal" | "pre-wrap";
  wordBreak?: "normal" | "keep-all";
}

export interface TextMetrics {
  height: number;
  lineCount: number;
}

export interface TextLinesMetrics extends TextMetrics {
  lines: LayoutLine[];
}

interface PreparedEntry {
  prepared: PreparedText;
  preparedWithSegments: PreparedTextWithSegments;
}

const preparedCache = new Map<string, PreparedEntry>();

function buildFontString(options: Pick<TextLayoutOptions, "fontWeight" | "fontSize" | "fontFamily">): string {
  const weight = options.fontWeight ?? 400;
  return `${weight} ${options.fontSize}px ${options.fontFamily}`;
}

function getCacheKey(text: string, options: TextLayoutOptions): string {
  return [
    text,
    buildFontString(options),
    options.letterSpacing ?? 0,
    options.whiteSpace ?? "normal",
    options.wordBreak ?? "normal",
  ].join("\0");
}

function getOrPrepare(text: string, options: TextLayoutOptions): PreparedEntry {
  const key = getCacheKey(text, options);
  let entry = preparedCache.get(key);
  if (!entry) {
    const font = buildFontString(options);
    const prepareOptions = {
      letterSpacing: options.letterSpacing,
      whiteSpace: options.whiteSpace,
      wordBreak: options.wordBreak,
    };
    entry = {
      prepared: prepare(text, font, prepareOptions),
      preparedWithSegments: prepareWithSegments(text, font, prepareOptions),
    };
    preparedCache.set(key, entry);
  }
  return entry;
}

/**
 * Measure text height and line count without touching the DOM.
 * Synchronous: make sure the requested font is already loaded before calling
 * (e.g. await loadFontForOptions(options) first).
 */
export function measureText(text: string, options: TextLayoutOptions): TextMetrics {
  const { prepared } = getOrPrepare(text, options);
  return layout(prepared, options.maxWidth, options.lineHeight);
}

/**
 * Measure text and return each laid-out line. Useful for Canvas/SVG rendering.
 */
export function measureTextLines(text: string, options: TextLayoutOptions): TextLinesMetrics {
  const { preparedWithSegments } = getOrPrepare(text, options);
  const { height, lineCount, lines } = layoutWithLines(
    preparedWithSegments,
    options.maxWidth,
    options.lineHeight
  );
  return { height, lineCount, lines };
}

/**
 * Return line count and max line width without allocating line strings.
 * Useful for binary-searching a nice container width (shrink-wrap).
 */
export function measureLineCountAndWidth(
  text: string,
  options: TextLayoutOptions
): { lineCount: number; maxLineWidth: number } {
  const { preparedWithSegments } = getOrPrepare(text, options);
  return measureLineStats(preparedWithSegments, options.maxWidth);
}

/**
 * Walk every line range for a given width without materializing strings.
 */
export function walkTextLineRanges(
  text: string,
  options: TextLayoutOptions,
  onLine: (line: LayoutLineRange) => void
): number {
  const { preparedWithSegments } = getOrPrepare(text, options);
  return walkLineRanges(preparedWithSegments, options.maxWidth, onLine);
}

/**
 * Ensure the font used by Pretext is loaded. Resolves once the browser has the
 * font available, so subsequent measureText calls match the real rendering.
 */
export async function loadFontForOptions(
  options: Pick<TextLayoutOptions, "fontWeight" | "fontSize" | "fontFamily">
): Promise<void> {
  if (typeof document === "undefined") return;
  const font = buildFontString(options);
  try {
    await document.fonts.load(font);
  } catch {
    // document.fonts.load may throw for malformed font strings; ignore.
  }
}

/**
 * Strip markdown syntax down to plain text so Pretext can measure the prose
 * body. Block elements (code blocks, Mermaid, math) should be measured
 * separately and added on top.
 *
 * This is intentionally lightweight: it removes inline markers so the word
 * count and approximate line breaks stay correct.
 */
export function extractPlainTextFromMarkdown(markdown: string): string {
  return (
    markdown
      // Remove code blocks (fenced and indented).
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      // Remove block/inline math.
      .replace(/\$\$[\s\S]*?\$\$/g, "")
      .replace(/\$([^$]+)\$/g, "$1")
      // Remove images and links, keep link text.
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      // Remove HTML tags.
      .replace(/<[^>]+>/g, "")
      // Remove heading/list/table markers.
      .replace(/^[\s]*[-*+][\s]+/gm, "")
      .replace(/^[\s]*\d+\.[\s]+/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\|/g, " ")
      // Collapse multiple spaces/newlines.
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Clear the internal prepared-text cache. Call when cycling many fonts or when
 * memory pressure is a concern.
 */
export function clearTextLayoutCache(): void {
  preparedCache.clear();
}
