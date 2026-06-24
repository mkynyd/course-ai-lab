"use client";

import { useMemo, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { QueryProvider } from "@/components/providers/query-provider";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const section = pathname.startsWith("/projects")
    ? "projects"
    : pathname.startsWith("/tools")
      ? "tools"
      : "chat";
  const isInsideProject = useMemo(
    () => /^\/projects\/[^/]+/.test(pathname || ""),
    [pathname]
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // 用户是否手动切换过桌面侧栏折叠状态
  const [hasUserToggledDesktop, setHasUserToggledDesktop] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState(false);
  // 进入具体项目页(/projects/[id])时默认收起主侧拉栏，给工作区让出更多空间。
  // 用 derived state 代替 effect 内 setState，避免级联渲染。
  const sidebarCollapsed = hasUserToggledDesktop
    ? userCollapsed
    : isInsideProject;

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setHasUserToggledDesktop(true);
      setUserCollapsed((current) => !current);
      return;
    }

    setMobileSidebarOpen((current) => !current);
  }

  return (
    <SessionProvider>
      <QueryProvider>
        <div className="h-screen flex flex-col bg-[var(--color-bg)]">
          <Navbar
            sidebarCollapsed={sidebarCollapsed}
            mobileSidebarOpen={mobileSidebarOpen}
            onMenuToggle={toggleSidebar}
          />
          <div className="flex-1 flex overflow-hidden">
            <Sidebar
              mobileOpen={mobileSidebarOpen}
              collapsed={sidebarCollapsed}
              onClose={() => setMobileSidebarOpen(false)}
              onExpand={() => {
                setHasUserToggledDesktop(true);
                setUserCollapsed(false);
              }}
            />
            <main key={section} className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg)] workbench-view-enter">
              {children}
            </main>
          </div>
        </div>
      </QueryProvider>
    </SessionProvider>
  );
}
