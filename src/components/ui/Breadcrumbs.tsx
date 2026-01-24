"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export function Breadcrumbs({ items, showHome = true, className = "" }: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Início", href: "/" }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center ${className}`}>
      <ol className="flex items-center gap-1 text-sm">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isHome = index === 0 && showHome;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-theme-muted mx-1 flex-shrink-0" aria-hidden="true" />
              )}
              
              {isLast ? (
                <span 
                  className="text-theme font-medium truncate max-w-[200px]"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="text-theme-muted hover:text-theme transition-colors flex items-center gap-1"
                >
                  {isHome && <Home className="w-4 h-4" aria-hidden="true" />}
                  <span className={isHome ? "sr-only sm:not-sr-only" : ""}>{item.label}</span>
                </Link>
              ) : (
                <span className="text-theme-muted">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
