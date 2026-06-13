"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Download, Eye, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArtifactSummary {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  conversationId?: string | null;
}

interface ArtifactDetail extends ArtifactSummary {
  content: string;
}

export function ArtifactLibrary({
  projectId,
  refreshKey,
  onClose,
}: {
  projectId: string;
  refreshKey: number;
  onClose: () => void;
}) {
  const [artifacts, setArtifacts] = useState<ArtifactSummary[]>([]);
  const [selected, setSelected] = useState<ArtifactDetail | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/projects/${projectId}/artifacts`);
    if (response.ok) {
      const data = await response.json();
      setArtifacts(data.artifacts);
    }
  }, [projectId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load, refreshKey]);

  async function view(id: string) {
    const response = await fetch(`/api/artifacts/${id}`);
    if (response.ok) {
      const data = await response.json();
      setSelected(data.artifact);
    }
  }

  async function remove(id: string) {
    if (!confirm("确定删除这个成果吗？")) return;
    const response = await fetch(`/api/artifacts/${id}`, { method: "DELETE" });
    if (response.ok) {
      if (selected?.id === id) setSelected(null);
      await load();
    }
  }

  async function copy(content: string) {
    await navigator.clipboard.writeText(content);
    setMessage("Markdown 已复制");
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">成果库</h2>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">Markdown 为唯一内容源</p>
          </div>
          <button onClick={onClose} aria-label="关闭成果库"><X size={16} /></button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[240px_1fr]">
          <div className="overflow-y-auto border-r border-[var(--color-border)] p-2">
            {artifacts.length === 0 ? (
              <p className="p-3 text-xs text-[var(--color-text-tertiary)]">暂无成果</p>
            ) : artifacts.map((artifact) => (
              <div key={artifact.id} className="mb-1 rounded border border-[var(--color-border-light)] p-2">
                <p className="truncate text-xs font-medium">{artifact.title}</p>
                <p className="text-[10px] text-[var(--color-text-tertiary)]">{artifact.type} · {new Date(artifact.createdAt).toLocaleDateString("zh-CN")}</p>
                <div className="mt-1 flex gap-1">
                  <button onClick={() => view(artifact.id)} aria-label="查看成果"><Eye size={12} /></button>
                  <a href={`/api/artifacts/${artifact.id}/export?format=markdown`} aria-label="导出 Markdown"><Download size={12} /></a>
                  <button onClick={() => remove(artifact.id)} aria-label="删除成果"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="min-w-0 overflow-y-auto p-4">
            {selected ? (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="mr-auto text-sm font-semibold">{selected.title}</h3>
                  <Button variant="ghost" size="sm" onClick={() => copy(selected.content)}><Copy size={12} />复制</Button>
                  {(["markdown", "docx", "pdf"] as const).map((format) => (
                    <a key={format} href={`/api/artifacts/${selected.id}/export?format=${format}`}>
                      <Button variant="ghost" size="sm">{format === "markdown" ? "MD" : format.toUpperCase()}</Button>
                    </a>
                  ))}
                </div>
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">{selected.content}</pre>
              </>
            ) : (
              <p className="text-sm text-[var(--color-text-tertiary)]">选择一个成果查看内容和导出选项</p>
            )}
          </div>
        </div>
        {message && <div className="border-t border-[var(--color-border)] px-4 py-2 text-xs">{message}</div>}
      </div>
    </div>
  );
}
