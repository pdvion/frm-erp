"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { CompanySwitcher } from "./CompanySwitcher";
import { SessionTimeout } from "./SessionTimeout";
import { useIsMobile } from "@/hooks/useMediaQuery";

const publicRoutes = [
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/set-password",
  "/mfa/verify",
  "/mfa/setup",
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/reset-password/")
  );

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
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
      <div
        className={`${
          isMobile
            ? sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0"
        } fixed z-40 transition-transform duration-300`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          isMobile ? "pl-0" : "pl-64"
        }`}
      >
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-4 md:px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}
            <CompanySwitcher />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
      <SessionTimeout />
    </div>
  );
}
