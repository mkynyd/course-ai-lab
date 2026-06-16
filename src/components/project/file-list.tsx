"use client";

import { useState } from "react";
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { FILE_CATEGORIES, type FileCategory } from "@/lib/file-categories";

export interface ProjectFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: string;
  category?: string | null;
  categoryConfidence?: number | null;
  enhancementStatus?: string;
  processingMetadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface FileSelectionIntent {
  range: boolean;
  additive: boolean;
  index: number;
}

interface FileListProps {
  files: ProjectFile[];
  selectedIds: Set<string>;
  onToggle: (id: string, intent: FileSelectionIntent) => void;
  onDelete?: (id: string) => void;
  onParse?: (file: ProjectFile) => void;
  onEnhance?: (file: ProjectFile) => void;
  onView?: (file: ProjectFile) => void;
  onCategoryChange?: (id: string, category: FileCategory | null) => void;
  defaultGroupsCollapsed?: boolean;
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
        : parser === "minimax-pdf-vision" || parser === "minimax-pdf-native"
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

function parsingStageLabel(file: ProjectFile) {
  const stage = file.processingMetadata?.parsingStage;
  if (stage === "converting") return "转换格式中";
  if (stage === "model") return "模型解析中";
  if (stage === "writing") return "写入中";
  if (stage === "complete") return "完成";
  return "模型解析中";
}

function categoryLabel(file: ProjectFile) {
  if (file.category && (file.categoryConfidence ?? 1) >= 0.7) {
    return file.category;
  }
  return "未分类";
}

function groupedFiles(files: ProjectFile[]) {
  const order = [...FILE_CATEGORIES, "未分类"];
  return order
    .map((category) => ({
      category,
      files: files.filter((file) => categoryLabel(file) === category),
    }))
    .filter((group) => group.files.length > 0);
}

export function FileList({
  files,
  selectedIds,
  onToggle,
  onDelete,
  onParse,
  onEnhance,
  onView,
  onCategoryChange,
  defaultGroupsCollapsed = false,
  className,
}: FileListProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  if (files.length === 0) {
    return (
      <p className={cn("text-xs leading-relaxed text-[var(--color-text-tertiary)] py-4 text-center", className)}>
        上传实验数据、代码、课件、试卷或笔记，开始构建项目上下文。
      </p>
    );
  }

  function isGroupOpen(category: string) {
    return defaultGroupsCollapsed ? openGroups.has(category) : !openGroups.has(category);
  }

  function toggleGroup(category: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function renderFile(file: ProjectFile, index: number) {
    const selected = selectedIds.has(file.id);
    const canParse =
      ["uploaded", "failed"].includes(file.status);
    const canEnhance =
      ["parsed", "partial"].includes(file.status) &&
      file.enhancementStatus !== "enhancing";

    return (
      <div
        key={file.id}
        className={cn(
          "rounded-[var(--radius-md)] border",
          selected
            ? "bg-[var(--color-accent-muted)] border-[var(--color-accent)]"
            : "border-transparent hover:bg-[var(--color-surface-hover)]"
        )}
      >
        <div className="flex items-center">
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={`选择文件 ${file.originalName}`}
            onClick={(event) =>
              onToggle(file.id, {
                range: event.shiftKey,
                additive: event.metaKey || event.ctrlKey,
                index,
              })
            }
            className="flex flex-1 min-w-0 items-center gap-2 px-2 py-1.5 text-left"
          >
            <FileText size={14} className="shrink-0 opacity-70" />
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">{file.originalName}</p>
              <p className="text-[10px] font-mono text-[var(--color-text-tertiary)]">
                {formatSize(file.size)} · {statusLabel(file)}
              </p>
              {file.status === "parsing" && (
                <div className="mt-1 space-y-1">
                  <div
                    role="progressbar"
                    aria-label={`${file.originalName} 解析进度`}
                    className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-ring-track)]"
                  >
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--color-warning)]" />
                  </div>
                  <p className="text-[10px] text-[var(--color-warning)]">
                    {parsingStageLabel(file)}
                  </p>
                </div>
              )}
            </div>
          </button>
          <div className="mr-1 flex shrink-0 items-center gap-0.5">
            {onCategoryChange && (
              <select
                value={file.category || ""}
                onChange={(event) =>
                  onCategoryChange(
                    file.id,
                    event.target.value ? (event.target.value as FileCategory) : null
                  )
                }
                onClick={(event) => event.stopPropagation()}
                className="h-6 max-w-20 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1 text-[10px]"
                aria-label={`修改 ${file.originalName} 分类`}
              >
                <option value="">未分类</option>
                {FILE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}
            {file.status === "parsing" && <Loader size={12} className="animate-spin" />}
            {canParse && onParse && (
              <button type="button" onClick={() => onParse(file)} className="p-1 text-[var(--color-accent)]" aria-label={`解析 ${file.originalName}`} title="重新解析">
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
      </div>
    );
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {groupedFiles(files).map((group) => {
        const open = isGroupOpen(group.category);
        return (
          <div key={group.category} className="space-y-0.5">
            <button
              type="button"
              onClick={() => toggleGroup(group.category)}
              className="flex h-7 w-full items-center justify-between rounded-[var(--radius-md)] px-2 text-[11px] font-medium text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)]"
              aria-expanded={open}
            >
              <span className="inline-flex items-center gap-1">
                {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {group.category}
              </span>
              <span className="font-mono">{group.files.length}</span>
            </button>
            {open && group.files.map((file) => renderFile(file, files.indexOf(file)))}
          </div>
        );
      })}
    </div>
  );
}
