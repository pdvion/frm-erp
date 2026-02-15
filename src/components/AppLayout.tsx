"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { CompanySwitcher } from "./CompanySwitcher";
import { CommandPalette } from "./CommandPalette";
import { Breadcrumb } from "./Breadcrumb";
import { SessionTimeout } from "./SessionTimeout";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";

const publicRoutes = [
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/set-password",
  "/mfa/verify",
  "/mfa/setup",
  "/admission/portal",
  "/portal/customer",
];

const mobileRoutes = ["/m"];

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { isCollapsed } = useSidebar();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isPublicRoute = publicRoutes.some((route) => {
    if (pathname === route) return true;
    if (route === "/") return false;
    return pathname.startsWith(route + "/");
  });

  const isMobileRoute = mobileRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublicRoute || isMobileRoute) {
    return <>{children}</>;
  }

  // Calcular padding baseado no estado da sidebar
  const sidebarWidth = isMobile ? "pl-0" : isCollapsed ? "pl-16" : "pl-64";

  return (
    <div className="min-h-screen bg-theme">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Fechar menu lateral"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm cursor-pointer"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless open */}
      {(!isMobile || sidebarOpen) && (
        <div
          className={`${
            isMobile
              ? "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out"
              : "fixed z-40"
          } ${
            isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarWidth}`}>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-theme-header bg-theme-header/95 px-4 md:px-6 backdrop-blur">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            {/* Mobile menu button */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-lg p-2 text-theme-muted hover:bg-theme-hover hover:text-theme flex-shrink-0"
                aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}
            <div className="min-w-0 flex-1">
              <Breadcrumb />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <CommandPalette />
            <CompanySwitcher />
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main id="main-content" className="p-4 md:p-6" tabIndex={-1}>{children}</main>
      </div>
      <SessionTimeout />
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
