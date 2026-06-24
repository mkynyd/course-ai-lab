"use client";

import { useEffect } from "react";
import { FeaturesSection } from "./features-section";
import { HeroSection } from "./hero-section";
import { HowToSection } from "./how-to-section";
import { LandingFooter } from "./landing-footer";
import { LandingNav } from "./landing-nav";

/**
 * 公开主页壳层。
 *  - 不接 SessionProvider（landing 不需要登录态）
 *  - 不渲染 (chat) 路由组的 Sidebar / Navbar
 *  - 内部子组件自行处理主题、深浅色、prefers-reduced-motion
 *
 * 主页采用 CSS Scroll-Snap：每个大板块占满一屏，滚动时自动吸附居中。
 * prefers-reduced-motion 时退化为普通文档流。
 */
export function LandingSurface() {
  useEffect(() => {
    document.documentElement.classList.add("landing-snap");
    return () => document.documentElement.classList.remove("landing-snap");
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowToSection />
      </main>
      <LandingFooter />
    </div>
  );
}
