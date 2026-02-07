"use client";

import { User, Settings, Bell, Moon, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const menuItems = [
  { icon: User, label: "Meus Dados", href: "/m/profile/edit" },
  { icon: Bell, label: "Notificações", href: "/m/profile/notifications" },
  { icon: Moon, label: "Tema Escuro", href: "#", toggle: true },
  { icon: Settings, label: "Configurações", href: "/m/profile/settings" },
];

export default function MobileProfilePage() {
  return (
    <div className="p-4 space-y-6">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Usuário FRM
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            usuario@empresa.com.br
          </p>
        </div>
      </div>

      {/* Menu items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
        {menuItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className="flex items-center justify-between w-full px-4 py-3.5 text-left rounded-none h-auto"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-gray-100">{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Button>
        ))}
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/10"
      >
        <LogOut className="w-4 h-4" />
        Sair da Conta
      </Button>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        FRM ERP v1.0 — Módulo em desenvolvimento
      </p>
    </div>
  );
}
