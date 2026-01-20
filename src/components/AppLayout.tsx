"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { CompanySwitcher } from "./CompanySwitcher";
import { SessionTimeout } from "./SessionTimeout";

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
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/reset-password/")
  );

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <CompanySwitcher />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
      <SessionTimeout />
    </div>
  );
}
