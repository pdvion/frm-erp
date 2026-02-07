"use client";

import { Bell, Moon, Sun, LogOut, ChevronRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";

export default function MobileProfilePage() {
  const { user, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const displayEmail = user?.email || "";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{initials}</span>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{displayName}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{displayEmail}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
        <Link href="/m/notifications" className="flex items-center justify-between w-full px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-gray-100">Notificações</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Button variant="ghost" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="flex items-center justify-between w-full px-4 py-3.5 rounded-none h-auto">
          <div className="flex items-center gap-3">
            {resolvedTheme === "dark" ? <Sun className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <Moon className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
            <span className="text-sm text-gray-900 dark:text-gray-100">{resolvedTheme === "dark" ? "Tema Claro" : "Tema Escuro"}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Button>

        <Link href="/settings" className="flex items-center justify-between w-full px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-gray-100">Configurações</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>

      <Button
        variant="outline"
        onClick={() => signOut()}
        className="w-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/10"
        leftIcon={<LogOut className="w-4 h-4" />}
      >
        Sair da Conta
      </Button>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        FRM ERP v1.0
      </p>
    </div>
  );
}
