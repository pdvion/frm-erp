"use client";

import { useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  CheckSquare,
  Package,
  User,
} from "lucide-react";
import { MobileHeader, MobileDrawerMenu } from "@/components/mobile/MobileHeader";
import { BottomNav, BottomNavItem } from "@/components/mobile/BottomNav";
import Link from "next/link";

const bottomNavItems: BottomNavItem[] = [
  {
    href: "/m",
    label: "Início",
    icon: <Home className="w-5 h-5" />,
  },
  {
    href: "/m/requisitions",
    label: "Requisições",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    href: "/m/approvals",
    label: "Aprovações",
    icon: <CheckSquare className="w-5 h-5" />,
  },
  {
    href: "/m/inventory",
    label: "Estoque",
    icon: <Package className="w-5 h-5" />,
  },
  {
    href: "/m/profile",
    label: "Perfil",
    icon: <User className="w-5 h-5" />,
  },
];

const menuItems = [
  { href: "/m", label: "Início", icon: <Home className="w-5 h-5" /> },
  { href: "/m/requisitions", label: "Requisições", icon: <ClipboardList className="w-5 h-5" /> },
  { href: "/m/approvals", label: "Aprovações", icon: <CheckSquare className="w-5 h-5" /> },
  { href: "/m/inventory", label: "Estoque", icon: <Package className="w-5 h-5" /> },
  { href: "/m/profile", label: "Perfil", icon: <User className="w-5 h-5" /> },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/m") return "FRM ERP";
  if (pathname.startsWith("/m/requisitions")) return "Requisições";
  if (pathname.startsWith("/m/approvals")) return "Aprovações";
  if (pathname.startsWith("/m/inventory")) return "Estoque";
  if (pathname.startsWith("/m/profile")) return "Perfil";
  if (pathname.startsWith("/m/notifications")) return "Notificações";
  return "FRM ERP";
}

export default function MobileLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const isSubpage = pathname !== "/m" && pathname.split("/").length > 2;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <MobileHeader
        title={title}
        backHref={isSubpage ? "/m" : undefined}
        onMenuToggle={isSubpage ? undefined : () => setMenuOpen(true)}
        showNotifications
      />

      <MobileDrawerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                  : "text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-800"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </MobileDrawerMenu>

      {/* Main content with bottom padding for nav */}
      <main className="pb-20 safe-area-bottom">
        {children}
      </main>

      <BottomNav items={bottomNavItems} />
    </div>
  );
}
