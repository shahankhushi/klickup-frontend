"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { canLeadWorkspace } from "@/lib/access";
import { useAppData } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useAppData();
  const leads = canLeadWorkspace(currentUser.role);
  const isWhiteboard = pathname?.startsWith("/whiteboard");

  useEffect(() => {
    if (leads || !pathname) return;
    const blocked = ["/dashboard", "/team", "/docs", "/whiteboard", "/projects", "/approvals", "/calendar"];
    if (blocked.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
      router.replace("/tasks");
    }
  }, [leads, pathname, router]);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Suspense fallback={null}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </Suspense>
      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
          aria-label="Close menu"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <Navbar onOpenMenu={() => setMobileOpen(true)} />
        <main
          id="main"
          className={
            isWhiteboard
              ? "flex-1 overflow-hidden p-0 relative"
              : "flex-1 overflow-y-auto px-4 py-5 md:px-6 lg:px-8"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
