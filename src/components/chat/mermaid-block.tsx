"use client";

import { useEffect, useId, useState } from "react";

interface MermaidBlockProps {
  code: string;
  isStreaming?: boolean;
}

export function MermaidBlock({ code, isStreaming = false }: MermaidBlockProps) {
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isStreaming || !code.trim()) return;
    let cancelled = false;
    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          suppressErrorRendering: true,
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

  if (isStreaming) {
    return (
      <pre>
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
    <div
      className="mermaid overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
