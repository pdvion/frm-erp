"use client";

import { ReactNode } from "react";

export interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  href?: string;
}

export function MobileCard({ children, onClick, className = "" }: MobileCardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left transition-colors ${
        onClick ? "active:bg-gray-50 dark:active:bg-gray-750 cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </Component>
  );
}

export interface MobileCardHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  icon?: ReactNode;
}

export function MobileCardHeader({ title, subtitle, badge, icon }: MobileCardHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h3>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export interface MobileCardContentProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardContent({ children, className = "" }: MobileCardContentProps) {
  return <div className={`mt-3 ${className}`}>{children}</div>;
}
