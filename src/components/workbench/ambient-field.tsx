"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function shouldContinueAmbientFrame(
  pulseStartedAt: number,
  now: number,
  reducedMotion: boolean
) {
  return !reducedMotion && pulseStartedAt > 0 && now - pulseStartedAt < 640;
}

interface AmbientFieldProps {
  intensity?: "low" | "medium";
  density?: "auto" | "compact" | "wide";
  className?: string;
}

export function AmbientField({
  intensity = "low",
  density = "auto",
  className,
}: AmbientFieldProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!wrapperRef.current || !canvasRef.current) return;
    const wrapperEl = wrapperRef.current;
    const canvasEl = canvasRef.current;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = {
      x: -1000,
      y: -1000,
      pulseX: -1000,
      pulseY: -1000,
      pulseStartedAt: 0,
    };
    let rafId = 0;
    let dots: Array<{ x: number; y: number; ox: number; oy: number }> = [];
    let width = 0;
    let height = 0;
    let dotSize = 2.2;
    let gap = 30;
    const drawingContext = canvasEl.getContext("2d");
    if (!drawingContext) return;
    const ctx: CanvasRenderingContext2D = drawingContext;

    function readThemeColor(name: string) {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
    }

    function resolveDensity(nextWidth: number) {
      const compact = density === "compact" || nextWidth < 560;
      const wide = density === "wide" || nextWidth > 1200;
      if (compact) return { dotSize: 1.7, gap: 28, proximity: 92 };
      if (wide) return { dotSize: 2.1, gap: 46, proximity: 150 };
      return { dotSize: 1.9, gap: 36, proximity: 125 };
    }

    let proximity = 125;
    const OBSTACLE_REPULSION_PROXIMITY = 120;
    const OBSTACLE_REPULSION_STRENGTH = 32;
    const OBSTACLE_LERP = 0.12;
    let obstacles: Array<{ left: number; top: number; right: number; bottom: number }> = [];

    function refreshObstacles() {
      const wrapperRect = wrapperEl.getBoundingClientRect();
      const padding = gap;
      const scopeEl = wrapperEl.parentElement ?? wrapperEl;
      obstacles = Array.from(scopeEl.querySelectorAll("[data-dot-avoid]")).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left - wrapperRect.left - padding,
          top: rect.top - wrapperRect.top - padding,
          right: rect.right - wrapperRect.left + padding,
          bottom: rect.bottom - wrapperRect.top + padding,
        };
      });
    }

    function isDotHidden(dot: { x: number; y: number }) {
      for (const rect of obstacles) {
        if (
          dot.x >= rect.left &&
          dot.x <= rect.right &&
          dot.y >= rect.top &&
          dot.y <= rect.bottom
        ) {
          return true;
        }
      }
      return false;
    }

    function computeObstacleRepulsion(dot: { x: number; y: number }) {
      let nearestDistance = Infinity;
      let nearestDx = 0;
      let nearestDy = 0;
      for (const rect of obstacles) {
        const nearestX = Math.max(rect.left, Math.min(dot.x, rect.right));
        const nearestY = Math.max(rect.top, Math.min(dot.y, rect.bottom));
        const dx = dot.x - nearestX;
        const dy = dot.y - nearestY;
        const distance = Math.hypot(dx, dy);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestDx = dx;
          nearestDy = dy;
        }
      }
      if (nearestDistance > 0 && nearestDistance < OBSTACLE_REPULSION_PROXIMITY) {
        const t = 1 - nearestDistance / OBSTACLE_REPULSION_PROXIMITY;
        const force = OBSTACLE_REPULSION_STRENGTH * t * t;
        return {
          tx: (nearestDx / nearestDistance) * force,
          ty: (nearestDy / nearestDistance) * force,
        };
      }
      return { tx: 0, ty: 0 };
    }

    function buildGrid() {
      const rect = wrapperEl.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      const next = resolveDensity(width);
      dotSize = next.dotSize;
      gap = next.gap;
      proximity = next.proximity;

      canvasEl.width = Math.max(1, Math.floor(width * dpr));
      canvasEl.height = Math.max(1, Math.floor(height * dpr));
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      const step = gap + dotSize;
      const cols = Math.ceil(width / step) + 2;
      const rows = Math.ceil(height / step) + 2;
      const offsetX = (width - (cols - 1) * step) / 2;
      const offsetY = (height - (rows - 1) * step) / 2;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          dots.push({
            x: offsetX + col * step,
            y: offsetY + row * step,
            ox: 0,
            oy: 0,
          });
        }
      }
      refreshObstacles();
    }

    function draw() {
      const baseColor = readThemeColor("--dot-grid-base") || "rgba(100,116,139,0.16)";
      const activeColor = readThemeColor("--dot-grid-active") || "rgba(37,99,235,0.7)";
      const now = performance.now();
      ctx.clearRect(0, 0, width, height);
      let needsAnimation = false;
      const respectMotion = !reducedMotion.matches;

      for (const dot of dots) {
        if (isDotHidden(dot)) continue;

        if (respectMotion) {
          const repulsion = computeObstacleRepulsion(dot);
          dot.ox += (repulsion.tx - dot.ox) * OBSTACLE_LERP;
          dot.oy += (repulsion.ty - dot.oy) * OBSTACLE_LERP;
          if (Math.abs(dot.ox) > 0.05 || Math.abs(dot.oy) > 0.05) {
            needsAnimation = true;
          }
        } else {
          dot.ox = 0;
          dot.oy = 0;
        }

        const drawX = dot.x + dot.ox;
        const drawY = dot.y + dot.oy;
        const dx = drawX - pointer.x;
        const dy = drawY - pointer.y;
        const distance = Math.hypot(dx, dy);
        const t = Math.max(0, 1 - distance / proximity);
        const pulseAge = now - pointer.pulseStartedAt;
        const pulseDistance = Math.hypot(drawX - pointer.pulseX, drawY - pointer.pulseY);
        const pulse = pulseAge < 640
          ? Math.max(0, 1 - pulseAge / 640) * Math.max(0, 1 - pulseDistance / 220)
          : 0;
        const strength = Math.min(1, t + pulse * 0.8);

        ctx.globalAlpha = 0.6 + strength * (intensity === "medium" ? 0.4 : 0.28);
        ctx.fillStyle = strength > 0.04 ? activeColor : baseColor;
        ctx.beginPath();
        ctx.arc(drawX, drawY, dotSize + strength * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const continueFrame =
        shouldContinueAmbientFrame(pointer.pulseStartedAt, now, reducedMotion.matches) || needsAnimation;
      if (continueFrame) {
        rafId = window.requestAnimationFrame(draw);
      }
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = canvasEl.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(draw);
    }

    function handlePointerDown(event: PointerEvent) {
      const rect = canvasEl.getBoundingClientRect();
      pointer.pulseX = event.clientX - rect.left;
      pointer.pulseY = event.clientY - rect.top;
      pointer.pulseStartedAt = performance.now();
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(draw);
    }

    buildGrid();
    draw();
    const observer = new ResizeObserver(() => {
      buildGrid();
      draw();
    });
    const themeObserver = new MutationObserver(draw);
    const obstacleObserver = new MutationObserver(() => {
      refreshObstacles();
      draw();
    });
    observer.observe(wrapperEl);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    obstacleObserver.observe(wrapperEl, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-dot-avoid"],
    });
    reducedMotion.addEventListener("change", draw);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    return () => {
      observer.disconnect();
      themeObserver.disconnect();
      obstacleObserver.disconnect();
      window.cancelAnimationFrame(rafId);
      reducedMotion.removeEventListener("change", draw);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [density, intensity]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className={cn(
        "workbench-ambient",
        intensity === "medium" && "workbench-ambient-medium",
        className
      )}
    >
      <canvas ref={canvasRef} className="workbench-ambient-canvas" />
    </div>
  );
}
