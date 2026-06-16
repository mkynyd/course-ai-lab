"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Download } from "lucide-react";

interface MermaidBlockProps {
  code: string;
  isStreaming?: boolean;
}

const MERMAID_THEME = {
  theme: "base" as const,
  themeVariables: {
    primaryColor: "#FFFFFF",
    primaryBorderColor: "#3B82F6",
    primaryTextColor: "#1E293B",
    lineColor: "#64748B",
    secondaryColor: "#FFFFFF",
    tertiaryColor: "#FFFFFF",
    noteBkgColor: "#FFFFFF",
    noteBorderColor: "#F59E0B",
    noteTextColor: "#1E293B",
  },
};

export function MermaidBlock({ code, isStreaming = false }: MermaidBlockProps) {
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming || !code.trim()) return;
    let cancelled = false;
    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          suppressErrorRendering: true,
          ...MERMAID_THEME,
        });
        const { svg: renderedSvg } = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(renderedSvg);
          setFailed(false);
          setErrorMsg("");
        }
      } catch (err) {
        if (!cancelled) {
          setFailed(true);
          setSvg(null);
          setErrorMsg(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id, isStreaming]);

  function downloadPNG() {
    if (!svg) return;
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `mermaid-${id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }, "image/png");
    };
    img.src = url;
  }

  function downloadSVG() {
    if (!svg) return;
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mermaid-${id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (isStreaming) {
    return (
      <pre className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs">
        <code className="language-mermaid">{code}</code>
      </pre>
    );
  }

  if (failed || !svg) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <pre className="overflow-x-auto text-xs">
          <code className="language-mermaid">{code}</code>
        </pre>
        {errorMsg && (
          <p className="mt-2 text-xs text-[var(--color-error)]">
            Mermaid 渲染失败：{errorMsg}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="group relative">
      <div
        ref={containerRef}
        className="mermaid overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={downloadPNG}
          className="flex items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs shadow-sm hover:bg-[var(--color-surface-hover)]"
          title="下载 PNG（2x 分辨率）"
        >
          <Download size={12} />
          PNG
        </button>
        <button
          type="button"
          onClick={downloadSVG}
          className="flex items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs shadow-sm hover:bg-[var(--color-surface-hover)]"
          title="下载 SVG（矢量）"
        >
          <Download size={12} />
          SVG
        </button>
      </div>
    </div>
  );
}
