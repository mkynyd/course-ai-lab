"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

interface RotatingTextProps {
  /** 备选词组列表 */
  words: string[];
  /** 旋转间隔 (ms)，默认 2000 */
  interval?: number;
  /** 前缀文字，如 "正在" */
  prefix?: string;
  /** 后缀文字 */
  suffix?: string;
  className?: string;
}

export function RotatingText({
  words,
  interval = 2000,
  prefix = "",
  suffix = "",
  className,
}: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const shuffled = useMemo(() => {
    const arr = [...words];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [words]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % shuffled.length);
        setIsVisible(true);
      }, 150);
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [shuffled, interval]);

  const currentWord = shuffled[currentIndex] || words[0];

  return (
    <span className={cn("inline-flex items-baseline", className)} aria-live="polite">
      <span>{prefix}</span>
      <span
        className={cn(
          "inline-block transition-all duration-150",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
        )}
      >
        {currentWord}
      </span>
      <span>{suffix}</span>
    </span>
  );
}
