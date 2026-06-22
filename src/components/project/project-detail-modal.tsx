"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info } from "lucide-react";

interface ProjectDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  projectType: string;
  systemPrompt?: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  experiment: "实验工作台",
  review: "资料复习",
  coding: "代码项目",
  general: "通用项目",
};

export function ProjectDetailModal({
  open,
  onOpenChange,
  projectName,
  projectType,
  systemPrompt,
}: ProjectDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info size={18} strokeWidth={1.5} className="text-[var(--color-text-tertiary)]" />
            项目详情
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <p className="text-xs text-[var(--color-text-tertiary)]">项目名称</p>
            <p className="text-sm font-medium text-[var(--color-text-primary)] mt-0.5">{projectName}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-tertiary)]">项目类型</p>
            <p className="text-sm text-[var(--color-text-primary)] mt-0.5">{TYPE_LABELS[projectType] || projectType}</p>
          </div>

          <div>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1.5">系统提示词</p>
            {systemPrompt ? (
              <ScrollArea className="max-h-60 rounded-[var(--radius-md)] bg-[var(--color-project-control)] p-3">
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {systemPrompt}
                </p>
              </ScrollArea>
            ) : (
              <p className="text-xs text-[var(--color-text-tertiary)] italic">
                未设置。在新建项目时通过场景描述可自动生成。
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
