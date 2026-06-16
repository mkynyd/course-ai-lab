"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, AlertCircle, Check } from "lucide-react";
import { useUploadFiles } from "@/lib/hooks/use-project-files";

interface FileUploadProps {
  projectId: string;
  onUploaded: () => void;
  className?: string;
}

const ALLOWED_TYPES = [
  ".txt", ".md", ".csv", ".json",
  ".ts", ".tsx", ".js", ".jsx", ".py",
  ".c", ".cpp", ".h", ".java", ".sql",
  ".html", ".css",
  ".pdf",
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function FileUpload({ projectId, onUploaded, className }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadFiles(projectId);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setError(null);

      // Validate each file size on client side
      const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        setError(
          `超过 20MB 限制: ${oversized.map((f) => f.name).join(", ")}`
        );
        return;
      }

      try {
        const result = await uploadMutation.mutateAsync(files);
        if (result.errors.length > 0) {
          const errorMsgs = result.errors.map(
            (e) => `${e.name}: ${e.error}`
          );
          setError(errorMsgs.join("; "));
        }
        if (result.files.length > 0) {
          onUploaded();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "上传失败，请重试");
      }
    },
    [onUploaded, uploadMutation]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFiles(files);
    }
    // Reset input so same files can be re-uploaded
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
  }

  const uploading = uploadMutation.isPending;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center py-4 px-3 rounded-[var(--radius-md)]",
          "border border-dashed cursor-pointer transition-colors duration-150",
          dragging
            ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)]"
            : "border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]"
        )}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <span className="text-xs text-[var(--color-text-secondary)]">
            上传中…
          </span>
        ) : (
          <>
            <Upload size={16} strokeWidth={1.5} className="text-[var(--color-text-tertiary)] mb-1" />
            <span className="text-xs text-[var(--color-text-tertiary)]">
              点击或拖拽文件上传（≤20MB，支持批量）
            </span>
            <span className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
              支持 TXT、MD、CSV、JSON、代码文件、PDF、图片
            </span>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-1 text-xs text-[var(--color-error)]">
          <AlertCircle size={12} strokeWidth={2} className="shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {uploadMutation.data && uploadMutation.data.errors.length === 0 && uploadMutation.data.files.length > 0 && !uploading && (
        <div className="flex items-center gap-1 text-xs text-[var(--color-success)]">
          <Check size={12} strokeWidth={2} />
          已上传 {uploadMutation.data.files.length} 个文件
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ALLOWED_TYPES.join(",")}
        multiple
        onChange={handleChange}
      />
    </div>
  );
}
