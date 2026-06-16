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

  useEffect(() => {
    if (isStreaming || !code.trim()) return;
    let cancelled = false;
    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "default" });
        const rendered = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(rendered.svg);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
          setSvg(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id, isStreaming]);

  if (isStreaming || failed || !svg) {
    return (
      <pre>
        <code className="language-mermaid">{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="mermaid overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
