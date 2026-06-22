"use client";
import { useState, useCallback } from "react";

export function useWebSearch() {
  const [webSearchActive, setWebSearchActive] = useState(false);
  const toggle = useCallback(() => setWebSearchActive((p) => !p), []);
  return { webSearchActive, toggle };
}
