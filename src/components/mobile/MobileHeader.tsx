"use client";

import { ReactNode } from "react";
import { Menu, X, Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";

export interface MobileHeaderProps {
  title: string;
  icon?: ReactNode;
  backHref?: string;
  onMenuToggle?: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
  actions?: ReactNode;
}

export function MobileHeader({
  title,
  icon,
  backHref,
  onMenuToggle,
  showNotifications = false,
  notificationCount = 0,
  actions,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center h-14 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 safe-area-top">
      {/* Left: Back or Menu */}
      <div className="flex items-center min-w-[44px]">
        {backHref ? (
          <Link
            href={backHref}
            className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
        ) : onMenuToggle ? (
          <button
            onClick={onMenuToggle}
            className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        ) : null}
      </div>

      {/* Center: Title */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {icon && <span className="flex-shrink-0 text-blue-600 dark:text-blue-400">{icon}</span>}
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
          {title}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {actions}
        {showNotifications && (
          <Link
            href="/m/notifications"
            className="relative flex items-center justify-center w-11 h-11 rounded-full active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}

export interface MobileDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileDrawerMenu({ isOpen, onClose, children }: MobileDrawerMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <nav
        className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-xl transform transition-transform safe-area-top safe-area-bottom"
        role="navigation"
        aria-label="Menu principal"
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-800">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">FRM ERP</span>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 rounded-full active:bg-gray-100 dark:active:bg-gray-800"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-56px)] py-2">
          {children}
        </div>
      </nav>
    </>
  );
}
