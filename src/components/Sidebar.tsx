"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Building2,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { getMenuStructure } from "@/lib/routes/registry";
import type { MenuItem } from "@/lib/routes/types";
import { trpc } from "@/lib/trpc";


interface SidebarProps {
  onClose?: () => void;
}

interface MenuItemComponentProps {
  item: MenuItem;
  isTopLevel?: boolean;
  isActive: (href?: string) => boolean;
  hasActiveChild: (item: MenuItem) => boolean;
  expandedItems: string[];
  toggleExpand: (label: string) => void;
}

function MenuItemComponent({
  item,
  isTopLevel = false,
  isActive,
  hasActiveChild,
  expandedItems,
  toggleExpand,
}: MenuItemComponentProps) {
  const isExpanded = expandedItems.includes(item.label);
  const hasChildren = item.children && item.children.length > 0;
  const isItemActive = isActive(item.href);
  const hasActiveDescendant = hasActiveChild(item);

  // Estilos baseados no nível
  const baseStyles = isTopLevel
    ? "px-3 py-2 text-sm font-medium"
    : "px-2 py-1.5 text-sm";

  // Link simples (sem filhos)
  if (item.href && !hasChildren) {
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 rounded-lg ${baseStyles} transition-colors ${
          isItemActive
            ? "bg-blue-600 text-white"
            : isTopLevel
              ? "text-theme-secondary hover:bg-theme-hover hover:text-theme"
              : "text-theme-muted hover:bg-theme-hover hover:text-theme"
        }`}
      >
        {isTopLevel && item.icon && <span className="flex-shrink-0">{item.icon}</span>}
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  // Acordeão (com filhos)
  return (
    <>
      <button
        onClick={() => toggleExpand(item.label)}
        className={`flex w-full items-center gap-3 rounded-lg ${baseStyles} transition-colors ${
          hasActiveDescendant
            ? isTopLevel ? "bg-theme-hover text-theme" : "text-theme font-medium"
            : isTopLevel
              ? "text-theme-secondary hover:bg-theme-hover hover:text-theme"
              : "text-theme-muted hover:bg-theme-hover hover:text-theme"
        }`}
      >
        {isTopLevel && item.icon && <span className="flex-shrink-0">{item.icon}</span>}
        <span className="flex-1 text-left truncate">{item.label}</span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        )}
      </button>
      {isExpanded && hasChildren && (
        <ul className={`mt-0.5 flex flex-col gap-0.5 ${isTopLevel ? "ml-8 border-l border-theme/20 pl-2" : "ml-3 pl-2"}`}>
          {item.children!.map((child) => (
            <li key={child.label}>
              <MenuItemComponent
                item={child}
                isActive={isActive}
                hasActiveChild={hasActiveChild}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const { data: landingConfig } = trpc.settings.getLandingConfig.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const companyName = landingConfig?.identity?.companyName as string || "FRM ERP";
  const companyLogo = landingConfig?.identity?.logo as string | null;

  // Obter menu do registry (memoizado)
  const menuItems = useMemo(() => getMenuStructure(), []);

  // Em mobile, sempre mostrar sidebar expandido (não colapsado)
  const effectiveCollapsed = isMobile ? false : isCollapsed;

  const themeOptions = [
    { value: "light" as const, icon: Sun, label: "Claro" },
    { value: "dark" as const, icon: Moon, label: "Escuro" },
    { value: "system" as const, icon: Monitor, label: "Sistema" },
  ];

  // Em mobile, fechar sidebar ao navegar
  useEffect(() => {
    if (isMobile && onClose) {
      onClose();
    }
  }, [pathname, isMobile, onClose]);

  // Função recursiva para encontrar módulos ativos
  const findActiveLabels = (items: MenuItem[], path: string): string[] => {
    const labels: string[] = [];
    for (const item of items) {
      if (item.children) {
        const childLabels = findActiveLabels(item.children, path);
        if (childLabels.length > 0 || item.children.some((c) => c.href && path.startsWith(c.href))) {
          labels.push(item.label, ...childLabels);
        }
      }
    }
    return labels;
  };

  // Auto-expand menus based on current path
  useEffect(() => {
    const activeLabels = findActiveLabels(menuItems, pathname);
    if (activeLabels.length > 0) {
      setExpandedItems((prev) => {
        const newItems = activeLabels.filter((l) => !prev.includes(l));
        return newItems.length > 0 ? [...prev, ...newItems] : prev;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, menuItems]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href?: string) => href ? (pathname === href || pathname.startsWith(href + "/")) : false;

  // Verifica se algum filho está ativo (recursivo)
  const hasActiveChild = (item: MenuItem): boolean => {
    if (!item.children) return false;
    return item.children.some((c) => isActive(c.href) || hasActiveChild(c));
  };

  // Obtém o primeiro href disponível (para collapsed mode)
  const getFirstHref = (item: MenuItem): string => {
    if (item.href) return item.href;
    if (item.children && item.children.length > 0) {
      return getFirstHref(item.children[0]);
    }
    return "/dashboard";
  };

  if (effectiveCollapsed) {
    return (
      <aside className="fixed left-0 top-0 z-40 h-screen w-16 border-r border-theme bg-theme-sidebar transition-all duration-300">
        <div className="flex h-14 items-center justify-center border-b border-theme">
          <button
            onClick={() => setIsCollapsed(false)}
            className="rounded-lg p-2 text-theme-muted hover:bg-theme-hover hover:text-theme"
            aria-label="Expandir menu"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-2" data-testid="sidebar-nav-collapsed">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={getFirstHref(item)}
              className={`flex items-center justify-center rounded-lg p-3 transition-colors ${
                isActive(item.href) || hasActiveChild(item)
                  ? "bg-blue-600 text-white"
                  : "text-theme-muted hover:bg-theme-hover hover:text-theme"
              }`}
              title={item.label}
              data-testid={`sidebar-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {item.icon}
            </Link>
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-theme bg-theme-sidebar transition-all duration-300">
      <div className="flex h-14 items-center justify-between border-b border-theme px-4">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={isMobile ? onClose : undefined}>
          {companyLogo ? (
            <Image src={companyLogo} alt={companyName} width={24} height={24} className="h-6 w-6 object-contain" unoptimized />
          ) : (
            <Building2 className="h-6 w-6 text-blue-500" />
          )}
          <span className="font-semibold text-theme">{companyName}</span>
        </Link>
        <button
          onClick={isMobile ? onClose : () => setIsCollapsed(true)}
          className="rounded-lg p-2 text-theme-muted hover:bg-theme-hover hover:text-theme"
          aria-label={isMobile ? "Fechar menu" : "Colapsar menu"}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <nav className="h-[calc(100vh-7rem)] overflow-y-auto p-3" data-testid="sidebar-nav">
        <ul className="flex flex-col gap-0.5">
          {menuItems.map((item, index) => (
            <li key={item.label}>
              {/* Separador após Dashboard */}
              {index === 1 && (
                <div className="my-2 border-t border-theme/50" />
              )}
              {/* Separador antes de Tarefas */}
              {item.label === "Tarefas" && (
                <div className="my-2 border-t border-theme/50" />
              )}
              <MenuItemComponent
                item={item}
                isTopLevel
                isActive={isActive}
                hasActiveChild={hasActiveChild}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* Theme Switcher */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-theme p-3 bg-theme-sidebar">
        <div className="flex items-center justify-between">
          <span className="text-xs text-theme-muted">Tema</span>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-theme-tertiary">
            {themeOptions.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === value
                    ? "bg-blue-600 text-white"
                    : "text-theme-muted hover:text-theme hover:bg-theme-card"
                }`}
                title={label}
                aria-label={`Tema ${label}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
