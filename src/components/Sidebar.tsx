"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Home,
  Users,
  FileText,
  ShoppingCart,
  Warehouse,
  DollarSign,
  Factory,
  BarChart3,
  Settings,
  Receipt,
  TrendingUp,
  Building2,
} from "lucide-react";

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    label: "Compras",
    icon: <ShoppingCart className="h-5 w-5" />,
    children: [
      { label: "Materiais", href: "/materials" },
      { label: "Fornecedores", href: "/suppliers" },
      { label: "Cotações", href: "/quotes" },
      { label: "Ordens de Compra", href: "/purchase-orders" },
      { label: "Recebimento", href: "/receiving" },
      { label: "Requisições", href: "/requisitions" },
    ],
  },
  {
    label: "Estoque",
    icon: <Warehouse className="h-5 w-5" />,
    children: [
      { label: "Inventário", href: "/inventory" },
      { label: "Localizações", href: "/locations" },
      { label: "Transferências", href: "/transfers" },
      { label: "Picking List", href: "/picking" },
    ],
  },
  {
    label: "Vendas",
    icon: <Receipt className="h-5 w-5" />,
    children: [
      { label: "Clientes", href: "/customers" },
      { label: "Pedidos", href: "/sales" },
      { label: "Faturamento", href: "/billing" },
    ],
  },
  {
    label: "Financeiro",
    icon: <DollarSign className="h-5 w-5" />,
    children: [
      { label: "Contas a Pagar", href: "/payables" },
      { label: "Contas a Receber", href: "/receivables" },
      { label: "Tesouraria", href: "/treasury" },
      { label: "Aprovações", href: "/treasury/approvals" },
    ],
  },
  {
    label: "Fiscal",
    icon: <FileText className="h-5 w-5" />,
    children: [
      { label: "Notas Fiscais", href: "/invoices" },
      { label: "NFe Pendentes", href: "/invoices/pending" },
      { label: "Importar XML", href: "/invoices/import" },
    ],
  },
  {
    label: "Produção",
    icon: <Factory className="h-5 w-5" />,
    children: [
      { label: "Ordens de Produção", href: "/production" },
      { label: "BOM/Estrutura", href: "/engineering/bom" },
      { label: "MRP", href: "/production/mrp" },
      { label: "MES", href: "/production/mes" },
      { label: "OEE", href: "/production/oee" },
    ],
  },
  {
    label: "RH",
    icon: <Users className="h-5 w-5" />,
    children: [
      { label: "Funcionários", href: "/hr/employees" },
      { label: "Departamentos", href: "/hr/departments" },
      { label: "Folha de Ponto", href: "/hr/timesheet" },
      { label: "Folha de Pagamento", href: "/hr/payroll" },
      { label: "13º Salário", href: "/hr/thirteenth" },
      { label: "Férias", href: "/hr/vacations" },
      { label: "Rescisões", href: "/hr/terminations" },
    ],
  },
  {
    label: "Relatórios",
    icon: <BarChart3 className="h-5 w-5" />,
    children: [
      { label: "Visão Geral", href: "/reports" },
      { label: "Posição Estoque", href: "/reports/inventory-position" },
      { label: "Aging Pagar", href: "/reports/payables-aging" },
      { label: "Fluxo de Caixa", href: "/reports/cash-flow" },
    ],
  },
  {
    label: "BI & Gestão",
    icon: <TrendingUp className="h-5 w-5" />,
    children: [
      { label: "Business Intelligence", href: "/bi" },
      { label: "GPD", href: "/gpd" },
      { label: "Orçamento", href: "/budget" },
    ],
  },
  {
    label: "Sistema",
    icon: <Settings className="h-5 w-5" />,
    children: [
      { label: "Tarefas", href: "/tasks" },
      { label: "Notificações", href: "/notifications" },
      { label: "Workflow", href: "/workflow" },
      { label: "Auditoria", href: "/audit" },
      { label: "Configurações", href: "/settings" },
      { label: "Empresas", href: "/settings/companies" },
      { label: "Tokens de IA", href: "/settings/ai" },
      { label: "Design System", href: "/docs" },
    ],
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Em mobile, fechar sidebar ao navegar
  useEffect(() => {
    if (isMobile && onClose) {
      onClose();
    }
  }, [pathname, isMobile, onClose]);

  // Auto-expand menu based on current path
  const getActiveModule = () => {
    for (const item of menuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (pathname.startsWith(child.href)) {
            return item.label;
          }
        }
      }
    }
    return null;
  };

  // Mover para useEffect para evitar setState durante render
  useEffect(() => {
    const activeModule = getActiveModule();
    if (activeModule && !expandedItems.includes(activeModule)) {
      setExpandedItems((prev) => [...prev, activeModule]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  if (isCollapsed) {
    return (
      <aside className="fixed left-0 top-0 z-40 h-screen w-16 border-r border-zinc-800 bg-zinc-900 transition-all duration-300">
        <div className="flex h-14 items-center justify-center border-b border-zinc-800">
          <button
            onClick={() => setIsCollapsed(false)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Expandir menu"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-2" data-testid="sidebar-nav-collapsed">
          {menuItems.map((item) => {
            const targetHref = item.href || item.children?.[0]?.href || "/dashboard";
            return (
              <Link
                key={item.label}
                href={targetHref}
                className={`flex items-center justify-center rounded-lg p-3 transition-colors ${
                  (item.href && isActive(item.href)) ||
                  item.children?.some((c) => isActive(c.href))
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
                title={item.label}
                data-testid={`sidebar-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {item.icon}
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-zinc-900 transition-all duration-300">
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-500" />
          <span className="font-semibold text-white">FRM ERP</span>
        </Link>
        <button
          onClick={() => setIsCollapsed(true)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label="Colapsar menu"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <nav className="h-[calc(100vh-3.5rem)] overflow-y-auto p-3" data-testid="sidebar-nav">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-600 text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      item.children?.some((c) => isActive(c.href))
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {expandedItems.includes(item.label) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedItems.includes(item.label) && item.children && (
                    <ul className="ml-4 mt-1 space-y-1 border-l border-zinc-700 pl-4">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                              isActive(child.href)
                                ? "bg-blue-600 text-white"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            }`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
