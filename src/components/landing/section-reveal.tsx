"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  yOffset?: number;
}

/**
 * 纵向 section reveal：内容从下方淡入并上滑。
 * - 不 pin、不水平滚动
 * - 元素顶部到达视口 75% 位置（从底部算 25%）时开始
 * - 元素顶部到达视口 20% 位置（从底部算 80%）时完成
 * - 使用 ease-out-expo 感觉的非线性 scrub
 * - prefers-reduced-motion 时禁用
 */
export function SectionReveal({
  children,
  className = "",
  innerClassName = "",
  yOffset = 48,
}: SectionRevealProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const inner = innerRef.current;
    if (!section || !inner) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const tween = gsap.fromTo(
      inner,
      { opacity: 0, y: yOffset },
      {
        opacity: 1,
        y: 0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          end: "top 20%",
          scrub: 0.6,
        },
      }
    );

    return () => {
      tween.kill();
      const st = tween.scrollTrigger;
      if (st) st.kill();
    };
  }, [yOffset]);

  return (
    <section ref={sectionRef} className={className}>
      <div ref={innerRef} className={innerClassName}>
        {children}
      </div>
    </section>
  );
}
