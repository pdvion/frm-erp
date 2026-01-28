"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  backHref?: string;
  backLabel?: string;
  badge?: {
    label: string;
    color: string;
    bgColor: string;
  };
  actions?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  backHref,
  backLabel = "Voltar",
  badge,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center gap-1 text-theme-muted hover:text-white transition-colors flex-shrink-0"
            title={backLabel}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="sr-only">{backLabel}</span>
          </Link>
        )}
        
        {icon && (
          <div className="flex-shrink-0 text-blue-500">
            {icon}
          </div>
        )}
        
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
              {title}
            </h1>
            {badge && (
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${badge.bgColor} ${badge.color}`}>
                {badge.label}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-theme-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {actions}
        </div>
      )}
    </div>
  );
}
