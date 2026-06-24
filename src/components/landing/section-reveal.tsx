"use client";

import { motion } from "motion/react";
import { useRef } from "react";
import { usePrefersReducedMotion } from "./prefers-motion";

interface SectionRevealProps extends React.HTMLAttributes<HTMLElement> {
  innerClassName?: string;
  yOffset?: number;
}

/**
 * 纵向 section reveal：内容进入视口时淡入并上滑，离开时淡出。
 * - viewport amount 0.4：元素进入 40% 时触发
 * - 过渡时长 0.6s，ease-out
 * - prefers-reduced-motion: 退化为直接可见
 */
export function SectionReveal({
  children,
  className = "",
  innerClassName = "",
  yOffset = 48,
  ...rest
}: SectionRevealProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <section ref={sectionRef} className={className} {...rest}>
        <div ref={innerRef} className={innerClassName}>
          {children}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className={className} {...rest}>
      <motion.div
        ref={innerRef}
        className={innerClassName}
        initial={{ opacity: 0, y: yOffset }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </section>
  );
}
