"use client";

import { forwardRef, type HTMLAttributes, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export const SpotlightCard = forwardRef<HTMLDivElement, SpotlightCardProps>(function SpotlightCard({
  active = false,
  className,
  onPointerMove,
  ...props
}, ref) {
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
        "workbench-spotlight rounded-[var(--radius-xl)] bg-[var(--color-project-surface)] transition-[background-color] duration-200",
        active
          ? "bg-[var(--color-project-surface-active)]"
          : "hover:bg-[var(--color-project-surface-hover)]",
        className
      )}
      ref={ref}
      onPointerMove={handlePointerMove}
      {...props}
    />
  );
});
