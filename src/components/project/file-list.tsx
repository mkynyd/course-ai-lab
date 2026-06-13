"use client";

import { cn } from "@/lib/utils";
import {
  FileText,
  Check,
  AlertCircle,
  Trash2,
  XCircle,
  Eye,
  Sparkles,
  ScanText,
  Loader,
} from "lucide-react";

export interface ProjectFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: string;
  enhancementStatus?: string;
  processingMetadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface FileListProps {
  files: ProjectFile[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onParse?: (file: ProjectFile) => void;
  onEnhance?: (file: ProjectFile) => void;
  onView?: (file: ProjectFile) => void;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(file: ProjectFile) {
  const parser = file.processingMetadata?.parser;
  if (file.status === "parsed") {
    const base =
      parser === "pdf-text"
        ? "已提取文本"
        : parser === "minimax-pdf-vision"
          ? "已通过视觉解析"
          : "已解析，可用于检索";
    const enhanced =
      file.enhancementStatus === "enhanced"
        ? " · 已增强"
        : file.enhancementStatus === "enhancing"
          ? " · 增强中"
        : file.enhancementStatus === "stale"
          ? " · 增强已过期"
          : "";
    return <span className="text-[var(--color-success)]"><Check size={10} className="inline mr-0.5" />{base}{enhanced}</span>;
  }
  if (file.status === "partial") {
    return <span className="text-[var(--color-warning)]"><AlertCircle size={10} className="inline mr-0.5" />部分解析成功</span>;
  }
  if (file.status === "parsing") {
    return <span className="text-[var(--color-warning)]">解析中</span>;
  }
  if (file.status === "failed") {
    return <span className="text-[var(--color-error)]"><XCircle size={10} className="inline mr-0.5" />解析失败</span>;
  }
  if (file.status === "unsupported") {
    return <span>暂不支持</span>;
  }
  return <span className="text-[var(--color-warning)]"><AlertCircle size={10} className="inline mr-0.5" />待解析</span>;
}

export function FileList({
  files,
  selectedIds,
  onToggle,
  onDelete,
  onParse,
  onEnhance,
  onView,
  className,
}: FileListProps) {
  if (files.length === 0) {
    return (
      <p className={cn("text-xs leading-relaxed text-[var(--color-text-tertiary)] py-4 text-center", className)}>
        上传实验数据、代码、课件、试卷或笔记，开始构建项目上下文。
      </p>
    );
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {files.map((file) => {
        const selected = selectedIds.has(file.id);
        const canParse =
          ["uploaded", "failed"].includes(file.status) &&
          (file.mimeType === "application/pdf" ||
            ["image/png", "image/jpeg", "image/webp"].includes(file.mimeType));
        const canEnhance =
          ["parsed", "partial"].includes(file.status) &&
          file.enhancementStatus !== "enhancing";

        return (
          <div
            key={file.id}
            className={cn(
              "flex items-center rounded-[var(--radius-md)] border",
              selected
                ? "bg-[var(--color-accent-muted)] border-[var(--color-accent)]"
                : "border-transparent hover:bg-[var(--color-surface-hover)]"
            )}
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={selected}
              aria-label={`选择文件 ${file.originalName}`}
              onClick={() => onToggle(file.id)}
              className="flex flex-1 min-w-0 items-center gap-2 px-2 py-1.5 text-left"
            >
              <FileText size={14} className="shrink-0 opacity-70" />
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{file.originalName}</p>
                <p className="text-[10px] font-mono text-[var(--color-text-tertiary)]">
                  {formatSize(file.size)} · {statusLabel(file)}
                </p>
              </div>
            </button>
            <div className="mr-1 flex shrink-0 items-center gap-0.5">
              {file.status === "parsing" && <Loader size={12} className="animate-spin" />}
              {canParse && onParse && (
                <button type="button" onClick={() => onParse(file)} className="p-1 text-[var(--color-accent)]" aria-label={`解析 ${file.originalName}`} title={file.mimeType === "application/pdf" ? "解析 PDF" : "解析图片"}>
                  <ScanText size={12} />
                </button>
              )}
              {canEnhance && onEnhance && (
                <button type="button" onClick={() => onEnhance(file)} className="p-1 text-[var(--color-accent)]" aria-label={`知识增强 ${file.originalName}`} title="知识增强">
                  <Sparkles size={12} />
                </button>
              )}
              {["parsed", "partial"].includes(file.status) && onView && (
                <button type="button" onClick={() => onView(file)} className="p-1 text-[var(--color-text-tertiary)]" aria-label={`查看 ${file.originalName}`} title="查看解析结果">
                  <Eye size={12} />
                </button>
              )}
              {onDelete && (
                <button type="button" onClick={() => onDelete(file.id)} className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]" aria-label={`删除 ${file.originalName}`}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
