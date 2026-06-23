"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { usePrefersReducedMotion } from "./prefers-motion";

interface ScrollRevealProps {
  children: ReactNode;
  /** @deprecated 滚动 scrub 不再使用固定延迟，保留以免破坏调用方。 */
  delay?: number;
  /** @deprecated 滚动 scrub 不再使用固定入场时长，保留以免破坏调用方。 */
  amount?: number;
  /** Y 方向位移幅度（px），默认 24。 */
  yOffset?: number;
  /** @deprecated 滚动 scrub 不再使用固定入场时长，保留以免破坏调用方。 */
  duration?: number;
  className?: string;
}

/**
 * 滚动 scrub 入场揭示：元素顶部进入视口 25%–80% 区间时淡入 + 轻微上移。
 * - 开始：元素顶部到达视口 75% 位置（从底部算起 25%）
 * - 完成：元素顶部到达视口 20% 位置（从底部算起 80%）
 * - prefers-reduced-motion: 退化为直接可见
 * - 永远渲染 motion.div，需要不同语义的元素时由调用方在 children 里自行包裹
 */
export function ScrollReveal({
  children,
  yOffset = 24,
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "start 0.20"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [yOffset, 0]);

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ opacity, y }}
    >
      {children}
    </motion.div>
  );
}
