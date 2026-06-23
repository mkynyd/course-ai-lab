import { LandingSurface } from "@/components/landing/landing-surface";

/**
 * 公开主页 `/home`：匿名和登录用户都可访问，永远渲染 marketing surface。
 *  - 不调用 auth()：和登录态无关
 *  - 不接 SessionProvider / Sidebar / Navbar
 *  - 根路由 `/` 仍负责 auth 守门（登录 → /chat；未登录 → /home）
 */
export default function Home() {
  return <LandingSurface />;
}
