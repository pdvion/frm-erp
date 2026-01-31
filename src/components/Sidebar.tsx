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
  CheckSquare,
  GitBranch,
  FolderOpen,
  Bell,
  Shield,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

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
      { label: "Devoluções", href: "/supplier-returns" },
      { label: "ImpEx", href: "/impex" },
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
      { label: "Contagem", href: "/inventory-count" },
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
      { label: "Dashboard", href: "/finance/dashboard" },
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
      { label: "Dashboard", href: "/fiscal/dashboard" },
      { label: "Notas Fiscais", href: "/invoices" },
      { label: "NFe Pendentes", href: "/invoices/pending" },
      { label: "Importar XML", href: "/invoices/import" },
      { label: "SPED", href: "/fiscal/sped" },
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
    label: "Tarefas",
    href: "/tasks",
    icon: <CheckSquare className="h-5 w-5" />,
  },
  {
    label: "Workflow",
    href: "/workflow",
    icon: <GitBranch className="h-5 w-5" />,
  },
  {
    label: "Documentos",
    href: "/documents",
    icon: <FolderOpen className="h-5 w-5" />,
  },
  {
    label: "Notificações",
    href: "/notifications",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    label: "Administração",
    icon: <Shield className="h-5 w-5" />,
    children: [
      { label: "Usuários", href: "/settings/users" },
      { label: "Grupos", href: "/settings/groups" },
      { label: "Empresas", href: "/settings/companies" },
      { label: "Auditoria", href: "/audit" },
      { label: "Logs de Acesso", href: "/admin/auth-logs" },
    ],
  },
  {
    label: "Configurações",
    icon: <Settings className="h-5 w-5" />,
    children: [
      { label: "Geral", href: "/settings" },
      { label: "Contas Bancárias", href: "/settings/bank-accounts" },
      { label: "Integração Email", href: "/settings/email-integration" },
      { label: "SEFAZ", href: "/settings/sefaz" },
      { label: "Tokens de IA", href: "/settings/ai" },
      { label: "Tutoriais", href: "/docs" },
      { label: "Design System", href: "/design-system" },
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
  const { theme, setTheme } = useTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
                    : "text-theme-muted hover:bg-theme-hover hover:text-theme"
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-theme bg-theme-sidebar transition-all duration-300">
      <div className="flex h-14 items-center justify-between border-b border-theme px-4">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={isMobile ? onClose : undefined}>
          <Building2 className="h-6 w-6 text-blue-500" />
          <span className="font-semibold text-theme">FRM ERP</span>
        </Link>
        <button
          onClick={isMobile ? onClose : () => setIsCollapsed(true)}
          className="rounded-lg p-2 text-theme-muted hover:bg-theme-hover hover:text-theme"
          aria-label={isMobile ? "Fechar menu" : "Colapsar menu"}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <nav className="h-[calc(100vh-7rem)] overflow-y-auto px-2 py-3" data-testid="sidebar-nav">
        <ul className="flex flex-col gap-0.5">
          {menuItems.map((item, index) => {
            // Separadores visuais entre seções principais
            const showSeparator = index === 1 || index === 10; // Após Dashboard e antes de Tarefas
            
            return (
              <li key={item.label}>
                {showSeparator && index === 1 && (
                  <div className="my-2 mx-2 border-t border-theme opacity-50" />
                )}
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-blue-600 text-white"
                        : "text-theme-secondary hover:bg-theme-hover hover:text-theme"
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        item.children?.some((c) => isActive(c.href))
                          ? "bg-theme-hover text-theme"
                          : "text-theme-secondary hover:bg-theme-hover hover:text-theme"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span className="flex-shrink-0">
                        {expandedItems.includes(item.label) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </span>
                    </button>
                    {expandedItems.includes(item.label) && item.children && (
                      <ul className="mt-1 ml-3 space-y-0.5 border-l-2 border-theme-tertiary pl-3">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                                isActive(child.href)
                                  ? "bg-blue-600 text-white font-medium"
                                  : "text-theme-muted hover:bg-theme-hover hover:text-theme"
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
                {showSeparator && index === 10 && (
                  <div className="my-2 mx-2 border-t border-theme opacity-50" />
                )}
              </li>
            );
          })}
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
