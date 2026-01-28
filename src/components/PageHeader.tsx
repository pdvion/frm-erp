"use client";

import Link from "next/link";
import { ChevronLeft, BookOpen } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import type { BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  backHref?: string;
  backLabel?: string;
  module?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: {
    label: string;
    color: string;
    bgColor: string;
  };
  children?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ 
  title, 
  subtitle,
  icon, 
  backHref, 
  backLabel = "Voltar",
  module,
  breadcrumbs: _breadcrumbs,
  badge,
  children, 
  actions 
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center gap-1 text-theme-muted hover:text-white dark:text-theme-muted dark:hover:text-white light:text-theme-muted light:hover:text-theme-secondary transition-colors flex-shrink-0"
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
              <h1 className="text-xl sm:text-2xl font-bold text-white dark:text-white light:text-theme truncate">
                {title}
              </h1>
              {badge && (
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${badge.bgColor} ${badge.color}`}>
                  {badge.label}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-theme-muted dark:text-theme-muted light:text-theme-muted mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {module && (
            <>
              <Link
                href="/docs"
                className="p-2 text-theme-muted hover:text-white hover:bg-theme-card dark:text-theme-muted dark:hover:text-white dark:hover:bg-theme-card light:text-theme-muted light:hover:text-theme-secondary light:hover:bg-theme-tertiary rounded-full transition-colors"
                title="Documentação"
              >
                <BookOpen className="w-5 h-5" />
              </Link>
              <HelpButton module={module} />
            </>
          )}
          {actions}
          {children}
        </div>
      </div>
    </div>
  );
}
