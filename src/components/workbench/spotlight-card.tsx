"use client";

import type { HTMLAttributes, PointerEvent } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export function SpotlightCard({
  active = false,
  className,
  onPointerMove,
  ...props
}: SpotlightCardProps) {
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--spotlight-x",
      `${event.clientX - rect.left}px`
    );
    event.currentTarget.style.setProperty(
      "--spotlight-y",
      `${event.clientY - rect.top}px`
    );
    onPointerMove?.(event);
  }

  return (
    <div
      className={cn(
        "workbench-spotlight rounded-[var(--radius-xl)] border bg-[var(--color-surface)]",
        "backdrop-blur-[var(--glass-blur)] transition-[border-color,background-color] duration-200",
        active
          ? "workbench-border-glow border-[var(--color-accent)]"
          : "border-[var(--color-border-light)] hover:border-[var(--color-accent-muted)]",
        className
      )}
      onPointerMove={handlePointerMove}
      {...props}
    />
  );
}
