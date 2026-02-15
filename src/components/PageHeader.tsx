"use client";

import Link from "next/link";
import { ChevronLeft, BookOpen } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
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
    variant: BadgeVariant;
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
  breadcrumbs,
  badge,
  children, 
  actions 
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} showHome={false} className="mb-3" />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center gap-1 text-theme-muted hover:text-theme dark:hover:text-white transition-colors flex-shrink-0"
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
              <h1 className="text-xl sm:text-2xl font-bold text-theme dark:text-white truncate">
                {title}
              </h1>
              {badge && (
                <Badge variant={badge.variant}>
                  {badge.label}
                </Badge>
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
                className="p-2 text-theme-muted hover:text-theme hover:bg-theme-card dark:hover:text-white rounded-full transition-colors"
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
