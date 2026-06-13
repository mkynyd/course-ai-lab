"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectFile } from "@/components/project/file-list";

interface FileDetail extends ProjectFile {
  textContent?: string | null;
  enhancedContent?: string | null;
}

export function FileContentDialog({
  file,
  onClose,
  onUpdated,
}: {
  file: ProjectFile;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [detail, setDetail] = useState<FileDetail | null>(null);
  const [tab, setTab] = useState<"ocr" | "enhanced">("ocr");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/files/${file.id}`)
      .then((response) => response.json())
      .then((data) => {
        setDetail(data.file);
        setDraft(data.file?.textContent || "");
      })
      .catch(() => setMessage("无法加载解析内容"));
  }, [file.id]);

  async function save() {
    const response = await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textContent: draft }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(typeof data.error === "string" ? data.error : "保存失败");
      return;
    }
    setDetail((current) =>
      current ? { ...current, textContent: draft, enhancementStatus: data.enhancementStatus } : current
    );
    setEditing(false);
    setMessage("OCR 原文已保存，检索分块已更新");
    onUpdated();
  }

  const content = tab === "ocr" ? detail?.textContent : detail?.enhancedContent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">{file.originalName}</h2>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              OCR 原文可编辑；修改后已有增强结果会标记为过期
            </p>
          </div>
          <button onClick={onClose} aria-label="关闭"><X size={16} /></button>
        </div>
        <div className="flex gap-2 border-b border-[var(--color-border-light)] px-4 py-2">
          <Button variant={tab === "ocr" ? "primary" : "ghost"} size="sm" onClick={() => setTab("ocr")}>OCR 原文</Button>
          <Button variant={tab === "enhanced" ? "primary" : "ghost"} size="sm" onClick={() => setTab("enhanced")}>增强结果</Button>
          {tab === "ocr" && detail?.textContent && (
            <Button variant="ghost" size="sm" onClick={() => setEditing((value) => !value)}>
              {editing ? "取消编辑" : "编辑原文"}
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-auto p-4">
          {!detail ? (
            <p className="text-sm text-[var(--color-text-secondary)]">加载中...</p>
          ) : editing && tab === "ocr" ? (
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-[50vh] w-full resize-y rounded border border-[var(--color-border)] bg-transparent p-3 font-mono text-xs"
            />
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
              {content || (tab === "enhanced" ? "尚未生成知识增强结果" : "没有解析内容")}
            </pre>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
          <span className="text-xs text-[var(--color-text-secondary)]">{message}</span>
          {editing && <Button variant="primary" size="sm" onClick={save} disabled={!draft.trim()}>保存 OCR 原文</Button>}
        </div>
      </div>
    </div>
  );
}
